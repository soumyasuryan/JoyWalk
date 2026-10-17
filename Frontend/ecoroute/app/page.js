'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import dynamic from 'next/dynamic';
import Controls from '@/components/Controls';
import MetricsPanel from '@/components/MetricsPanel';
import JoyPinsPanel from '@/components/JoyPinsPanel';
import WellbeingMetricsPanel from '@/components/WellbeingMetricsPanel';

const JOURNAL_STORAGE_KEY = 'joywalk-daily-journal';
const EMPTY_WELLBEING_JOURNAL = {
  shadedKmWalked: 0,
  dailyGoalKm: 5,
  joyMomentsUnlocked: 0,
  joyMomentsGoal: 15,
  serenityStreakDays: 0,
  acousticSerenityAvgDb: 0,
  completedWalks: [],
  lastWalkDate: null
};

function localDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

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
  const [wellbeingData, setWellbeingData] = useState(EMPTY_WELLBEING_JOURNAL);

  // --- Route Inputs ---
  const [source, setSource] = useState('Gurgaon Cyber Green Promenade');
  const [target, setTarget] = useState('Connaught Place');
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
  const autoRouteStartedRef = useRef(false);
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
      const saved = window.localStorage.getItem(JOURNAL_STORAGE_KEY);
      if (!saved) {
        setWellbeingData(EMPTY_WELLBEING_JOURNAL);
        return;
      }

      const parsed = JSON.parse(saved);
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        throw new Error('Saved journal data has an invalid format.');
      }
      setWellbeingData({
        ...EMPTY_WELLBEING_JOURNAL,
        ...parsed,
        completedWalks: Array.isArray(parsed.completedWalks) ? parsed.completedWalks : []
      });
    } catch (err) {
      console.error('Could not load the saved wellbeing journal:', err);
      setWellbeingData(EMPTY_WELLBEING_JOURNAL);
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
        setComparisonResult(null);
        try {
          const compareRes = await fetch('/api/compare', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              source: src,
              target: tgt,
              mood: currentMood,
              serenityWeight: currentWeight
            })
          });
          if (!compareRes.ok) {
            throw new Error(`Comparison request failed with status ${compareRes.status}`);
          }
          const compareData = await compareRes.json();
          if (!compareData.fastest?.path) {
            console.warn('Fastest comparison route is unavailable; showing route metrics only.');
          } else {
            setComparisonResult(compareData);
          }
        } catch (compareError) {
          console.warn('Fastest comparison is unavailable; showing route metrics only.', compareError);
        }

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
        const defaultSource = nodes.find((n) => n.name === 'Gurgaon Cyber Green Promenade');
        const defaultTarget = nodes.find((n) => n.name === 'Connaught Place');
        if (defaultSource) setSource(defaultSource.name);
        if (defaultTarget) setTarget(defaultTarget.name);
      }

      if (isMounted) setInitialLoading(false);
    }
    init();
    return () => {
      isMounted = false;
    };
  }, [fetchNeighborhoods, fetchJoyPins, fetchWellbeing]);

  useEffect(() => {
    if (initialLoading || autoRouteStartedRef.current || neighborhoods.length === 0) return;
    autoRouteStartedRef.current = true;
    calculateRoute(source, target, mode, mood, serenityWeight, false);
  }, [
    initialLoading,
    neighborhoods.length,
    calculateRoute,
    source,
    target,
    mode,
    mood,
    serenityWeight
  ]);

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

  const handleCommitWalk = async (routeToLog = currentRoute) => {
    if (!routeToLog?.path) return;
    setLoadingCommit(true);
    try {
      const distance = Number(routeToLog.totalDistance);
      const avgCanopy = Number(routeToLog.avgCanopyIndex);
      const joyPoints = Number(routeToLog.totalJoyMoments);
      if (
        !Number.isFinite(distance) ||
        distance < 0 ||
        !Number.isFinite(avgCanopy) ||
        avgCanopy < 0 ||
        avgCanopy > 100 ||
        !Number.isFinite(joyPoints) ||
        joyPoints < 0
      ) {
        throw new Error('The current route metrics are invalid and cannot be logged.');
      }

      const now = new Date();
      const today = localDateKey(now);
      const walk = {
        id: `walk-${now.getTime()}`,
        date: `Today, ${now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`,
        route: `${source} ➔ ${target}`,
        distance,
        avgCanopy,
        joyPoints
      };
      const nextJournal = {
        ...wellbeingData,
        shadedKmWalked:
          Math.round((wellbeingData.shadedKmWalked + distance * (avgCanopy / 100)) * 10) / 10,
        joyMomentsUnlocked: wellbeingData.joyMomentsUnlocked + joyPoints,
        serenityStreakDays:
          wellbeingData.lastWalkDate === today
            ? wellbeingData.serenityStreakDays
            : wellbeingData.serenityStreakDays + 1,
        lastWalkDate: today,
        completedWalks: [walk, ...wellbeingData.completedWalks].slice(0, 30)
      };
      window.localStorage.setItem(JOURNAL_STORAGE_KEY, JSON.stringify(nextJournal));
      setWellbeingData(nextJournal);
      showToast('Walk logged to your Serenity Journal', 'border-emerald-400');
    } catch (err) {
      console.error('Could not save completed walk:', err);
      showToast(err.message || 'Failed to log walk', 'border-rose-500');
    } finally {
      setLoadingCommit(false);
    }
  };

  const handleResetJournal = async () => {
    try {
      const resetJournal = {
        ...EMPTY_WELLBEING_JOURNAL,
        serenityStreakDays: wellbeingData.serenityStreakDays,
        lastWalkDate: wellbeingData.lastWalkDate
      };
      window.localStorage.setItem(JOURNAL_STORAGE_KEY, JSON.stringify(resetJournal));
      setWellbeingData(resetJournal);
      showToast('Daily serenity journal reset', 'border-teal-400');
    } catch (err) {
      console.error('Could not reset the saved wellbeing journal:', err);
      showToast(err.message || 'Failed to reset journal', 'border-rose-500');
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="flex min-h-dvh flex-col overflow-x-hidden bg-[#09110d] text-slate-100 lg:h-dvh lg:min-h-0 lg:overflow-hidden">
      {/* Top Header */}
      <header className="z-50 shrink-0 border-b border-white/10 bg-[#0b1410]">
        <div className="mx-auto flex h-12 max-w-[1600px] items-center justify-between px-3 sm:px-4">
          {/* Brand Identity */}
          <div className="flex items-center gap-3">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-600 text-sm font-bold text-white shadow-sm">
              JW
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-display text-sm font-bold tracking-tight text-white">
                  JoyWalk
                </span>
                <span className="text-xs text-slate-500 font-normal">/</span>
                <span className="text-[11px] font-medium text-slate-300">
                  Scenic Drift Navigator
                </span>
              </div>
              <p className="hidden text-[10px] text-slate-400 lg:block">
                Pedestrian routes optimized for shade canopy, acoustic quietude &amp; joy · Delhi NCR
              </p>
            </div>
          </div>

          {/* Status & Quick Stats */}
          <div className="flex items-center gap-2">
            {goldenHourActive && (
              <span className="flex items-center gap-1.5 rounded-full border border-amber-600/50 bg-amber-950/70 px-2 py-1 text-[10px] font-semibold text-amber-300 golden-badge">
                <span>🌅 Golden Hour</span>
              </span>
            )}

            <div className="hidden items-center gap-2 rounded-xl border border-white/10 bg-[#121f18] px-2.5 py-1 text-[10px] text-slate-300 sm:flex">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span className="font-medium text-emerald-300">52 Havens</span>
              <span className="text-slate-600">·</span>
              <span className="text-slate-400">176 Corridors</span>
            </div>
          </div>
        </div>
      </header>

      {/* Toast Notification */}
      {toast && (
        <div className="fixed right-4 top-14 z-[2000] max-w-sm transition-all duration-300">
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
      <main className="mx-auto flex w-full max-w-[1600px] flex-1 flex-col px-3 py-3 md:min-h-0 md:grid md:grid-cols-[280px_minmax(0,1fr)] md:gap-3 md:overflow-hidden lg:grid-cols-[340px_minmax(0,1fr)] lg:px-4">
        {initialLoading ? (
          <div className="grid min-h-0 grid-cols-1 gap-3 md:col-span-2 md:grid-cols-[280px_minmax(0,1fr)] lg:grid-cols-[340px_minmax(0,1fr)]">
            <div className="prod-card h-56 animate-pulse bg-[#0f1813] md:h-full" />
            <div className="h-[48dvh] min-h-[280px] animate-pulse rounded-2xl bg-[#0c1611] md:h-full md:min-h-0" />
          </div>
        ) : (
          <div className="flex min-h-0 flex-col gap-3 md:col-span-2 md:grid md:grid-cols-[280px_minmax(0,1fr)] md:items-stretch lg:grid-cols-[340px_minmax(0,1fr)]">
            {/* Left Column: Tabbed Navigation & Controls */}
            <div className="flex w-full flex-col gap-2 md:min-h-0 md:overflow-hidden">
              {/* Tab Selector */}
              <div className="flex shrink-0 gap-1 rounded-xl border border-white/10 bg-[#121f18] p-1">
                <button
                  type="button"
                  onClick={() => setActiveTab('plan')}
                  className={`flex-1 rounded-lg py-1.5 text-center text-[11px] font-medium transition-all cursor-pointer ${
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
                  className={`flex-1 rounded-lg py-1.5 text-center text-[11px] font-medium transition-all cursor-pointer ${
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
                  className={`flex-1 rounded-lg py-1.5 text-center text-[11px] font-medium transition-all cursor-pointer ${
                    activeTab === 'journal'
                      ? 'bg-emerald-600 text-white font-semibold shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Daily Journal
                </button>
              </div>

              {/* Tab 1: Plan Walk */}
              <div className="md:min-h-0 md:flex-1 md:overflow-hidden">
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
            </div>

            {/* Right Column: Full-Featured Map & Route Summary Card */}
            <div className="flex min-w-0 flex-col gap-2.5 md:min-h-0 md:grid md:grid-rows-[minmax(0,1fr)_minmax(230px,38%)]">
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
              <div className="md:min-h-0 md:overflow-y-auto md:overscroll-contain">
                <MetricsPanel
                currentRoute={currentRoute}
                neighborhoods={neighborhoods}
                mode={mode}
                loading={loadingRoute}
                compareMode={compareMode}
                comparisonResult={comparisonResult}
                loadingCompare={loadingCompare}
                loadingCommit={loadingCommit}
                onCommitRoute={handleCommitWalk}
                />
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
