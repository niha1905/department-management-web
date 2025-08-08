import React from 'react';

/**
 * Standard page header matching Dashboard.jsx styling.
 * - Gradient banner container
 * - Gradient title text
 * - Optional subtitle (e.g., Welcome, Name!)
 * - Right-side content defaults to today's date pill
 */
export default function PageHeader({ title, subtitle, rightContent, showDate = true }) {
  const userName = typeof window !== 'undefined' ? (sessionStorage.getItem('name') || '') : '';
  const todayStr = new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="w-full max-w-7xl mx-auto px-4 pt-6 pb-3 flex flex-col md:flex-row md:items-center md:justify-between bg-[var(--gm-white)] rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.05)] border border-[var(--color-border)] animate-fadeIn transition-all duration-300">
      <div className="transform transition-all duration-300 hover:translate-x-1">
        {title && (
          <h1 className="text-3xl md:text-4xl font-extrabold text-[var(--gm-dark)] mb-1">
            {title}
          </h1>
        )}
        {(subtitle || userName) && (
          <div className="text-[var(--gm-aqua)] text-base md:text-lg font-medium">
            {subtitle || (userName ? `Welcome, ${userName}!` : '')}
          </div>
        )}
      </div>
      <div className="mt-2 md:mt-0 transform transition-all duration-300 hover:translate-y-[-2px]">
        {rightContent ? (
          rightContent
        ) : (
          showDate && (
            <div className="font-medium text-sm md:text-base bg-[var(--gm-dark)] text-[var(--gm-white)] px-4 py-1.5 rounded-full shadow-md border border-[rgba(63,255,224,0.25)] hover:shadow-lg transition-all duration-300">
              {todayStr}
            </div>
          )
        )}
      </div>
    </div>
  );
}


