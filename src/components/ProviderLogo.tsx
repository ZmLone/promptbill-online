import React from 'react';

interface ProviderLogoProps {
  provider: string;
  size?: 'sm' | 'md' | 'lg';
}

function getDimensions(size: 'sm' | 'md' | 'lg') {
  if (size === 'lg') return { box: 'h-9 w-9 rounded-xl', svg: 'h-5 w-5' };
  if (size === 'md') return { box: 'h-7 w-7 rounded-lg', svg: 'h-4 w-4' };
  return { box: 'h-6 w-6 rounded-lg', svg: 'h-3.5 w-3.5' };
}

export function ProviderLogo({ provider, size = 'sm' }: ProviderLogoProps) {
  const key = provider.trim().toLowerCase();
  const { box, svg } = getDimensions(size);

  // OpenAI — Authentic 6-petal interwoven knot mark
  if (key.includes('openai')) {
    return (
      <span
        aria-hidden="true"
        title="OpenAI"
        className={`inline-flex shrink-0 items-center justify-center bg-slate-950 text-white shadow-2xs ${box}`}
      >
        <svg viewBox="0 0 24 24" fill="none" className={svg}>
          <path
            d="M22.28 9.82a5.98 5.98 0 0 0-.51-4.91 6.05 6.05 0 0 0-6.51-2.9A6.07 6.07 0 0 0 4.98 4.18a5.98 5.98 0 0 0-4 2.9 6.05 6.05 0 0 0 .74 7.1 5.98 5.98 0 0 0 .51 4.91 6.05 6.05 0 0 0 6.51 2.9A5.98 5.98 0 0 0 13.26 24a6.06 6.06 0 0 0 5.77-4.21 5.99 5.99 0 0 0 4-2.9 6.06 6.06 0 0 0-.75-7.07ZM13.26 22.43a4.48 4.48 0 0 1-2.88-1.04l.14-.08 4.78-2.76a.8.8 0 0 0 .39-.68v-6.74l2.02 1.17a.07.07 0 0 1 .04.05v5.58a4.5 4.5 0 0 1-4.49 4.5Zm-9.66-4.13a4.47 4.47 0 0 1-.53-3.01l.14.08 4.78 2.76a.77.77 0 0 0 .78 0l5.84-3.37v2.33a.08.08 0 0 1-.03.06L9.74 19.95a4.5 4.5 0 0 1-6.14-1.65ZM2.34 7.9a4.49 4.49 0 0 1 2.37-1.97V11.6a.77.77 0 0 0 .39.68l5.81 3.35-2.02 1.17a.08.08 0 0 1-.07 0l-4.83-2.79A4.5 4.5 0 0 1 2.34 7.9Zm16.6 3.85L13.1 8.36l2.02-1.16a.08.08 0 0 1 .07 0l4.83 2.79a4.49 4.49 0 0 1-.68 8.1v-5.68a.79.79 0 0 0-.4-.66Zm2.01-3.02-.14-.09-4.77-2.78a.78.78 0 0 0-.79 0L9.41 9.23V6.9a.07.07 0 0 1 .03-.06l4.83-2.79a4.5 4.5 0 0 1 6.68 4.66ZM8.3 12.86l-2.02-1.16a.08.08 0 0 1-.04-.06V6.07a4.5 4.5 0 0 1 7.38-3.45l-.14.08-4.78 2.76a.8.8 0 0 0-.39.68l-.01 6.72Zm1.1-2.37 2.6-1.5 2.6 1.5v3l-2.6 1.5-2.6-1.5v-3Z"
            fill="currentColor"
          />
        </svg>
      </span>
    );
  }

  // Anthropic / Claude — Warm terracotta with authentic 'A' monogram
  if (key.includes('anthropic') || key.includes('claude')) {
    return (
      <span
        aria-hidden="true"
        title="Anthropic"
        className={`inline-flex shrink-0 items-center justify-center bg-[#d97757]/15 text-[#c25937] ring-1 ring-inset ring-[#d97757]/30 ${box}`}
      >
        <svg viewBox="0 0 24 24" fill="none" className={svg}>
          <path
            d="M14.1 4h2.55L21 20h-2.55l-.95-3.65H13.1L12.15 20H9.6L14.1 4Zm.9 4.2-1.45 5.8h2.9L15 8.2ZM7.4 4h2.6l4.5 16h-2.55L8.7 8.15 5.45 20H2.9L7.4 4Z"
            fill="currentColor"
          />
        </svg>
      </span>
    );
  }

  // Google / Gemini — Authentic 4-point Gemini sparkle
  if (key.includes('google') || key.includes('gemini')) {
    return (
      <span
        aria-hidden="true"
        title="Google Gemini"
        className={`inline-flex shrink-0 items-center justify-center bg-blue-500/12 text-blue-600 ring-1 ring-inset ring-blue-500/25 ${box}`}
      >
        <svg viewBox="0 0 24 24" fill="none" className={svg}>
          <path
            d="M12 2C12.3 7.6 16.4 11.7 22 12C16.4 12.3 12.3 16.4 12 22C11.7 16.4 7.6 12.3 2 12C7.6 11.7 11.7 7.6 12 2Z"
            fill="url(#geminiGrad)"
          />
          <defs>
            <linearGradient id="geminiGrad" x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
              <stop stopColor="#2563EB" />
              <stop offset="0.55" stopColor="#7C3AED" />
              <stop offset="1" stopColor="#DB2777" />
            </linearGradient>
          </defs>
        </svg>
      </span>
    );
  }

  // DeepSeek — Deep blue whale/fin crest
  if (key.includes('deepseek')) {
    return (
      <span
        aria-hidden="true"
        title="DeepSeek"
        className={`inline-flex shrink-0 items-center justify-center bg-[#4D6BFE]/14 text-[#3451E5] ring-1 ring-inset ring-[#4D6BFE]/30 ${box}`}
      >
        <svg viewBox="0 0 24 24" fill="none" className={svg}>
          <path
            d="M3.5 13.5C3.5 9.1 7.2 5.5 11.8 5.5c3.5 0 6.5 2 7.8 5 .8-.4 1.8-.3 2.4.3-.6 1.5-1.8 2.6-3.3 3.1-.9 3.2-3.9 5.6-7.5 5.6-4.3 0-7.7-2.7-7.7-6Zm6.8-2.4a1.3 1.3 0 1 0 0 2.6 1.3 1.3 0 0 0 0-2.6Z"
            fill="currentColor"
          />
        </svg>
      </span>
    );
  }

  // Mistral — Authentic 5-bar stepped pixel 'M'
  if (key.includes('mistral')) {
    return (
      <span
        aria-hidden="true"
        title="Mistral AI"
        className={`inline-flex shrink-0 items-center justify-center bg-orange-500/14 text-orange-600 ring-1 ring-inset ring-orange-500/30 ${box}`}
      >
        <svg viewBox="0 0 24 24" fill="none" className={svg}>
          <rect x="3" y="4" width="3.6" height="3.2" fill="#F59E0B" />
          <rect x="17.4" y="4" width="3.6" height="3.2" fill="#F59E0B" />
          <rect x="3" y="7.2" width="7.2" height="3.2" fill="#F97316" />
          <rect x="13.8" y="7.2" width="7.2" height="3.2" fill="#F97316" />
          <rect x="3" y="10.4" width="18" height="3.2" fill="#EA580C" />
          <rect x="3" y="13.6" width="3.6" height="3.2" fill="#DC2626" />
          <rect x="10.2" y="13.6" width="3.6" height="3.2" fill="#DC2626" />
          <rect x="17.4" y="13.6" width="3.6" height="3.2" fill="#DC2626" />
          <rect x="2" y="16.8" width="5.6" height="3.2" fill="#B91C1C" />
          <rect x="16.4" y="16.8" width="5.6" height="3.2" fill="#B91C1C" />
        </svg>
      </span>
    );
  }

  // xAI / Grok — Authentic slashed black hole / X mark
  if (key.includes('xai') || key.includes('grok')) {
    return (
      <span
        aria-hidden="true"
        title="xAI"
        className={`inline-flex shrink-0 items-center justify-center bg-zinc-950 text-white shadow-2xs ${box}`}
      >
        <svg viewBox="0 0 24 24" fill="none" className={svg}>
          <path
            d="M4 4.5h3.2l5.1 7.1L17.4 4.5H20l-6.3 8.6L20.3 20h-3.2l-5.4-7.5L6.3 20H3.7l6.6-9L4 4.5Z"
            fill="currentColor"
          />
          <path d="M18.5 3.5 5.5 20.5" stroke="currentColor" strokeWidth="1.6" />
        </svg>
      </span>
    );
  }

  // Meta / Llama — Authentic continuous infinity loop
  if (key.includes('meta') || key.includes('llama')) {
    return (
      <span
        aria-hidden="true"
        title="Meta"
        className={`inline-flex shrink-0 items-center justify-center bg-sky-500/14 text-sky-600 ring-1 ring-inset ring-sky-500/25 ${box}`}
      >
        <svg viewBox="0 0 24 24" fill="none" className={svg}>
          <path
            d="M6.8 7.5C4.1 7.5 2.5 9.8 2.5 12.4c0 2.5 1.5 4.1 3.7 4.1 1.8 0 3.2-1.2 4.8-3.8l1-1.6 1 1.6c1.6 2.6 3 3.8 4.8 3.8 2.2 0 3.7-1.6 3.7-4.1 0-2.6-1.6-4.9-4.3-4.9-1.9 0-3.3 1.2-4.8 3.5l-.4.6-.4-.6C10.1 8.7 8.7 7.5 6.8 7.5Z"
            stroke="currentColor"
            strokeWidth="2.3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
    );
  }

  // Qwen / Alibaba — Authentic violet geometric prism Q
  if (key.includes('qwen') || key.includes('alibaba')) {
    return (
      <span
        aria-hidden="true"
        title="Qwen (Alibaba)"
        className={`inline-flex shrink-0 items-center justify-center bg-violet-600/14 text-violet-700 ring-1 ring-inset ring-violet-600/25 ${box}`}
      >
        <svg viewBox="0 0 24 24" fill="none" className={svg}>
          <path
            d="M12 3.2 19.6 7.6v8.8L12 20.8l-7.6-4.4V7.6L12 3.2Z"
            stroke="currentColor"
            strokeWidth="2.1"
          />
          <path
            d="M13.5 13.5 19.5 19.5"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
          />
        </svg>
      </span>
    );
  }

  // Moonshot / Kimi — Authentic crescent & orbit dot
  if (key.includes('moonshot') || key.includes('kimi')) {
    return (
      <span
        aria-hidden="true"
        title="Moonshot AI (Kimi)"
        className={`inline-flex shrink-0 items-center justify-center bg-slate-900 text-cyan-300 shadow-2xs ${box}`}
      >
        <svg viewBox="0 0 24 24" fill="none" className={svg}>
          <path
            d="M14.8 4.2a8 8 0 1 0 5 13.8A7 7 0 0 1 14.8 4.2Z"
            fill="currentColor"
          />
          <circle cx="17.8" cy="7.2" r="1.6" fill="#38BDF8" />
        </svg>
      </span>
    );
  }

  // Cohere / Command — Authentic coral/emerald capsule kernel
  if (key.includes('cohere') || key.includes('command')) {
    return (
      <span
        aria-hidden="true"
        title="Cohere"
        className={`inline-flex shrink-0 items-center justify-center bg-emerald-600/14 text-emerald-700 ring-1 ring-inset ring-emerald-600/25 ${box}`}
      >
        <svg viewBox="0 0 24 24" fill="none" className={svg}>
          <rect x="4" y="6" width="10" height="5.2" rx="2.6" fill="currentColor" />
          <rect x="4" y="12.8" width="6.2" height="5.2" rx="2.6" fill="#059669" />
          <circle cx="16.5" cy="15.4" r="2.7" fill="#D97757" />
        </svg>
      </span>
    );
  }

  // Zhipu / GLM
  if (key.includes('zhipu') || key.includes('glm') || key.includes('z.ai')) {
    return (
      <span
        aria-hidden="true"
        title="Zhipu AI"
        className={`inline-flex shrink-0 items-center justify-center bg-teal-600/14 text-teal-700 ring-1 ring-inset ring-teal-600/25 ${box}`}
      >
        <svg viewBox="0 0 24 24" fill="none" className={svg}>
          <path
            d="M5 6h14L5 18h14"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
    );
  }

  // Amazon / Nova
  if (key.includes('amazon') || key.includes('nova') || key.includes('aws')) {
    return (
      <span
        aria-hidden="true"
        title="Amazon"
        className={`inline-flex shrink-0 items-center justify-center bg-amber-500/15 text-amber-700 ring-1 ring-inset ring-amber-500/30 ${box}`}
      >
        <svg viewBox="0 0 24 24" fill="none" className={svg}>
          <path
            d="M4.5 14.5c4.5 3.2 10.5 3.2 15 0M17.5 12.8l2.2 1.6-1.4 2.4"
            stroke="currentColor"
            strokeWidth="2.1"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
    );
  }

  // Fallback geometric node
  const initials = provider
    .replace(/[^a-zA-Z0-9 ]/g, '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');

  return (
    <span
      aria-hidden="true"
      title={provider}
      className={`inline-flex shrink-0 items-center justify-center bg-slate-100 font-mono text-[10px] font-bold text-slate-700 ring-1 ring-inset ring-slate-300/70 ${box}`}
    >
      {initials || 'AI'}
    </span>
  );
}
