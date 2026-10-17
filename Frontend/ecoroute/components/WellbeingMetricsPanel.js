'use client';

export default function WellbeingMetricsPanel({
  wellbeingData = {
    shadedKmWalked: 3.8,
    dailyGoalKm: 5.0,
    joyMomentsUnlocked: 11,
    joyMomentsGoal: 15,
    serenityStreakDays: 4,
    acousticSerenityAvgDb: 47.5,
    completedWalks: []
  },
  onResetJournal,
  loading = false
}) {
  const {
    shadedKmWalked = 3.8,
    dailyGoalKm = 5.0,
    joyMomentsUnlocked = 11,
    joyMomentsGoal = 15,
    serenityStreakDays = 4,
    acousticSerenityAvgDb = 47.5,
    completedWalks = []
  } = wellbeingData || {};

  const kmPct = Math.min(100, Math.round((shadedKmWalked / (dailyGoalKm || 5.0)) * 100));
  const joyPct = Math.min(100, Math.round((joyMomentsUnlocked / (joyMomentsGoal || 15)) * 100));

  return (
    <div className="prod-card p-5 flex flex-col gap-4 text-slate-100">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-white/10">
        <div>
          <h3 className="text-sm font-bold text-white font-display">
            Daily Serenity &amp; Canopy Journal
          </h3>
          <p className="text-xs text-slate-400">
            Personal mindful walking progress and streak
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono font-bold text-amber-300 bg-amber-950/50 border border-amber-600/40 px-2 py-0.5 rounded-full">
            🔥 {serenityStreakDays}-Day Streak
          </span>
          <button
            type="button"
            onClick={onResetJournal}
            disabled={loading}
            className="text-[11px] text-slate-400 hover:text-white px-2 py-0.5 transition-colors cursor-pointer"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Progress Rows */}
      <div className="space-y-3">
        {/* Shaded Canopy Km */}
        <div className="bg-[#121f18] border border-white/5 rounded-xl p-3.5">
          <div className="flex justify-between items-center mb-1.5 text-xs">
            <span className="font-semibold text-slate-200">Shaded Tree Canopy Walked</span>
            <span className="font-mono text-emerald-400 font-bold">
              {shadedKmWalked.toFixed(1)} / {dailyGoalKm.toFixed(1)} km
            </span>
          </div>
          <div className="w-full bg-slate-800/80 rounded-full h-2 overflow-hidden">
            <div
              className="h-full rounded-full bg-emerald-500 transition-all duration-500"
              style={{ width: `${kmPct}%` }}
            />
          </div>
          <div className="flex justify-between items-center mt-1.5 text-[10px] text-slate-400 font-mono">
            <span>Daily Canopy Goal</span>
            <span className="text-emerald-300 font-medium">{kmPct}% Completed</span>
          </div>
        </div>

        {/* Micro-Moments */}
        <div className="bg-[#121f18] border border-white/5 rounded-xl p-3.5">
          <div className="flex justify-between items-center mb-1.5 text-xs">
            <span className="font-semibold text-slate-200">Micro-Moments Discovered</span>
            <span className="font-mono text-amber-300 font-bold">
              {joyMomentsUnlocked} / {joyMomentsGoal} spots
            </span>
          </div>
          <div className="w-full bg-slate-800/80 rounded-full h-2 overflow-hidden">
            <div
              className="h-full rounded-full bg-amber-500 transition-all duration-500"
              style={{ width: `${joyPct}%` }}
            />
          </div>
          <div className="flex justify-between items-center mt-1.5 text-[10px] text-slate-400 font-mono">
            <span>Street Art, Plaques &amp; Nooks</span>
            <span className="text-amber-300 font-medium">{joyPct}% Completed</span>
          </div>
        </div>
      </div>

      {/* Recent Walks */}
      {completedWalks && completedWalks.length > 0 && (
        <div className="pt-2 border-t border-white/10">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Logged Walks Today
          </div>
          <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
            {completedWalks.map((w, idx) => (
              <div
                key={w.id || idx}
                className="bg-[#121f18] border border-white/5 rounded-lg p-2.5 text-xs flex justify-between items-center"
              >
                <div>
                  <div className="font-medium text-white">{w.route}</div>
                  <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                    {w.date} · {w.distance} km
                  </div>
                </div>
                <div className="text-right font-mono text-[11px]">
                  <span className="text-emerald-300 font-semibold">{w.avgCanopy}% shade</span>
                  <div className="text-[10px] text-amber-400">+{w.joyPoints} joy pts</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
