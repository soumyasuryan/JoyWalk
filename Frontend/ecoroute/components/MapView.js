'use client';

import { useEffect, useState, useMemo, useSyncExternalStore } from 'react';
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Polyline,
  Popup,
  Tooltip,
  useMap
} from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

// In-memory cache for fetched physical road geometries
const roadGeometryCache = new Map();

// Helper to fetch actual road and avenue coordinates connecting path checkpoints
async function fetchSnappedRoadGeometry(path, coordMap) {
  if (!path || path.length < 2) return null;
  const key = path.join('->');
  if (roadGeometryCache.has(key)) return roadGeometryCache.get(key);

  const coords = path.map((name) => coordMap.get(name)).filter(Boolean);
  if (coords.length < 2) return null;

  const coordsStr = coords.map(([lat, lon]) => `${lon},${lat}`).join(';');

  // 1. Try pedestrian foot network (sidewalks, pedestrian avenues, trails)
  try {
    const footUrl = `https://router.project-osrm.org/route/v1/foot/${coordsStr}?overview=full&geometries=geojson`;
    const res = await fetch(footUrl, { signal: AbortSignal.timeout(3500) });
    if (res.ok) {
      const data = await res.json();
      if (data.code === 'Ok' && data.routes?.[0]?.geometry?.coordinates?.length > 1) {
        const roadPoints = data.routes[0].geometry.coordinates.map(([lon, lat]) => [lat, lon]);
        roadGeometryCache.set(key, roadPoints);
        return roadPoints;
      }
    }
  } catch {
    // Try driving network fallback
  }

  // 2. Fallback to driving road network
  try {
    const driveUrl = `https://router.project-osrm.org/route/v1/driving/${coordsStr}?overview=full&geometries=geojson`;
    const res = await fetch(driveUrl, { signal: AbortSignal.timeout(3500) });
    if (res.ok) {
      const data = await res.json();
      if (data.code === 'Ok' && data.routes?.[0]?.geometry?.coordinates?.length > 1) {
        const roadPoints = data.routes[0].geometry.coordinates.map(([lon, lat]) => [lat, lon]);
        roadGeometryCache.set(key, roadPoints);
        return roadPoints;
      }
    }
  } catch {
    // Fallback to straight coords
  }

  roadGeometryCache.set(key, coords);
  return coords;
}

// Hydration detector for React 19
const emptySubscribe = () => () => {};
function useIsClient() {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
}

// Auto-fit map to route bounds
function RouteBounds({ routeCoords }) {
  const map = useMap();
  useEffect(() => {
    if (routeCoords && routeCoords.length > 1) {
      try {
        map.fitBounds(routeCoords, { padding: [60, 60], maxZoom: 14 });
      } catch (e) {
        // Map instance not ready
      }
    }
  }, [routeCoords, map]);
  return null;
}

// Auto-fit map to multiple routes
function MultiRouteBounds({ allCoords }) {
  const map = useMap();
  useEffect(() => {
    const flat = allCoords.filter(Boolean).flat();
    if (flat.length > 1) {
      try {
        map.fitBounds(flat, { padding: [60, 60], maxZoom: 14 });
      } catch (e) {
        // Map instance not ready
      }
    }
  }, [allCoords, map]);
  return null;
}

// Compare mode polyline styling (crisp, high-contrast, distinct)
const COMPARE_STYLES = {
  fastest: { color: '#2563eb', casingColor: '#ffffff', weight: 4.5, dashArray: '6 6', label: 'Fastest Direct Walk' },
  shadeSeeker: { color: '#047857', casingColor: '#ffffff', weight: 5.0, dashArray: null, label: 'Shade Seeker (>70% Canopy)' },
  moodCalibrated: { color: '#d97706', casingColor: '#ffffff', weight: 5.0, dashArray: null, label: 'Serenity & Joy Drift' }
};

