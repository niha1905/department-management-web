import React, { useEffect, useRef, useState } from "react";
import { Search as SearchIcon, X } from "lucide-react";

export default function SearchBar({ suggestions, onSearch, onSelect }) {
  const [query, setQuery] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const inputRef = useRef(null);

  const handleChange = (e) => {
    setQuery(e.target.value);
    setShowDropdown(true);
  };

  // Debounce onSearch calls
  useEffect(() => {
    const id = setTimeout(() => {
      onSearch?.(query);
    }, 200);
    return () => clearTimeout(id);
  }, [query]);

  // Hotkey: Ctrl/Cmd + K focuses the search bar
  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        setShowDropdown(true);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const onKeyDown = (e) => {
    if (!showDropdown || suggestions.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((prev) => (prev + 1) % suggestions.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((prev) => (prev - 1 + suggestions.length) % suggestions.length);
    } else if (e.key === 'Enter') {
      if (activeIndex >= 0 && activeIndex < suggestions.length) {
        onSelect(suggestions[activeIndex]);
        setShowDropdown(false);
        setActiveIndex(-1);
      }
    } else if (e.key === 'Escape') {
      setShowDropdown(false);
      setActiveIndex(-1);
    }
  };

  return (
    <div className="relative w-full max-w-xl mx-auto mb-6 animate-fadeIn">
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={handleChange}
          onBlur={() => setTimeout(() => setShowDropdown(false), 100)}
          onFocus={() => setShowDropdown(true)}
          onKeyDown={onKeyDown}
          ref={inputRef}
          placeholder="Search tasks..."
          className="w-full py-3 pl-10 pr-12 search-pill transition-all duration-300 focus:ring-2 focus:ring-[var(--gm-aqua)]/60 focus:border-[var(--gm-aqua)]/60"
        />
        {/* Left search icon */}
        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--gm-aqua)]" size={18} />
        {/* Right clear or hint */}
        {query ? (
          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => {
              setQuery("");
              setActiveIndex(-1);
              inputRef.current?.focus();
              onSearch?.("");
            }}
            aria-label="Clear search"
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full bg-white/20 hover:bg-white/30 text-white transition"
          >
            <X size={16} />
          </button>
        ) : (
          <div className="absolute right-2 top-1/2 -translate-y-1/2 px-2 py-1 rounded-full bg-[var(--gm-aqua)] text-[#05343a] text-xs shadow-md select-none">
            Search
          </div>
        )}
      </div>
      {showDropdown && suggestions.length > 0 && (
        <div
          className="absolute left-0 right-0 mt-2 bg-[var(--gm-white)] rounded-2xl shadow-[0_8px_28px_rgba(0,0,0,0.08)] z-10 max-h-60 overflow-y-auto border border-[var(--color-border)]"
          role="listbox"
          aria-label="Search suggestions"
        >
          {suggestions.map((s, i) => (
            <div
              key={i}
              role="option"
              aria-selected={i === activeIndex}
              className={`flex items-center px-4 py-2 cursor-pointer transition-all duration-200 ${
                i === activeIndex
                  ? 'bg-[rgba(63,255,224,0.12)]'
                  : 'hover:bg-[rgba(63,255,224,0.08)]'
              }`}
              onMouseEnter={() => setActiveIndex(i)}
              onMouseDown={() => onSelect(s)}
            >
              <span
                className={`inline-block w-2 h-2 rounded-full mr-2 ${
                  s.category === "work"
                    ? "bg-[var(--gm-aqua)]"
                    : s.category === "personal"
                    ? "bg-[var(--gm-yellow)]"
                    : "bg-emerald-400"
                }`}
              />
              <span className="font-medium">{s.name}</span>
              <span className="ml-auto text-xs px-2 py-1 rounded bg-gray-100 text-gray-700">
                {s.category}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
