'use client';

import SearchableHavenInput from './SearchableHavenInput';

const MOODS = [
  {
    id: 'Stressed',
    label: 'Restorative',
    tagline: 'Quiet avenues & dense canopy shade',
    accentBorder: 'border-emerald-500/60 bg-emerald-950/30 text-emerald-300'
  },
  {
    id: 'Curious',
    label: 'Cultural',
    tagline: 'Murals, monuments & artisan tea nooks',
    accentBorder: 'border-amber-500/60 bg-amber-950/30 text-amber-300'
  },
  {
    id: 'Energetic',
    label: 'Brisk Walk',
    tagline: 'Open pedestrian corridors & airflow',
    accentBorder: 'border-teal-500/60 bg-teal-950/30 text-teal-300'
  },
  {
    id: 'Reflective',
    label: 'Contemplative',
    tagline: 'Water features, banyans & quietude',
    accentBorder: 'border-emerald-400/60 bg-emerald-950/40 text-emerald-200'
  }
];

const PRESET_DRIFTS = [
  { label: 'Lodhi ➔ Sunder Nursery', from: 'Lodhi Art District & Gardens', to: 'Sunder Nursery Heritage Park' },
  { label: 'Civil Lines ➔ Northern Ridge', from: 'Civil Lines', to: 'Model Town' },
  { label: 'Chanakyapuri ➔ Hauz Khas', from: 'Chanakyapuri', to: 'Hauz Khas' }
];

