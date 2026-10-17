'use client';

import { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import Controls from '@/components/Controls';
import MetricsPanel from '@/components/MetricsPanel';
import JoyPinsPanel from '@/components/JoyPinsPanel';
import WellbeingMetricsPanel from '@/components/WellbeingMetricsPanel';

// Dynamically import Leaflet MapView with SSR disabled
const MapView = dynamic(() => import('@/components/MapView'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[580px] lg:h-[640px] bg-[#0c1611] border border-white/10 rounded-2xl flex items-center justify-center text-emerald-400/80 text-sm font-medium">
      Loading Delhi NCR Scenic Map...
    </div>
  )
});

export default function JoyWalkDashboard() {
  // --- Active Tab in Left Sidebar: 'plan' | 'joypins' | 'journal' ---
  const [activeTab, setActiveTab] = useState('plan');

  // --- Spatial Network Data ---
  const [neighborhoods, setNeighborhoods] = useState([]);
  const [roads, setRoads] = useState([]);
  const [joyPins, setJoyPins] = useState([]);
  const [selectedPin, setSelectedPin] = useState(null);
  const [wellbeingData, setWellbeingData] = useState({
    shadedKmWalked: 3.8,
    dailyGoalKm: 5.0,
    joyMomentsUnlocked: 11,
    joyMomentsGoal: 15,
    serenityStreakDays: 4,
    acousticSerenityAvgDb: 47.5,
    completedWalks: []
  });

  // --- Route Inputs ---
  const [source, setSource] = useState('Lodhi Art District & Gardens');
  const [target, setTarget] = useState('Sunder Nursery Heritage Park');
  const [mode, setMode] = useState('mood-calibrated');
  const [mood, setMood] = useState('Reflective');
  const [serenityWeight, setSerenityWeight] = useState(1.0);

  // --- Route Output: Starts as null so map is completely clean initially ---
  const [currentRoute, setCurrentRoute] = useState(null);

  // --- Compare Mode ---
  const [compareMode, setCompareMode] = useState(false);
  const [comparisonResult, setComparisonResult] = useState(null);

  // --- Dynamic Golden Hour State ---
  const [goldenHourActive, setGoldenHourActive] = useState(false);
  const [loadingGoldenHour, setLoadingGoldenHour] = useState(false);

  // --- Loading Flags ---
  const [loadingRoute, setLoadingRoute] = useState(false);
  const [loadingCompare, setLoadingCompare] = useState(false);
  const [loadingCommit, setLoadingCommit] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [toast, setToast] = useState(null);

  // Toast Helper
  const showToast = useCallback((message, borderColor = 'border-emerald-500') => {
    setToast({ message, borderColor });
    setTimeout(() => {
      setToast((prev) => (prev?.message === message ? null : prev));
    }, 4500);
  }, []);

  // ── Fetch Spatial Data ───────────────────────────────────────────────────────

  const fetchJoyPins = useCallback(async () => {
    try {
      const res = await fetch('/api/joy-pins');
      if (!res.ok) return;
      const data = await res.json();
      setJoyPins(data.joyPins || []);
    } catch (err) {
      console.error('Fetch joy pins error:', err);
    }
  }, []);

  const fetchWellbeing = useCallback(async () => {
    try {
      const res = await fetch('/api/wellbeing');
      if (!res.ok) return;
      const data = await res.json();
      setWellbeingData(data);
    } catch (err) {
      console.error('Fetch wellbeing error:', err);
    }
  }, []);

  const fetchNeighborhoods = useCallback(async () => {
    try {
      const res = await fetch('/api/neighborhoods');
      if (!res.ok) throw new Error('Failed to fetch spatial havens');
      const data = await res.json();
      const nodes = data.neighborhoods || [];
      setNeighborhoods(nodes);
      setRoads(data.roads || []);
      return nodes;
    } catch (err) {
      console.error('Fetch neighborhoods error:', err);
      showToast('Could not load spatial haven data', 'border-rose-500');
      return [];
    }
  }, [showToast]);

  // ── Route Calculation (Triggered when user clicks Calculate or changes inputs) ──

  const calculateRoute = useCallback(
    async (
      src = source,
      tgt = target,
      currentMode = mode,
      currentMood = mood,
      currentWeight = serenityWeight,
      showToastMsg = true
    ) => {
      if (!src || !tgt) return;
      setLoadingRoute(true);
      try {
        const body = {
          source: src,
          target: tgt,
          mode: currentMode,
          mood: currentMood,
          serenityWeight: currentWeight,
          commit: false
        };

        const res = await fetch('/api/route', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to compute scenic walk');

        setCurrentRoute(data);
        if (showToastMsg) {
          showToast(`Scenic route mapped: ${data.avgCanopyIndex}% canopy shade (${data.estimatedWalkingMinutes} min walk)`, 'border-emerald-500');
        }
      } catch (err) {
        console.error('Route calculation error:', err);
        showToast(err.message || 'Route calculation failed', 'border-rose-500');
      } finally {
        setLoadingRoute(false);
      }
    },
    [source, target, mode, mood, serenityWeight, showToast]
  );

  // ── Compare Mode ───────────────────────────────────────────────────────────

  const handleCompareWith = useCallback(
    async (
      src = source,
      tgt = target,
      currentMood = mood,
      currentWeight = serenityWeight,
      showToastMsg = true
    ) => {
      const activeSrc = src || source;
      const activeTgt = tgt || target;
      if (!activeSrc || !activeTgt) return;

      setLoadingCompare(true);
      try {
        const res = await fetch('/api/compare', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            source: activeSrc,
            target: activeTgt,
            mood: currentMood,
            serenityWeight: currentWeight
          })
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || 'Failed to evaluate walking modes');
        }

        const data = await res.json();
        setComparisonResult(data);
        if (showToastMsg) {
          showToast('Tri-mode evaluation complete: Fastest, Shade Seeker & Mood Drift', 'border-teal-500');
        }
      } catch (err) {
        console.warn('Compare error:', err);
        showToast(err.message || 'Comparison failed', 'border-rose-500');
      } finally {
        setLoadingCompare(false);
      }
    },
    [source, target, mood, serenityWeight, showToast]
  );

  const handleCompare = useCallback(async () => {
    await handleCompareWith(source, target, mood, serenityWeight, true);
  }, [handleCompareWith, source, target, mood, serenityWeight]);

  // ── Initial Load: Clean map without pre-drawn routes ─────────────────────────

  useEffect(() => {
    let isMounted = true;
    async function init() {
      setInitialLoading(true);
      const [nodes] = await Promise.all([
        fetchNeighborhoods(),
        fetchJoyPins(),
        fetchWellbeing()
      ]);

      if (isMounted && nodes.length > 0) {
        const lodhiNode = nodes.find((n) => n.name.includes('Lodhi'));
        const sunderNode = nodes.find((n) => n.name.includes('Sunder'));
        if (lodhiNode) setSource(lodhiNode.name);
        if (sunderNode) setTarget(sunderNode.name);
        // Note: We intentionally do NOT call calculateRoute here so the map starts clean!
      }

      if (isMounted) setInitialLoading(false);
    }
    init();
    return () => {
      isMounted = false;
    };
  }, [fetchNeighborhoods, fetchJoyPins, fetchWellbeing]);

  // ── Input Changes ──────────────────────────────────────────────────────────

  const handleSourceChange = (newSource) => {
    setSource(newSource);
    if (compareMode) {
      handleCompareWith(newSource, target, mood, serenityWeight, false);
    } else if (currentRoute) {
      calculateRoute(newSource, target, mode, mood, serenityWeight, false);
    }
  };

  const handleTargetChange = (newTarget) => {
    setTarget(newTarget);
    if (compareMode) {
      handleCompareWith(source, newTarget, mood, serenityWeight, false);
    } else if (currentRoute) {
      calculateRoute(source, newTarget, mode, mood, serenityWeight, false);
    }
  };

  const handleModeChange = (newMode) => {
    setMode(newMode);
    if (!compareMode && currentRoute) {
      calculateRoute(source, target, newMode, mood, serenityWeight, true);
    }
  };

  const handleMoodChange = (newMood) => {
    setMood(newMood);
    if (compareMode) {
      handleCompareWith(source, target, newMood, serenityWeight, false);
    } else if (currentRoute && mode === 'mood-calibrated') {
      calculateRoute(source, target, mode, newMood, serenityWeight, true);
    }
  };

  const handleSerenityWeightChange = (newWeight) => {
    setSerenityWeight(newWeight);
    if (compareMode) {
      handleCompareWith(source, target, mood, newWeight, false);
    } else if (currentRoute) {
      calculateRoute(source, target, mode, mood, newWeight, false);
    }
  };

  const handleCompareModeToggle = (val) => {
    setCompareMode(val);
    if (val) {
      setCurrentRoute(null);
      handleCompareWith(source, target, mood, serenityWeight, true);
    } else {
      setComparisonResult(null);
    }
  };

  // ── Dynamic Golden Hour Simulation ─────────────────────────────────────────

  const handleTriggerGoldenHour = async () => {
    setLoadingGoldenHour(true);
    try {
      const res = await fetch('/api/golden-hour', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to simulate golden hour');

      setGoldenHourActive(data.goldenHourActive);
      await fetchNeighborhoods();

      if (compareMode) {
        await handleCompare();
      } else if (currentRoute && source && target) {
        await calculateRoute(source, target, mode, mood, serenityWeight, false);
      }

      showToast(data.message, data.goldenHourActive ? 'border-amber-500' : 'border-emerald-500');
    } catch (err) {
      console.error('Golden hour error:', err);
      showToast(err.message || 'Simulation error', 'border-rose-500');
    } finally {
      setLoadingGoldenHour(false);
    }
  };

  // ── Joy Pins Actions ───────────────────────────────────────────────────────

  const handleAddJoyPin = async (pinData) => {
    try {
      const res = await fetch('/api/joy-pins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pinData)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to drop pin');

      await fetchJoyPins();
      showToast(`Placed "${pinData.title}" on the scenic map`, 'border-amber-400');
    } catch (err) {
      showToast(err.message || 'Error dropping pin', 'border-rose-500');
    }
  };

  const handleLikeJoyPin = async (pinId) => {
    try {
      const res = await fetch('/api/joy-pins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'like', pinId })
      });
      if (res.ok) {
        setJoyPins((prev) =>
          prev.map((p) => (p.id === pinId ? { ...p, likes: (p.likes || 0) + 1 } : p))
        );
      }
    } catch (err) {
      console.error('Like pin error:', err);
    }
  };

  // ── Commit Walk to Serenity Journal ────────────────────────────────────────

  const handleCommitWalk = async () => {
    if (!currentRoute?.path) return;
    setLoadingCommit(true);
    try {
      const res = await fetch('/api/wellbeing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'log',
          routeName: `${source} ➔ ${target}`,
          distance: currentRoute.totalDistance,
          avgCanopy: currentRoute.avgCanopyIndex,
          joyPoints: currentRoute.totalJoyMoments
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      await fetchWellbeing();
      showToast('Walk logged to your Serenity Journal', 'border-emerald-400');
    } catch (err) {
      showToast(err.message || 'Failed to log walk', 'border-rose-500');
    } finally {
      setLoadingCommit(false);
    }
  };

  const handleResetJournal = async () => {
    try {
      const res = await fetch('/api/wellbeing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reset' })
      });
      if (res.ok) {
        await fetchWellbeing();
        showToast('Daily serenity journal reset', 'border-teal-400');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen flex flex-col bg-[#09110d] text-slate-100">
      {/* Top Header */}
      <header className="bg-[#0b1410] border-b border-white/10 sticky top-0 z-50">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Brand Identity */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-sm shadow-sm">
              JW
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-base tracking-tight text-white font-display">
                  JoyWalk
                </span>
                <span className="text-xs text-slate-500 font-normal">/</span>
                <span className="text-xs text-slate-300 font-medium">
                  Scenic Drift Navigator
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                Pedestrian routes optimized for shade canopy, acoustic quietude &amp; joy · Delhi NCR
              </p>
            </div>
          </div>

          {/* Status & Quick Stats */}
          <div className="flex items-center gap-3">
            {goldenHourActive && (
              <span className="text-xs font-semibold text-amber-300 bg-amber-950/70 border border-amber-600/50 px-2.5 py-1 rounded-full flex items-center gap-1.5 golden-badge">
                <span>🌅 Golden Hour Corridors</span>
              </span>
            )}

            <div className="hidden sm:flex items-center gap-2 bg-[#121f18] border border-white/10 px-3 py-1.5 rounded-xl text-xs text-slate-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span className="font-medium text-emerald-300">52 Havens</span>
              <span className="text-slate-600">·</span>
              <span className="text-slate-400">176 Shaded Corridors</span>
            </div>
          </div>
        </div>
      </header>

      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-20 right-6 z-[2000] max-w-sm transition-all duration-300">
          <div
            className={`bg-[#0f1813] border border-white/10 rounded-xl p-3.5 shadow-2xl flex items-center justify-between gap-3 text-xs border-l-4 ${toast.borderColor} text-slate-100`}
          >
            <span className="font-medium text-slate-200">{toast.message}</span>
            <button
              type="button"
              onClick={() => setToast(null)}
              className="text-slate-400 hover:text-white font-bold px-1 cursor-pointer"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Main App Workspace */}
      <main className="max-w-[1440px] mx-auto px-4 sm:px-6 py-6 flex-1 w-full">
        {initialLoading ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-4">
              <div className="prod-card p-5 h-96 animate-pulse bg-[#0f1813]" />
            </div>
            <div className="lg:col-span-8">
              <div className="h-[580px] bg-[#0c1611] rounded-2xl animate-pulse" />
            </div>
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-6 items-start">
            {/* Left Column: Tabbed Navigation & Controls */}
            <div className="w-full lg:w-[380px] flex-none flex flex-col gap-4">
              {/* Tab Selector */}
              <div className="flex bg-[#121f18] border border-white/10 rounded-xl p-1 gap-1">
                <button
                  type="button"
                  onClick={() => setActiveTab('plan')}
                  className={`flex-1 py-1.5 text-center text-xs rounded-lg font-medium transition-all cursor-pointer ${
                    activeTab === 'plan'
                      ? 'bg-emerald-600 text-white font-semibold shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Plan Drift
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('joypins')}
                  className={`flex-1 py-1.5 text-center text-xs rounded-lg font-medium transition-all cursor-pointer ${
                    activeTab === 'joypins'
                      ? 'bg-emerald-600 text-white font-semibold shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Joy Pins ({joyPins.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('journal')}
                  className={`flex-1 py-1.5 text-center text-xs rounded-lg font-medium transition-all cursor-pointer ${
                    activeTab === 'journal'
                      ? 'bg-emerald-600 text-white font-semibold shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Daily Journal
                </button>
              </div>

              {/* Tab 1: Plan Walk */}
              {activeTab === 'plan' && (
                <Controls
                  neighborhoods={neighborhoods}
                  source={source}
                  setSource={handleSourceChange}
                  target={target}
                  setTarget={handleTargetChange}
                  mode={mode}
                  setMode={handleModeChange}
                  mood={mood}
                  setMood={handleMoodChange}
                  serenityWeight={serenityWeight}
                  setSerenityWeight={handleSerenityWeightChange}
                  onCalculate={() => calculateRoute(source, target, mode, mood, serenityWeight, true)}
                  onGoldenHourTriggered={handleTriggerGoldenHour}
                  loading={loadingRoute}
                  goldenHourLoading={loadingGoldenHour}
                  goldenHourActive={goldenHourActive}
                  compareMode={compareMode}
                  setCompareMode={handleCompareModeToggle}
                  onCompare={handleCompare}
                  loadingCompare={loadingCompare}
                />
              )}

              {/* Tab 2: Joy Pins Community Feed */}
              {activeTab === 'joypins' && (
                <JoyPinsPanel
                  joyPins={joyPins}
                  neighborhoods={neighborhoods}
                  onAddPin={handleAddJoyPin}
                  onLikePin={handleLikeJoyPin}
                  onSelectPin={(pin) => setSelectedPin(pin)}
                  loading={false}
                />
              )}

              {/* Tab 3: Daily Journal */}
              {activeTab === 'journal' && (
                <WellbeingMetricsPanel
                  wellbeingData={wellbeingData}
                  onResetJournal={handleResetJournal}
                  loading={loadingCommit}
                />
              )}
            </div>

            {/* Right Column: Full-Featured Map & Route Summary Card */}
            <div className="flex-1 min-w-0 flex flex-col gap-5 w-full">
              {/* Map Canvas */}
              <MapView
                neighborhoods={neighborhoods}
                currentRoute={currentRoute}
                source={source}
                target={target}
                mode={mode}
                compareMode={compareMode}
                comparisonResult={comparisonResult}
                joyPins={joyPins}
                selectedPin={selectedPin}
              />

              {/* Route Results & Serenity Score */}
              <MetricsPanel
                currentRoute={currentRoute}
                neighborhoods={neighborhoods}
                mode={mode}
                loading={loadingRoute}
                compareMode={compareMode}
                comparisonResult={comparisonResult}
                loadingCompare={loadingCompare}
                onCommitRoute={handleCommitWalk}
              />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