export default function MapView({
  neighborhoods = [],
  currentRoute = null,
  source = '',
  target = '',
  mode = 'mood-calibrated',
  compareMode = false,
  comparisonResult = null,
  joyPins = [],
  selectedPin = null
}) {
  const isClient = useIsClient();
  const delhiCenter = [28.6139, 77.2090];

  // Coordinate lookup
  const coordMap = useMemo(() => {
    const map = new Map();
    neighborhoods.forEach((n) => {
      map.set(n.name, [n.lat, n.lon]);
    });
    return map;
  }, [neighborhoods]);

  const sourceName = source || currentRoute?.path?.[0] || '';
  const targetName = target || currentRoute?.path?.[currentRoute?.path?.length - 1] || '';

  // Single-route road-snapped coordinates state
  const [singleRoadCoords, setSingleRoadCoords] = useState(null);

  // Compare mode road-snapped coordinates state
  const [compareRoadCoords, setCompareRoadCoords] = useState({
    fastest: null,
    shadeSeeker: null,
    moodCalibrated: null
  });

  // Fetch physical road coordinates along computed path
  useEffect(() => {
    if (compareMode || !currentRoute?.path || currentRoute.path.length < 2) {
      setSingleRoadCoords(null);
      return;
    }
    let isMounted = true;
    const pathKey = currentRoute.path.join('->');

    if (roadGeometryCache.has(pathKey)) {
      setSingleRoadCoords(roadGeometryCache.get(pathKey));
      return;
    }

    fetchSnappedRoadGeometry(currentRoute.path, coordMap).then((pts) => {
      if (isMounted && pts && pts.length > 1) {
        setSingleRoadCoords(pts);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [compareMode, currentRoute?.path, coordMap]);

  // Fetch physical road coordinates for tri-mode comparison
  useEffect(() => {
    if (!compareMode || !comparisonResult) {
      setCompareRoadCoords({ fastest: null, shadeSeeker: null, moodCalibrated: null });
      return;
    }
    let isMounted = true;
    const shadeData = comparisonResult.shadeSeeker || comparisonResult.ecoSafe;
    const moodData = comparisonResult.moodCalibrated || comparisonResult.riskWeighted;

    const modes = [
      { key: 'fastest', path: comparisonResult.fastest?.path },
      { key: 'shadeSeeker', path: shadeData?.path },
      { key: 'moodCalibrated', path: moodData?.path }
    ];

    modes.forEach(({ key, path }) => {
      if (!path || path.length < 2) return;
      const pathKey = path.join('->');
      if (roadGeometryCache.has(pathKey)) {
        if (isMounted) {
          setCompareRoadCoords((prev) => ({ ...prev, [key]: roadGeometryCache.get(pathKey) }));
        }
        return;
      }

      fetchSnappedRoadGeometry(path, coordMap).then((pts) => {
        if (isMounted && pts && pts.length > 1) {
          setCompareRoadCoords((prev) => ({ ...prev, [key]: pts }));
        }
      });
    });

    return () => {
      isMounted = false;
    };
  }, [compareMode, comparisonResult, coordMap]);

  // Active single-route geometry: physical road coordinates with instant waypoint fallback
  const activeGeometry = useMemo(() => {
    if (singleRoadCoords && singleRoadCoords.length > 1) return singleRoadCoords;
    if (currentRoute?.path && currentRoute.path.length > 1) {
      return currentRoute.path.map((name) => coordMap.get(name)).filter(Boolean);
    }
    return [];
  }, [singleRoadCoords, currentRoute?.path, coordMap]);

  // Active compare-mode geometries: physical road coordinates with instant waypoint fallback
  const activeCompareGeometries = useMemo(() => {
    if (!compareMode || !comparisonResult) return {};
    const toFallbackCoords = (path) =>
      path && path.length > 1 ? path.map((name) => coordMap.get(name)).filter(Boolean) : null;

    const shadeData = comparisonResult.shadeSeeker || comparisonResult.ecoSafe;
    const moodData = comparisonResult.moodCalibrated || comparisonResult.riskWeighted;

    return {
      fastest: compareRoadCoords.fastest || toFallbackCoords(comparisonResult.fastest?.path),
      shadeSeeker: compareRoadCoords.shadeSeeker || toFallbackCoords(shadeData?.path),
      moodCalibrated: compareRoadCoords.moodCalibrated || toFallbackCoords(moodData?.path)
    };
  }, [compareMode, comparisonResult, compareRoadCoords, coordMap]);

  const allCompareCoords = useMemo(() => {
    return Object.values(activeCompareGeometries).filter(Boolean).flat();
  }, [activeCompareGeometries]);

  // Clean, vibrant route color based on mode
  const getRouteColor = () => {
    if (mode === 'fastest') return '#2563eb'; // Clean, crisp Royal Blue for fastest
    if (mode === 'shade-seeker' || mode === 'eco-safe') return '#047857'; // Lush deep forest green
    return '#10b981'; // Crisp botanical emerald for mood drift
  };

  const hasActiveRoute = !compareMode && currentRoute?.path && activeGeometry.length > 1;
  const hasCompareRoutes = compareMode && allCompareCoords.length > 1;

  if (!isClient) {
    return (
      <div className="w-full h-full min-h-[580px] lg:h-[640px] bg-[#0c1611] rounded-2xl flex items-center justify-center text-emerald-400/80 text-sm font-medium">
        Loading Delhi NCR Map Canvas...
      </div>
    );
  }

  return (
    <div className="relative w-full h-[580px] lg:h-[640px] rounded-2xl overflow-hidden border border-white/10 shadow-xl bg-[#0c1611]">
      <MapContainer
        center={delhiCenter}
        zoom={12}
        scrollWheelZoom={true}
        className="w-full h-full z-0"
        style={{ height: '100%', width: '100%', background: '#f2f5f3' }}
      >
        {/* Official OpenStreetMap: 100% free, public, and requires zero API keys */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
        />

        {/* === COMPARE MODE: 3 routes displayed simultaneously with crisp casing === */}
        {hasCompareRoutes && (
          <>
            {Object.entries(activeCompareGeometries).map(([key, coords]) => {
              if (!coords || coords.length < 2) return null;
              const style = COMPARE_STYLES[key] || { color: '#10b981', weight: 4.5 };
              return (
                <div key={`compare-group-${key}`}>
                  {/* Outer crisp white casing */}
                  <Polyline
                    key={`compare-casing-${key}`}
                    positions={coords}
                    pathOptions={{
                      color: '#ffffff',
                      weight: style.weight + 3,
                      opacity: 0.95,
                      lineCap: 'round',
                      lineJoin: 'round'
                    }}
                  />
                  {/* Core colorful route line */}
                  <Polyline
                    key={`compare-core-${key}`}
                    positions={coords}
                    pathOptions={{
                      color: style.color,
                      weight: style.weight,
                      opacity: 1,
                      dashArray: style.dashArray,
                      lineCap: 'round',
                      lineJoin: 'round'
                    }}
                  />
                </div>
              );
            })}
            <MultiRouteBounds allCoords={[allCompareCoords]} />
          </>
        )}

        {/* === SINGLE ROUTE: High-definition crisp dual-layer casing (NO HAZY GLOW) === */}
        {hasActiveRoute && (
          <>
            {/* Layer 1: High-contrast white casing (eliminates haziness and sharpens line against any background) */}
            <Polyline
              key={`route-casing-${sourceName}-${targetName}-${mode}`}
              positions={activeGeometry}
              pathOptions={{
                color: '#ffffff',
                weight: 7.5,
                opacity: 0.95,
                lineCap: 'round',
                lineJoin: 'round'
              }}
            />
            {/* Layer 2: Core solid, vibrant route line */}
            <Polyline
              key={`route-core-${sourceName}-${targetName}-${mode}`}
              positions={activeGeometry}
              pathOptions={{
                color: getRouteColor(),
                weight: 4.8,
                opacity: 1,
                lineCap: 'round',
                lineJoin: 'round'
              }}
            />
            <RouteBounds routeCoords={activeGeometry} />
          </>
        )}

        {/* Community Pocket of Joy Pins */}
        {joyPins.map((pin) => {
          const isSelected = selectedPin?.id === pin.id;
          return (
            <CircleMarker
              key={pin.id}
              center={[pin.lat, pin.lon]}
              radius={isSelected ? 9 : 6.5}
              pathOptions={{
                color: '#ffffff',
                weight: 1.8,
                fillColor: '#f59e0b',
                fillOpacity: 0.95
              }}
            >
              <Tooltip direction="top" offset={[0, -6]}>
                <div className="text-xs font-semibold text-slate-900">
                  {pin.title}
                  <span className="block text-[10px] text-slate-600 font-normal">
                    {pin.category} · {pin.neighborhood}
                  </span>
                </div>
              </Tooltip>
              <Popup>
                <div className="space-y-1.5 p-1 text-xs">
                  <div className="font-bold text-amber-300 text-sm">{pin.title}</div>
                  <div className="text-[11px] text-emerald-400 font-medium">
                    {pin.category} · 📍 {pin.neighborhood}
                  </div>
                  <p className="text-slate-200 text-xs leading-relaxed pt-1">
                    {pin.description}
                  </p>
                  <div className="pt-2 border-t border-white/10 flex justify-between items-center text-[10px] text-slate-400">
                    <span>Added by {pin.author || 'Local Walker'}</span>
                    <span className="text-amber-400 font-semibold font-mono">
                      💛 {pin.likes || 1} likes
                    </span>
                  </div>
                </div>
              </Popup>
            </CircleMarker>
          );
        })}

        {/* Delhi NCR Spatial Haven Nodes (Clean, crisp markers) */}
        {neighborhoods.map((node) => {
          const isSource = sourceName === node.name;
          const isTarget = targetName === node.name;
          const isPromenade = node.isPromenade || node.isWarehouse;

          const fillColor = isSource
            ? '#2563eb' // Blue for Start
            : isTarget
            ? '#059669' // Emerald for Destination
            : node.greenCanopyIndex >= 75
            ? '#10b981'
            : node.greenCanopyIndex >= 50
            ? '#34d399'
            : '#94a3b8';

          const radius = isSource || isTarget ? 8.5 : isPromenade ? 6 : 4.5;

          return (
            <CircleMarker
              key={node.name}
              center={[node.lat, node.lon]}
              radius={radius}
              pathOptions={{
                color: isSource || isTarget ? '#ffffff' : 'rgba(255,255,255,0.8)',
                weight: isSource || isTarget ? 2.5 : 1.2,
                fillColor,
                fillOpacity: isSource || isTarget ? 1 : 0.85
              }}
            >
              <Tooltip direction="top" offset={[0, -6]}>
                <div className="text-xs font-semibold text-slate-900">
                  {node.name}
                  <span className="block text-[10px] text-slate-600 font-normal">
                    {node.greenCanopyIndex}% Canopy · {node.noiseLevelDb} dB
                  </span>
                </div>
              </Tooltip>

              <Popup>
                <div className="space-y-1.5 p-1 text-xs min-w-[190px]">
                  <div className="flex items-center justify-between pb-1 border-b border-white/10">
                    <span className="font-bold text-sm text-white">{node.name}</span>
                    {isPromenade && (
                      <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded font-medium">
                        Promenade
                      </span>
                    )}
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>Tree Canopy:</span>
                    <strong className="text-emerald-300 font-mono">{node.greenCanopyIndex}%</strong>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>Acoustic Loudness:</span>
                    <strong className="text-teal-300 font-mono">{node.noiseLevelDb} dB</strong>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>Micro-Moments:</span>
                    <strong className="text-amber-300 font-mono">{node.joyMomentDensity} spots</strong>
                  </div>
                  {isSource && (
                    <div className="text-[11px] font-semibold text-blue-400 pt-1 border-t border-white/10">
                      ● Active Origin Haven (Start)
                    </div>
                  )}
                  {isTarget && (
                    <div className="text-[11px] font-semibold text-emerald-400 pt-1 border-t border-white/10">
                      ● Active Destination Haven (End)
                    </div>
                  )}
                </div>
              </Popup>
            </CircleMarker>
          );
        })}
      </MapContainer>

      {/* Floating Status / Legend Bar (Minimalist, Crisp & Non-Intrusive) */}
      <div className="absolute top-4 right-4 z-[1000] bg-[#0f1813]/92 backdrop-blur-md px-3.5 py-2 rounded-xl border border-white/10 shadow-lg text-xs text-slate-200 flex items-center gap-3">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#10b981]" />
          <span className="text-[11px] text-slate-300">Lush Canopy</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#f59e0b]" />
          <span className="text-[11px] text-slate-300">Joy Pin</span>
        </div>
        {hasActiveRoute && (
          <div className="pl-2 border-l border-white/10 flex items-center gap-1.5">
            <span className="text-emerald-400 font-semibold font-mono text-[11px]">
              {currentRoute.totalDistance} km · {currentRoute.estimatedWalkingMinutes} min
            </span>
          </div>
        )}
      </div>

      {/* When no route is computed yet: Clean helper prompt */}
      {!hasActiveRoute && !hasCompareRoutes && (
        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-[1000] bg-[#0f1813]/92 backdrop-blur-md px-4 py-2.5 rounded-full border border-white/10 shadow-2xl text-xs text-slate-200 pointer-events-none flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Type or select an origin and destination to view your scenic drift route</span>
        </div>
      )}
    </div>
  );
}
