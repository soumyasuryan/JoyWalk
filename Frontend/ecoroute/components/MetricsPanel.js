'use client';

export default function MetricsPanel({
  currentRoute = null,
  neighborhoods = [],
  mode = 'mood-calibrated',
  loading = false,
  compareMode = false,
  comparisonResult = null,
  loadingCompare = false,
  loadingCommit = false,
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
        <div className="prod-card animate-pulse p-3">
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
        <div className="prod-card border-dashed border-white/10 p-3 text-center">
          <p className="text-xs text-slate-400">
            Click &ldquo;Compare All 3 Modes Side-by-Side&rdquo; to analyze trade-offs between speed, canopy shade, and serenity.
          </p>
        </div>
      );
    }

    const { fastest, shadeSeeker, moodCalibrated, ecoSafe, riskWeighted } = comparisonResult;
    const activeShade = shadeSeeker || ecoSafe;
    const activeMood = moodCalibrated || riskWeighted;
    const selectedRoute =
      mode === 'fastest' ? fastest : mode === 'shade-seeker' ? activeShade : activeMood;
    const selectedRouteLabel =
      mode === 'fastest' ? 'Fastest Walk' : mode === 'shade-seeker' ? 'Shade Seeker' : 'Scenic Drift';

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
      <div className="prod-card flex flex-col gap-3 p-3 text-slate-100 md:max-h-full md:overflow-y-auto">
        <div className="flex items-center justify-between border-b border-white/10 pb-2">
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

        {selectedRoute?.path && (
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-emerald-700/40 bg-emerald-950/20 px-3 py-2">
            <div>
              <div className="text-sm font-bold text-white">
                {selectedRoute.estimatedWalkingMinutes} min · {selectedRoute.totalDistance} km
              </div>
              <div className="text-[10px] text-slate-400">
                {selectedRouteLabel} · Serenity {selectedRoute.serenityScore} / 100
              </div>
            </div>
            {onCommitRoute && (
              <button
                type="button"
                onClick={() => onCommitRoute(selectedRoute)}
                disabled={loadingCommit}
                className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white shadow-md transition-colors hover:bg-emerald-500 disabled:cursor-wait disabled:opacity-60"
              >
                {loadingCommit ? 'Saving...' : 'Log Walk'}
              </button>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
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
                className={`flex flex-col justify-between gap-2 rounded-xl border ${borderClass} bg-[#121f18] p-3 shadow-md`}
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
                  <span className="mb-2 block font-mono text-[10px] text-slate-400">{badge}</span>

                  <div className="space-y-1.5 text-xs">
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

                <div className="flex items-center justify-between border-t border-white/10 pt-2">
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
      <div className="prod-card flex items-center justify-between p-3 text-slate-300">
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
  const fastest = comparisonResult?.fastest;
  const roundDelta = (value, digits = 1) =>
    Number((value || 0).toFixed(digits));
  const formatDelta = (value, digits = 1) => {
    const rounded = roundDelta(value, digits);
    return `${rounded > 0 ? '+' : ''}${rounded}`;
  };
  const selectedModeLabel =
    mode === 'fastest' ? 'Fastest Walk' : mode === 'shade-seeker' ? 'Shade Seeker' : 'Scenic Drift';

  return (
    <div className="prod-card flex flex-col gap-2.5 p-3 text-slate-100">
      {/* Route Headline Banner */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-display text-base font-extrabold text-white">
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
        <div className="flex shrink-0 items-center gap-2">
          <div className="rounded-xl border border-emerald-500/40 bg-[#121f18] px-2.5 py-1 text-right">
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
              disabled={loadingCommit}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs px-3.5 py-2.5 rounded-xl transition-all cursor-pointer shadow-md disabled:cursor-wait disabled:opacity-60"
            >
              {loadingCommit ? 'Saving...' : 'Log Walk'}
            </button>
          )}
        </div>
      </div>

      {fastest?.path && (
        <details className="rounded-xl border border-white/10 bg-[#121f18]">
          <summary className="cursor-pointer px-3 py-2 text-xs font-semibold text-slate-200">
            {selectedModeLabel} vs. Fastest Walk
            <span className="ml-2 text-[10px] font-normal text-slate-500">
              Difference from shortest-distance route
            </span>
          </summary>
          <div className="grid grid-cols-2 gap-2 border-t border-white/10 p-3 sm:grid-cols-5">
            <div>
              <div className="text-[10px] text-slate-500">Extra time</div>
              <div className={`text-sm font-mono font-semibold ${estimatedWalkingMinutes > fastest.estimatedWalkingMinutes ? 'text-amber-300' : 'text-emerald-300'}`}>
                {formatDelta(estimatedWalkingMinutes - fastest.estimatedWalkingMinutes, 0)} min
              </div>
            </div>
            <div>
              <div className="text-[10px] text-slate-500">Extra distance</div>
              <div className={`text-sm font-mono font-semibold ${totalDistance > fastest.totalDistance ? 'text-amber-300' : 'text-emerald-300'}`}>
                {formatDelta(totalDistance - fastest.totalDistance)} km
              </div>
            </div>
            <div>
              <div className="text-[10px] text-slate-500">Canopy</div>
              <div className={`text-sm font-mono font-semibold ${avgCanopyIndex >= fastest.avgCanopyIndex ? 'text-emerald-300' : 'text-amber-300'}`}>
                {formatDelta(avgCanopyIndex - fastest.avgCanopyIndex)} pp
              </div>
            </div>
            <div>
              <div className="text-[10px] text-slate-500">Noise</div>
              <div className={`text-sm font-mono font-semibold ${avgNoiseDb <= fastest.avgNoiseDb ? 'text-emerald-300' : 'text-amber-300'}`}>
                {formatDelta(avgNoiseDb - fastest.avgNoiseDb)} dB
              </div>
            </div>
            <div>
              <div className="text-[10px] text-slate-500">Micro-moments</div>
              <div className={`text-sm font-mono font-semibold ${totalJoyMoments >= fastest.totalJoyMoments ? 'text-emerald-300' : 'text-amber-300'}`}>
                {formatDelta(totalJoyMoments - fastest.totalJoyMoments, 0)} gems
              </div>
            </div>
          </div>
        </details>
      )}

      {totalDistance > 5 && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-950/30 px-3 py-2 text-xs text-amber-200">
          This is a long walk (~{estimatedWalkingMinutes} min). Try a nearby haven for a scenic stroll.
        </div>
      )}

      {/* 3 Key Metric Cards */}
      <div className="grid grid-cols-3 gap-2">
        {/* Tree Canopy */}
        <div className="flex min-w-0 flex-col justify-between rounded-xl border border-white/10 bg-[#121f18] p-2.5">
          <div className="flex flex-wrap items-center gap-1 text-[10px] font-semibold text-slate-400">
            <span>Tree Canopy Cover</span>
            <span
              className="text-[9px] font-medium text-slate-500"
              title="Estimated from modelled corridor data."
            >
              est.
            </span>
          </div>
          <div className="my-1.5">
            <span className="font-mono text-xl font-bold text-emerald-300">
              {avgCanopyIndex}%
            </span>
          </div>
          <div className={`line-clamp-1 w-fit rounded border px-1.5 py-0.5 text-[9px] font-semibold ${canopyTier.badgeClass}`}>
            {canopyTier.label}
          </div>
        </div>

        {/* Acoustic Decibels */}
        <div className="flex min-w-0 flex-col justify-between rounded-xl border border-white/10 bg-[#121f18] p-2.5">
          <div className="flex flex-wrap items-center gap-1 text-[10px] font-semibold text-slate-400">
            <span>Ambient Acoustic Level</span>
            <span
              className="text-[9px] font-medium text-slate-500"
              title="Estimated from modelled corridor data."
            >
              est.
            </span>
          </div>
          <div className="my-1.5">
            <span className="font-mono text-xl font-bold text-teal-300">
              {avgNoiseDb} <span className="text-xs font-normal text-slate-400">dB</span>
            </span>
          </div>
          <div className={`line-clamp-1 text-[9px] font-medium ${noiseTier.textClass}`}>
            {noiseTier.label}
          </div>
        </div>

        {/* Micro-Moments of Joy */}
        <div className="flex min-w-0 flex-col justify-between rounded-xl border border-white/10 bg-[#121f18] p-2.5">
          <div className="flex flex-wrap items-center gap-1 text-[10px] font-semibold text-slate-400">
            <span>Micro-Moments Unlocked</span>
            <span
              className="text-[9px] font-medium text-slate-500"
              title="Estimated from modelled corridor data."
            >
              est.
            </span>
          </div>
          <div className="my-1.5">
            <span className="font-mono text-xl font-bold text-amber-300">
              {totalJoyMoments} <span className="text-xs font-normal text-slate-400">gems</span>
            </span>
          </div>
          <div className="line-clamp-1 text-[9px] text-slate-400">
            Historic markers, murals &amp; fountains
          </div>
        </div>
      </div>
    </div>
  );
}
