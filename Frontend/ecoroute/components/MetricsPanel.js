'use client';

export default function MetricsPanel({
  currentRoute = null,
  neighborhoods = [],
  mode = 'mood-calibrated',
  loading = false,
  compareMode = false,
  comparisonResult = null,
  loadingCompare = false,
  onCommitRoute,
  onSelectMode
}) {
  const getCanopyBadge = (canopy) => {
    if (canopy >= 80) return { label: 'Lush Forest Canopy', badgeClass: 'bg-emerald-950/80 text-emerald-300 border-emerald-700/60' };
    if (canopy >= 65) return { label: 'Shaded Green Corridor', badgeClass: 'bg-teal-950/80 text-teal-300 border-teal-700/60' };
    if (canopy >= 45) return { label: 'Moderate Tree Cover', badgeClass: 'bg-amber-950/80 text-amber-300 border-amber-700/60' };
    return { label: 'Exposed to Sun', badgeClass: 'bg-rose-950/80 text-rose-300 border-rose-700/60' };
  };

  const getNoiseBadge = (db) => {
    if (db <= 46) return { label: 'Quiet Whisper (<46 dB)', textClass: 'text-emerald-400' };
    if (db <= 55) return { label: 'Gentle Park Murmur (47-55 dB)', textClass: 'text-teal-400' };
    if (db <= 65) return { label: 'Suburban Ambient (56-65 dB)', textClass: 'text-amber-400' };
    return { label: 'Urban Traffic (>65 dB)', textClass: 'text-rose-400' };
  };

  // --- COMPARE MODE ---
  if (compareMode) {
    if (loadingCompare) {
      return (
        <div className="prod-card p-5 animate-pulse">
          <div className="h-4 w-48 bg-emerald-950/80 rounded mb-4" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-[#121f18] rounded-xl" />
            ))}
          </div>
        </div>
      );
    }

    if (!comparisonResult) {
      return (
        <div className="prod-card p-5 text-center border-dashed border-white/10">
          <p className="text-xs text-slate-400">
            Click &ldquo;Compare All 3 Modes Side-by-Side&rdquo; to analyze trade-offs between speed, canopy shade, and serenity.
          </p>
        </div>
      );
    }

    const { fastest, shadeSeeker, moodCalibrated, ecoSafe, riskWeighted } = comparisonResult;
    const activeShade = shadeSeeker || ecoSafe;
    const activeMood = moodCalibrated || riskWeighted;

    const rows = [
      {
        id: 'fastest',
        title: 'Fastest Direct Walk',
        data: fastest,
        colorDot: '#64748b',
        borderClass: 'border-slate-700',
        badge: 'Shortest Distance'
      },
      {
        id: 'shade-seeker',
        title: 'Shade Seeker',
        data: activeShade,
        colorDot: '#059669',
        borderClass: 'border-emerald-600/80',
        badge: 'Max Canopy (>70%)'
      },
      {
        id: 'mood-calibrated',
        title: 'Serenity & Joy Drift',
        data: activeMood,
        colorDot: '#f59e0b',
        borderClass: 'border-amber-500/80',
        badge: 'Optimized Well-Being'
      }
    ];

    const validRows = rows.filter((r) => r.data?.path);
    const bestDist = validRows.length > 0 ? Math.min(...validRows.map((r) => r.data.totalDistance || Infinity)) : null;
    const bestCanopy = validRows.length > 0 ? Math.max(...validRows.map((r) => r.data.avgCanopyIndex || -Infinity)) : null;
    const bestNoise = validRows.length > 0 ? Math.min(...validRows.map((r) => r.data.avgNoiseDb || Infinity)) : null;
    const bestJoy = validRows.length > 0 ? Math.max(...validRows.map((r) => r.data.totalJoyMoments || -Infinity)) : null;

    return (
      <div className="prod-card p-5 flex flex-col gap-4 text-slate-100">
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div>
            <h3 className="text-sm font-bold text-white font-display">
              Tri-Mode Route Comparison
            </h3>
            <p className="text-xs text-slate-400">
              Side-by-side trade-offs across geometry, tree cover, and acoustic comfort
            </p>
          </div>
          <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800/40 px-2.5 py-0.5 rounded-full">
            3 Strategies
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          {rows.map(({ id, title, data, colorDot, borderClass, badge }) => {
            if (!data?.path) {
              return (
                <div key={id} className="bg-[#121f18] border border-white/10 rounded-xl p-3.5 text-xs text-slate-400">
                  <div className="font-semibold text-white mb-1">{title}</div>
                  <p className="text-[11px]">No continuous walking path found.</p>
                </div>
              );
            }

            const isBestDist = data.totalDistance === bestDist;
            const isBestCanopy = data.avgCanopyIndex === bestCanopy;
            const isBestNoise = data.avgNoiseDb === bestNoise;
            const isBestJoy = data.totalJoyMoments === bestJoy;

            return (
              <div
                key={id}
                className={`bg-[#121f18] border ${borderClass} rounded-xl p-4 flex flex-col justify-between gap-3 shadow-md`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-sm text-white flex items-center gap-1.5 font-display">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: colorDot }} />
                      <span>{title}</span>
                    </span>
                    <span className="text-[11px] font-mono text-emerald-400 font-semibold bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800/40">
                      {data.estimatedWalkingMinutes} min
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono block mb-3">{badge}</span>

                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Distance</span>
                      <span className={`font-mono ${isBestDist ? 'text-emerald-400 font-bold' : 'text-slate-200'}`}>
                        {data.totalDistance} km {isBestDist && '✓'}
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Canopy Cover</span>
                      <span className={`font-mono ${isBestCanopy ? 'text-emerald-300 font-bold' : 'text-slate-200'}`}>
                        {data.avgCanopyIndex}% {isBestCanopy && '✓'}
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Ambient Noise</span>
                      <span className={`font-mono ${isBestNoise ? 'text-teal-300 font-bold' : 'text-slate-200'}`}>
                        {data.avgNoiseDb} dB {isBestNoise && '✓'}
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Joy Micro-Moments</span>
                      <span className={`font-mono ${isBestJoy ? 'text-amber-400 font-bold' : 'text-slate-200'}`}>
                        {data.totalJoyMoments} spots {isBestJoy && '✓'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-2.5 border-t border-white/10 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">Serenity Index</span>
                  <span className="text-xs font-mono font-bold text-emerald-300 bg-emerald-950/80 border border-emerald-700/50 px-2 py-0.5 rounded-md">
                    {data.serenityScore || 85} / 100
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // --- SINGLE ROUTE MODE: When no route calculated yet ---
  if (!currentRoute?.path || currentRoute.path.length < 2) {
    return (
      <div className="prod-card p-5 flex items-center justify-between text-slate-300">
        <div>
          <div className="font-bold text-white text-sm font-display">
            Awaiting Drift Parameters
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Choose an origin and destination above, then click &ldquo;Calculate Scenic Route&rdquo; to view route geometry and serenity scores.
          </p>
        </div>
        <div className="hidden sm:flex items-center gap-4 text-xs font-mono text-slate-400 pl-4 border-l border-white/10 shrink-0">
          <div>
            <div className="font-bold text-white">52 Havens</div>
            <div className="text-[10px]">Connected</div>
          </div>
          <div>
            <div className="font-bold text-emerald-400">&gt;70% Shade</div>
            <div className="text-[10px]">Filter Ready</div>
          </div>
        </div>
      </div>
    );
  }

  // --- ACTIVE ROUTE SUMMARY ---
  const {
    totalDistance = 0,
    estimatedWalkingMinutes = 0,
    avgCanopyIndex = 70,
    avgNoiseDb = 50,
    totalJoyMoments = 5,
    serenityScore = 80,
    path = []
  } = currentRoute;

  const canopyTier = getCanopyBadge(avgCanopyIndex);
  const noiseTier = getNoiseBadge(avgNoiseDb);

  return (
    <div className="prod-card p-5 flex flex-col gap-4 text-slate-100">
      {/* Route Headline Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-white/10 gap-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-lg font-extrabold text-white font-display">
              {estimatedWalkingMinutes} min walk
            </span>
            <span className="text-slate-500">·</span>
            <span className="text-sm font-mono text-slate-300 font-semibold">
              {totalDistance} km
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1.5">
            <span>Route:</span>
            <span className="text-emerald-300 font-medium">{path[0]}</span>
            <span>➔</span>
            <span className="text-teal-300 font-medium">{path[path.length - 1]}</span>
          </p>
        </div>

        {/* Serenity Score Badge */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="bg-[#121f18] border border-emerald-500/40 rounded-xl px-3.5 py-1.5 text-right">
            <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
              Serenity Score
            </div>
            <div className="text-base font-bold font-mono text-emerald-300">
              {serenityScore} <span className="text-xs font-normal text-slate-400">/ 100</span>
            </div>
          </div>
          {onCommitRoute && (
            <button
              type="button"
              onClick={onCommitRoute}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs px-3.5 py-2.5 rounded-xl transition-all cursor-pointer shadow-md"
            >
              Log Walk
            </button>
          )}
        </div>
      </div>

      {/* 3 Key Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Tree Canopy */}
        <div className="bg-[#121f18] border border-white/10 rounded-xl p-3.5 flex flex-col justify-between">
          <div className="text-xs font-semibold text-slate-400">Tree Canopy Cover</div>
          <div className="my-1.5">
            <span className="text-2xl font-bold font-mono text-emerald-300">
              {avgCanopyIndex}%
            </span>
          </div>
          <div className={`text-[10px] font-semibold px-2 py-0.5 rounded border inline-block w-fit ${canopyTier.badgeClass}`}>
            {canopyTier.label}
          </div>
        </div>

        {/* Acoustic Decibels */}
        <div className="bg-[#121f18] border border-white/10 rounded-xl p-3.5 flex flex-col justify-between">
          <div className="text-xs font-semibold text-slate-400">Ambient Acoustic Level</div>
          <div className="my-1.5">
            <span className="text-2xl font-bold font-mono text-teal-300">
              {avgNoiseDb} <span className="text-xs font-normal text-slate-400">dB</span>
            </span>
          </div>
          <div className={`text-[10px] font-medium ${noiseTier.textClass}`}>
            {noiseTier.label}
          </div>
        </div>

        {/* Micro-Moments of Joy */}
        <div className="bg-[#121f18] border border-white/10 rounded-xl p-3.5 flex flex-col justify-between">
          <div className="text-xs font-semibold text-slate-400">Micro-Moments Unlocked</div>
          <div className="my-1.5">
            <span className="text-2xl font-bold font-mono text-amber-300">
              {totalJoyMoments} <span className="text-xs font-normal text-slate-400">gems</span>
            </span>
          </div>
          <div className="text-[10px] text-slate-400">
            Historic markers, murals &amp; fountains
          </div>
        </div>
      </div>
    </div>
  );
}
