'use client';

import { useState } from 'react';

const CATEGORIES = [
  'All',
  'Shaded Nooks',
  'Street Art & Music',
  'Sunset Views',
  'Indie Coffee & Chai'
];

export default function JoyPinsPanel({
  joyPins = [],
  neighborhoods = [],
  onAddPin,
  onLikePin,
  onSelectPin,
  loading = false
}) {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [showAddForm, setShowAddForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form fields
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('Shaded Nooks');
  const [newNeighborhood, setNewNeighborhood] = useState('');
  const [newDescription, setNewDescription] = useState('');

  const filteredPins =
    selectedCategory === 'All'
      ? joyPins
      : joyPins.filter((p) => p.category === selectedCategory);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newTitle.trim() || !newNeighborhood) return;

    setSubmitting(true);
    try {
      const selectedNode = neighborhoods.find((n) => n.name === newNeighborhood);
      await onAddPin({
        title: newTitle.trim(),
        category: newCategory,
        neighborhood: newNeighborhood,
        description: newDescription.trim(),
        lat: selectedNode?.lat || 28.5893,
        lon: selectedNode?.lon || 77.2285
      });
      setNewTitle('');
      setNewDescription('');
      setShowAddForm(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="prod-card p-5 flex flex-col gap-3.5 text-slate-100">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-white/10">
        <div>
          <h3 className="text-sm font-bold text-white font-display">
            Pockets of Joy Community Guide
          </h3>
          <p className="text-xs text-slate-400">
            Crowd-sourced quiet nooks, acoustic spots &amp; scenic viewpoints
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowAddForm(!showAddForm)}
          className="text-xs font-medium text-emerald-300 bg-[#121f18] hover:bg-emerald-950/50 border border-white/10 hover:border-emerald-500/50 px-3 py-1.5 rounded-xl transition-all cursor-pointer"
        >
          {showAddForm ? '✕ Close Form' : '+ Drop a Joy Pin'}
        </button>
      </div>

      {/* Drop Pin Modal / Form */}
      {showAddForm && (
        <form
          onSubmit={handleSubmit}
          className="bg-[#121f18] border border-emerald-500/30 rounded-xl p-3.5 space-y-2.5"
        >
          <div className="text-xs font-semibold text-emerald-300">
            Share a Serene or Joyful Spot
          </div>

          <div>
            <input
              type="text"
              placeholder="Title (e.g. Sitar Sessions Under Banyan)"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              required
              className="w-full bg-[#0a120e] border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                className="w-full bg-[#0a120e] border border-white/10 rounded-lg px-2.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
              >
                {CATEGORIES.filter((c) => c !== 'All').map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <select
                value={newNeighborhood}
                onChange={(e) => setNewNeighborhood(e.target.value)}
                required
                className="w-full bg-[#0a120e] border border-white/10 rounded-lg px-2.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
              >
                <option value="">Select Haven...</option>
                {neighborhoods.map((n) => (
                  <option key={n.name} value={n.name}>
                    {n.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <textarea
              placeholder="Why is this spot special? (e.g. peaceful breeze, fountain acoustics, fragrant jasmine)"
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              rows={2}
              className="w-full bg-[#0a120e] border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="text-xs text-slate-400 hover:text-white px-3 py-1.5 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs px-3.5 py-1.5 rounded-lg transition-all cursor-pointer disabled:opacity-50"
            >
              {submitting ? 'Placing...' : 'Place Pin on Map'}
            </button>
          </div>
        </form>
      )}

      {/* Category Filter Pills */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 text-xs">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1 rounded-full whitespace-nowrap transition-all cursor-pointer text-xs ${
              selectedCategory === cat
                ? 'bg-emerald-950/70 text-emerald-300 border border-emerald-500/50 font-semibold'
                : 'bg-[#121f18] text-slate-400 hover:text-slate-200 border border-white/5'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Pins Feed */}
      {filteredPins.length === 0 ? (
        <div className="py-5 text-center text-xs text-slate-400">
          No pins in this category yet.
        </div>
      ) : (
        <div className="divide-y divide-white/5 max-h-56 overflow-y-auto pr-1">
          {filteredPins.map((pin) => (
            <div
              key={pin.id}
              className="py-3 px-2 rounded-xl hover:bg-[#121f18] transition-colors flex items-start justify-between gap-3 group"
            >
              <div
                className="min-w-0 cursor-pointer flex-1"
                onClick={() => onSelectPin && onSelectPin(pin)}
              >
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-white group-hover:text-emerald-300 transition-colors truncate">
                    {pin.title}
                  </span>
                  <span className="text-[10px] text-slate-400 bg-white/5 px-1.5 py-0.2 rounded font-mono shrink-0">
                    {pin.category}
                  </span>
                </div>
                <p className="text-xs text-slate-300/80 line-clamp-2 mt-1 leading-relaxed">
                  {pin.description}
                </p>
                <div className="flex items-center gap-2 mt-1.5 text-[10px] text-slate-400 font-mono">
                  <span className="text-emerald-400/90 font-medium">{pin.neighborhood}</span>
                  <span>·</span>
                  <span>by {pin.author || 'Local Walker'}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => onLikePin && onLikePin(pin.id)}
                className="shrink-0 flex items-center gap-1.5 text-[11px] font-mono text-amber-300 bg-amber-950/30 hover:bg-amber-950/60 border border-amber-800/30 px-2.5 py-1 rounded-full transition-all cursor-pointer"
                title="Like this pocket of joy"
              >
                <span>💛</span>
                <span>{pin.likes || 1}</span>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