export default function Controls({
  neighborhoods = [],
  source = '',
  setSource,
  target = '',
  setTarget,
  mode = 'mood-calibrated',
  setMode,
  mood = 'Reflective',
  setMood,
  serenityWeight = 1.0,
  setSerenityWeight,
  onCalculate,
  onGoldenHourTriggered,
  loading = false,
  goldenHourLoading = false,
  goldenHourActive = false,
  compareMode = false,
  setCompareMode,
  onCompare,
  loadingCompare = false
}) {
  const sliderPercentage = Math.round((serenityWeight / 2.0) * 100);

  const handleSliderChange = (e) => {
    const val = (parseFloat(e.target.value) / 100) * 2.0;
    setSerenityWeight(Math.round(val * 10) / 10);
  };

  const handleSwap = () => {
    const temp = source;
    setSource(target);
    setTarget(temp);
  };

  const handleApplyPreset = (preset) => {
    setSource(preset.from);
    setTarget(preset.to);
  };

  return (
    <div className="prod-card p-5 flex flex-col gap-4 text-slate-100">
      {/* Card Title */}
      <div className="flex items-center justify-between pb-3 border-b border-white/10">
        <div>
          <h2 className="text-base font-bold text-white font-display tracking-tight">
            Plan a Scenic Drift
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Pedestrian routes tailored for shade canopy &amp; mental peace
          </p>
        </div>
        <button
          type="button"
          onClick={onGoldenHourTriggered}
          disabled={goldenHourLoading}
          className={`text-xs px-2.5 py-1 rounded-lg border font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
            goldenHourActive
              ? 'bg-amber-950/60 border-amber-500/50 text-amber-300 golden-badge'
              : 'bg-[#121f18] border-white/10 text-slate-300 hover:border-amber-500/40 hover:text-amber-300'
          }`}
          title="Simulate evening golden hour sunlight & breeze corridors"
        >
          <span>{goldenHourActive ? '🌅 Active' : '🌅 Golden Hour'}</span>
        </button>
      </div>

      {/* Quick Trail Presets */}
      <div>
        <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
          Curated Walking Presets
        </div>
        <div className="flex flex-wrap gap-1.5">
          {PRESET_DRIFTS.map((p) => {
            const isMatch = source === p.from && target === p.to;
            return (
              <button
                key={p.label}
                type="button"
                onClick={() => handleApplyPreset(p)}
                className={`text-[11px] px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                  isMatch
                    ? 'bg-emerald-950/70 border-emerald-500/60 text-emerald-300 font-semibold'
                    : 'bg-[#121f18] border-white/10 text-slate-300 hover:border-white/20'
                }`}
              >
                {p.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Type-to-Search Origin & Destination with Swap button */}
      <div className="flex flex-col gap-2.5 relative">
        {/* Origin Haven with Autocomplete Search */}
        <SearchableHavenInput
          label="Origin Haven (From)"
          value={source}
          onChange={setSource}
          neighborhoods={neighborhoods}
          placeholder="Type to search starting haven (e.g. Lodhi, CP)..."
          dotColor="bg-emerald-400"
        />

        {/* Swap button floating divider */}
        <div className="flex justify-end -my-1 pr-3 z-10">
          <button
            type="button"
            onClick={handleSwap}
            className="w-7 h-7 rounded-full bg-[#1b2b22] border border-white/15 text-slate-300 hover:text-white hover:border-emerald-500 flex items-center justify-center text-xs transition-all shadow-sm cursor-pointer"
            title="Swap Origin and Destination"
          >
            ⇅
          </button>
        </div>

        {/* Destination Haven with Autocomplete Search */}
        <SearchableHavenInput
          label="Destination Haven (To)"
          value={target}
          onChange={setTarget}
          neighborhoods={neighborhoods}
          placeholder="Type to search destination haven (e.g. Sunder Nursery)..."
          dotColor="bg-teal-400"
        />
      </div>

      {/* Walk Vibe / Mood Selector */}
      <div className="pt-2 border-t border-white/10">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-slate-300">Walk Vibe &amp; Mood</span>
          <span className="text-[11px] font-mono text-emerald-400 font-semibold">
            {MOODS.find((option) => option.id === mood)?.label || mood}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {MOODS.map((m) => {
            const isSelected = (mood || 'Reflective').toLowerCase() === m.id.toLowerCase();
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => setMood && setMood(m.id)}
                className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col gap-0.5 ${
                  isSelected
                    ? `${m.accentBorder} shadow-sm font-semibold`
                    : 'bg-[#121f18] border-white/10 text-slate-300 hover:border-white/20'
                }`}
              >
                <div className="text-xs font-semibold text-white">{m.label}</div>
                <div
                  className="text-[10px] text-slate-400 leading-tight line-clamp-2"
                  title={m.tagline}
                >
                  {m.tagline}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Speed vs Serenity Slider */}
      <div className="pt-2 border-t border-white/10">
        <div className="flex items-center justify-between mb-1.5 text-xs">
          <span className="font-semibold text-slate-300">Pacing vs. Serenity</span>
          <span className="font-mono text-xs font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/40">
            {sliderPercentage}% Serenity Focus
          </span>
        </div>
        <input
          type="range"
          min="0"
          max="100"
          value={sliderPercentage}
          onChange={handleSliderChange}
          className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer"
        />
        <div className="flex justify-between text-[10px] text-slate-400 mt-1 font-mono">
          <span>Direct Physical Path</span>
          <span>Max Shaded Quietude</span>
        </div>
      </div>

      {/* Routing Strategy Segmented Control */}
      <div className="pt-2 border-t border-white/10">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-slate-300">Routing Mode</span>
          <label className="text-[11px] flex items-center gap-1.5 text-slate-400 cursor-pointer">
            <input
              type="checkbox"
              checked={compareMode}
              onChange={(e) => setCompareMode(e.target.checked)}
              className="rounded accent-emerald-500 cursor-pointer"
            />
            <span>Compare 3 Modes</span>
          </label>
        </div>

        {!compareMode && (
          <div className="grid grid-cols-3 gap-1.5 bg-[#121f18] p-1 rounded-xl border border-white/10">
            <button
              type="button"
              onClick={() => setMode('mood-calibrated')}
              className={`py-1.5 text-center rounded-lg text-xs font-medium transition-all cursor-pointer ${
                mode === 'mood-calibrated' || mode === 'risk-weighted'
                  ? 'bg-emerald-600 text-white font-semibold shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Scenic Drift
            </button>
            <button
              type="button"
              onClick={() => setMode('shade-seeker')}
              className={`py-1.5 text-center rounded-lg text-xs font-medium transition-all cursor-pointer ${
                mode === 'shade-seeker' || mode === 'eco-safe'
                  ? 'bg-emerald-700 text-white font-semibold shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Shade Seeker
            </button>
            <button
              type="button"
              onClick={() => setMode('fastest')}
              className={`py-1.5 text-center rounded-lg text-xs font-medium transition-all cursor-pointer ${
                mode === 'fastest'
                  ? 'bg-slate-700 text-white font-semibold shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Fastest Walk
            </button>
          </div>
        )}
      </div>

      {/* Primary Action Button */}
      <div className="sticky bottom-0 z-20 -mx-5 -mb-5 bg-[#0f1813]/95 px-5 pb-5 pt-3 backdrop-blur">
        {compareMode ? (
          <button
            type="button"
            onClick={onCompare}
            disabled={loadingCompare}
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs py-3 px-4 rounded-xl shadow-lg shadow-emerald-950/50 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {loadingCompare ? (
              <span>Evaluating 3 Walk Strategies...</span>
            ) : (
              <span>Compare All 3 Modes Side-by-Side</span>
            )}
          </button>
        ) : (
          <button
            type="button"
            onClick={onCalculate}
            disabled={loading}
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm py-3 px-4 rounded-xl shadow-lg shadow-emerald-950/50 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <span>Mapping Scenic Drift...</span>
            ) : (
              <span>Calculate Scenic Route</span>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
