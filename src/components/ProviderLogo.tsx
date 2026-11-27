import React from 'react';

interface ProviderLogoProps {
  provider: string;
  size?: 'sm' | 'md';
}

const PROVIDER_STYLES: Record<
  string,
  { bg: string; fg: string; ring: string; glyph: string }
> = {
  openai: {
    bg: 'bg-slate-950',
    fg: 'text-white',
    ring: 'ring-slate-900/10',
    glyph: 'OA',
  },
  anthropic: {
    bg: 'bg-[#d97757]/15',
    fg: 'text-[#b4532a]',
    ring: 'ring-[#d97757]/30',
    glyph: 'A',
  },
  google: {
    bg: 'bg-blue-600/12',
    fg: 'text-blue-700',
    ring: 'ring-blue-600/25',
    glyph: 'G',
  },
  deepseek: {
    bg: 'bg-indigo-600/12',
    fg: 'text-indigo-700',
    ring: 'ring-indigo-600/25',
    glyph: 'DS',
  },
  mistral: {
    bg: 'bg-orange-500/15',
    fg: 'text-orange-700',
    ring: 'ring-orange-500/30',
    glyph: 'M',
  },
  qwen: {
    bg: 'bg-violet-600/12',
    fg: 'text-violet-700',
    ring: 'ring-violet-600/25',
    glyph: 'QW',
  },
  alibaba: {
    bg: 'bg-violet-600/12',
    fg: 'text-violet-700',
    ring: 'ring-violet-600/25',
    glyph: 'QW',
  },
  meta: {
    bg: 'bg-sky-600/12',
    fg: 'text-sky-700',
    ring: 'ring-sky-600/25',
    glyph: 'LL',
  },
  xai: {
    bg: 'bg-zinc-900',
    fg: 'text-white',
    ring: 'ring-zinc-900/15',
    glyph: 'xA',
  },
  moonshot: {
    bg: 'bg-cyan-600/12',
    fg: 'text-cyan-800',
    ring: 'ring-cyan-600/25',
    glyph: 'KM',
  },
  kimi: {
    bg: 'bg-cyan-600/12',
    fg: 'text-cyan-800',
    ring: 'ring-cyan-600/25',
    glyph: 'KM',
  },
  zhipu: {
    bg: 'bg-teal-600/12',
    fg: 'text-teal-800',
    ring: 'ring-teal-600/25',
    glyph: 'GL',
  },
  cohere: {
    bg: 'bg-emerald-600/12',
    fg: 'text-emerald-800',
    ring: 'ring-emerald-600/25',
    glyph: 'CO',
  },
  amazon: {
    bg: 'bg-amber-500/15',
    fg: 'text-amber-800',
    ring: 'ring-amber-500/30',
    glyph: 'NV',
  },
};

function resolveProviderStyle(provider: string) {
  const key = provider.trim().toLowerCase();
  for (const [needle, style] of Object.entries(PROVIDER_STYLES)) {
    if (key.includes(needle)) return style;
  }
  const initials = provider
    .replace(/[^a-zA-Z0-9 ]/g, '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');
  return {
    bg: 'bg-slate-100',
    fg: 'text-slate-700',
    ring: 'ring-slate-300/60',
    glyph: initials || 'AI',
  };
}

export function ProviderLogo({ provider, size = 'sm' }: ProviderLogoProps) {
  const style = resolveProviderStyle(provider);
  const dims = size === 'md' ? 'h-8 w-8 text-[11px] rounded-xl' : 'h-6 w-6 text-[10px] rounded-lg';

  return (
    <span
      aria-hidden="true"
      title={provider}
      className={`inline-flex shrink-0 items-center justify-center font-mono font-bold tracking-tighter ring-1 ring-inset ${dims} ${style.bg} ${style.fg} ${style.ring}`}
    >
      {style.glyph}
    </span>
  );
}
