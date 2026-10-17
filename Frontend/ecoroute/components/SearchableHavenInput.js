'use client';

import { useState, useEffect, useRef, useMemo } from 'react';

export default function SearchableHavenInput({
  label,
  value,
  onChange,
  neighborhoods = [],
  placeholder = 'Type to search haven...',
  dotColor = 'bg-emerald-400'
}) {
  const [query, setQuery] = useState(value || '');
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  // Sync internal query when value prop changes (e.g. presets or swap)
  useEffect(() => {
    setQuery(value || '');
  }, [value]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filtered havens based on query
  const filtered = useMemo(() => {
    if (!query || query.trim() === '') {
      return neighborhoods;
    }
    const q = query.toLowerCase().trim();
    return neighborhoods.filter(
      (n) => n.name.toLowerCase().includes(q) || (n.zone && n.zone.toLowerCase().includes(q))
    );
  }, [neighborhoods, query]);

  const handleSelect = (name) => {
    onChange(name);
    setQuery(name);
    setIsOpen(false);
  };

  const handleClear = () => {
    setQuery('');
    setIsOpen(true);
    if (inputRef.current) inputRef.current.focus();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filtered.length > 0) {
        handleSelect(filtered[0].name);
      }
    }
  };

  return (
    <div className="relative" ref={containerRef}>
      <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center justify-between">
        <span className="flex items-center gap-1.5">
          <span className={`w-2 h-2 rounded-full ${dotColor}`} />
          <span>{label}</span>
        </span>
        {value && (
          <span className="text-[10px] text-slate-400 font-mono">
            {neighborhoods.find((n) => n.name === value)?.greenCanopyIndex}% Canopy
          </span>
        )}
      </label>

      {/* Input Field with search and clear icon */}
      <div className="relative flex items-center">
        <input
          ref={inputRef}
          type="text"
          value={query}
          placeholder={placeholder}
          onFocus={() => setIsOpen(true)}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onKeyDown={handleKeyDown}
          className="w-full bg-[#121f18] border border-white/10 hover:border-white/20 focus:border-emerald-500 text-white text-xs rounded-xl pl-3 pr-14 py-2.5 transition-colors outline-none font-medium placeholder-slate-500"
        />

        <div className="absolute right-2 flex items-center gap-1">
          {query && (
            <button
              type="button"
              onClick={handleClear}
              className="text-slate-400 hover:text-white p-1 text-xs cursor-pointer"
              title="Clear text"
            >
              ✕
            </button>
          )}
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="text-slate-400 hover:text-emerald-400 p-1 text-xs cursor-pointer"
            title="Toggle dropdown list"
          >
            ▾
          </button>
        </div>
      </div>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-[#0f1914] border border-white/15 rounded-xl shadow-2xl max-h-60 overflow-y-auto divide-y divide-white/5 py-1 backdrop-blur-xl">
          {filtered.length === 0 ? (
            <div className="p-3 text-center text-xs text-slate-400">
              No matching havens found for &ldquo;{query}&rdquo;
            </div>
          ) : (
            filtered.map((n) => {
              const isSelected = n.name === value;
              return (
                <div
                  key={n.name}
                  onClick={() => handleSelect(n.name)}
                  className={`px-3 py-2 text-xs cursor-pointer flex items-center justify-between transition-colors ${
                    isSelected
                      ? 'bg-emerald-950/60 text-emerald-300 font-semibold'
                      : 'text-slate-200 hover:bg-[#15231c]'
                  }`}
                >
                  <div className="min-w-0 pr-2">
                    <div className="truncate flex items-center gap-1.5">
                      <span>{n.isPromenade ? '🌿' : '📍'}</span>
                      <span>{n.name}</span>
                    </div>
                    {n.zone && (
                      <div className="text-[10px] text-slate-400 mt-0.5 ml-4">
                        {n.zone}
                      </div>
                    )}
                  </div>
                  <div className="shrink-0 flex items-center gap-2 font-mono text-[10px]">
                    <span className="text-emerald-400">{n.greenCanopyIndex}% shade</span>
                    <span className="text-slate-500">·</span>
                    <span className="text-teal-400">{n.noiseLevelDb} dB</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
