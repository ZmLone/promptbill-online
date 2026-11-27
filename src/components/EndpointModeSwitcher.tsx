'use client';

import React from 'react';
import type { EndpointSelectionMode } from '@/lib/endpointPricing';

export function EndpointModeSwitcher({
  mode,
  onChange,
}: {
  mode: EndpointSelectionMode;
  onChange: (next: EndpointSelectionMode) => void;
}) {
  return (
    <div
      className="inline-flex items-center rounded-lg border border-slate-200 bg-slate-100 p-1 text-xs"
      role="group"
      aria-label="Pricing endpoint mode"
    >
      <button
        type="button"
        onClick={() => onChange('cheapest')}
        className={`min-h-[32px] rounded-md px-2.5 py-1 font-semibold transition-colors ${
          mode === 'cheapest'
            ? 'bg-white text-slate-900 shadow-xs'
            : 'text-slate-600 hover:text-slate-900'
        }`}
      >
        Cheapest Endpoint
      </button>
      <button
        type="button"
        onClick={() => onChange('first-party')}
        className={`min-h-[32px] rounded-md px-2.5 py-1 font-semibold transition-colors ${
          mode === 'first-party'
            ? 'bg-white text-slate-900 shadow-xs'
            : 'text-slate-600 hover:text-slate-900'
        }`}
      >
        First-Party API
      </button>
    </div>
  );
}
