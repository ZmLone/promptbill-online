import React from 'react';

export function ContactArtworkCard() {
  return (
    <div
      className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs overflow-hidden"
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 360 210"
        className="w-full h-auto block rounded-xl"
        role="presentation"
      >
        <defs>
          <linearGradient id="pbArtCanvas" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#0f172a" />
            <stop offset="55%" stopColor="#132238" />
            <stop offset="100%" stopColor="#064e3b" />
          </linearGradient>
          <linearGradient id="pbArtGlow" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#34d399" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#6ee7b7" stopOpacity="0.25" />
          </linearGradient>
          <linearGradient id="pbArtOrb" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#34d399" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#059669" stopOpacity="0.05" />
          </linearGradient>
        </defs>

        <rect width="360" height="210" rx="14" fill="url(#pbArtCanvas)" />

        {/* Subtle geometric coordinate grid */}
        <g stroke="#94a3b8" strokeOpacity="0.1" strokeWidth="1">
          <line x1="0" y1="42" x2="360" y2="42" />
          <line x1="0" y1="84" x2="360" y2="84" />
          <line x1="0" y1="126" x2="360" y2="126" />
          <line x1="0" y1="168" x2="360" y2="168" />
          <line x1="72" y1="0" x2="72" y2="210" />
          <line x1="144" y1="0" x2="144" y2="210" />
          <line x1="216" y1="0" x2="216" y2="210" />
          <line x1="288" y1="0" x2="288" y2="210" />
        </g>

        {/* Ambient abstract circles */}
        <circle cx="298" cy="48" r="56" fill="url(#pbArtOrb)" />
        <circle cx="64" cy="176" r="44" fill="url(#pbArtOrb)" />
        <circle
          cx="298"
          cy="48"
          r="34"
          fill="none"
          stroke="#6ee7b7"
          strokeOpacity="0.25"
          strokeWidth="1.2"
          strokeDasharray="4 4"
        />

        {/* Minimalist ledger bars & signal wave */}
        <rect x="44" y="54" width="112" height="10" rx="5" fill="#f8fafc" fillOpacity="0.9" />
        <rect x="44" y="76" width="76" height="8" rx="4" fill="#34d399" fillOpacity="0.85" />
        <rect x="44" y="94" width="136" height="8" rx="4" fill="#cbd5e1" fillOpacity="0.3" />
        <rect x="44" y="110" width="98" height="8" rx="4" fill="#cbd5e1" fillOpacity="0.22" />

        {/* Smooth connecting arc & signal nodes */}
        <path
          d="M 44 156 C 110 156, 132 128, 192 128 C 246 128, 268 96, 316 96"
          fill="none"
          stroke="url(#pbArtGlow)"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <circle cx="192" cy="128" r="5" fill="#34d399" />
        <circle cx="316" cy="96" r="6" fill="#ecfdf5" />
        <circle cx="316" cy="96" r="11" fill="none" stroke="#34d399" strokeOpacity="0.5" strokeWidth="1.5" />
      </svg>
    </div>
  );
}
