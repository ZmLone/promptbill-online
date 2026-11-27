import React from 'react';

interface ProviderLogoProps {
  provider: string;
  modelName?: string;
  modelSlug?: string;
  size?: 'sm' | 'md' | 'lg';
}

function getBoxClass(size: 'sm' | 'md' | 'lg') {
  if (size === 'lg') return 'h-9 w-9 rounded-xl';
  if (size === 'md') return 'h-7 w-7 rounded-lg';
  return 'h-6 w-6 rounded-md';
}

function getSvgClass(size: 'sm' | 'md' | 'lg') {
  if (size === 'lg') return 'h-5 w-5';
  if (size === 'md') return 'h-4 w-4';
  return 'h-3.5 w-3.5';
}

export function ProviderLogo({
  provider,
  modelName = '',
  modelSlug = '',
  size = 'sm',
}: ProviderLogoProps) {
  const family = `${provider} ${modelName} ${modelSlug}`.toLowerCase();
  const box = getBoxClass(size);
  const svg = getSvgClass(size);

  // OpenAI / GPT / o-series — Crisp 6-spoke radial asterisk/knot
  if (
    family.includes('openai') ||
    /gpt-?\d/.test(family) ||
    /o[1345]-?(mini|pro|high)?/.test(family)
  ) {
    return (
      <span
        aria-hidden="true"
        title={provider}
        className={`inline-flex shrink-0 items-center justify-center bg-slate-950 text-white ${box}`}
      >
        <svg viewBox="0 0 24 24" fill="none" className={svg}>
          <circle cx="12" cy="12" r="2.2" fill="currentColor" />
          <path
            d="M12 3v5.5M12 15.5V21M4.2 7.5l4.8 2.8M15 13.7l4.8 2.8M19.8 7.5 15 10.3M9 13.7 4.2 16.5"
            stroke="currentColor"
            strokeWidth="2.1"
            strokeLinecap="round"
          />
        </svg>
      </span>
    );
  }

  // Anthropic / Claude / Fable / Sonnet / Haiku / Opus
  if (
    family.includes('anthropic') ||
    family.includes('claude') ||
    family.includes('fable') ||
    family.includes('sonnet') ||
    family.includes('haiku') ||
    family.includes('opus')
  ) {
    return (
      <span
        aria-hidden="true"
        title={provider}
        className={`inline-flex shrink-0 items-center justify-center bg-[#da7756]/15 text-[#c45a38] ring-1 ring-inset ring-[#da7756]/30 ${box}`}
      >
        <svg viewBox="0 0 24 24" fill="none" className={svg}>
          <path
            d="M12 4.5 19.5 19.5h-3.1l-1.5-3.2H9.1l-1.5 3.2H4.5L12 4.5Zm0 5.6-1.8 3.8h3.6L12 10.1Z"
            fill="currentColor"
          />
        </svg>
      </span>
    );
  }

  // Google / Gemini / Neon / Argon / Carbon / Hydrogen
  if (
    family.includes('google') ||
    family.includes('gemini') ||
    family.includes('neon') ||
    family.includes('argon') ||
    family.includes('carbon') ||
    family.includes('hydrogen')
  ) {
    return (
      <span
        aria-hidden="true"
        title={provider}
        className={`inline-flex shrink-0 items-center justify-center bg-blue-500/12 ring-1 ring-inset ring-blue-500/25 ${box}`}
      >
        <svg viewBox="0 0 24 24" fill="none" className={svg}>
          <path
            d="M12 2.5C12.3 7.8 16.2 11.7 21.5 12C16.2 12.3 12.3 16.2 12 21.5C11.7 16.2 7.8 12.3 2.5 12C7.8 11.7 11.7 7.8 12 2.5Z"
            fill="#2563EB"
          />
        </svg>
      </span>
    );
  }

  // DeepSeek
  if (family.includes('deepseek')) {
    return (
      <span
        aria-hidden="true"
        title={provider}
        className={`inline-flex shrink-0 items-center justify-center bg-[#4d6bfe]/14 text-[#2d4be0] ring-1 ring-inset ring-[#4d6bfe]/30 ${box}`}
      >
        <svg viewBox="0 0 24 24" fill="none" className={svg}>
          <path
            d="M4 13.5c0-4.2 3.4-7.5 7.7-7.5 3.2 0 5.9 1.8 7.1 4.5.8-.3 1.7-.2 2.2.3-.5 1.3-1.6 2.3-2.9 2.7-.8 2.9-3.5 5-6.8 5-4 0-7.3-2.4-7.3-5.3Z"
            fill="currentColor"
          />
          <circle cx="10.2" cy="11.5" r="1.3" fill="#ffffff" />
        </svg>
      </span>
    );
  }

  // Mistral
  if (family.includes('mistral') || family.includes('codestral') || family.includes('ministral')) {
    return (
      <span
        aria-hidden="true"
        title={provider}
        className={`inline-flex shrink-0 items-center justify-center bg-orange-500/14 ring-1 ring-inset ring-orange-500/30 ${box}`}
      >
        <svg viewBox="0 0 24 24" fill="none" className={svg}>
          <rect x="3.5" y="4.5" width="3.5" height="3.5" fill="#F59E0B" />
          <rect x="17" y="4.5" width="3.5" height="3.5" fill="#F59E0B" />
          <rect x="3.5" y="8" width="7" height="3.5" fill="#F97316" />
          <rect x="13.5" y="8" width="7" height="3.5" fill="#F97316" />
          <rect x="3.5" y="11.5" width="17" height="3.5" fill="#EA580C" />
          <rect x="3.5" y="15" width="3.5" height="4.5" fill="#DC2626" />
          <rect x="10.25" y="15" width="3.5" height="4.5" fill="#DC2626" />
          <rect x="17" y="15" width="3.5" height="4.5" fill="#DC2626" />
        </svg>
      </span>
    );
  }

  // xAI / Grok
  if (family.includes('xai') || family.includes('grok')) {
    return (
      <span
        aria-hidden="true"
        title={provider}
        className={`inline-flex shrink-0 items-center justify-center bg-zinc-950 text-white ${box}`}
      >
        <svg viewBox="0 0 24 24" fill="none" className={svg}>
          <path
            d="M4.5 5h3.1l4.9 6.8L17.4 5h2.5l-6.1 8.3L19.9 19h-3.1l-5.2-7.2L6.4 19H3.9l6.3-8.6L4.5 5Z"
            fill="currentColor"
          />
        </svg>
      </span>
    );
  }

  // Meta / Llama
  if (family.includes('meta') || family.includes('llama')) {
    return (
      <span
        aria-hidden="true"
        title={provider}
        className={`inline-flex shrink-0 items-center justify-center bg-sky-500/14 text-sky-600 ring-1 ring-inset ring-sky-500/25 ${box}`}
      >
        <svg viewBox="0 0 24 24" fill="none" className={svg}>
          <path
            d="M6.8 8C4.3 8 2.8 10 2.8 12.3c0 2.1 1.3 3.7 3.2 3.7 1.6 0 2.9-1.1 4.4-3.4l1.6-2.5 1.6 2.5c1.5 2.3 2.8 3.4 4.4 3.4 1.9 0 3.2-1.6 3.2-3.7C21.2 10 19.7 8 17.2 8c-1.7 0-3 1.1-4.3 3.1L12 12.6l-.9-1.5C9.8 9.1 8.5 8 6.8 8Z"
            stroke="currentColor"
            strokeWidth="2.1"
            strokeLinejoin="round"
          />
        </svg>
      </span>
    );
  }

  // Qwen / Alibaba
  if (family.includes('qwen') || family.includes('alibaba')) {
    return (
      <span
        aria-hidden="true"
        title={provider}
        className={`inline-flex shrink-0 items-center justify-center bg-violet-600/14 text-violet-700 ring-1 ring-inset ring-violet-600/25 ${box}`}
      >
        <svg viewBox="0 0 24 24" fill="none" className={svg}>
          <polygon
            points="12,3.5 19.5,7.8 19.5,16.2 12,20.5 4.5,16.2 4.5,7.8"
            stroke="currentColor"
            strokeWidth="2.1"
          />
          <path
            d="M14 14 19 19"
            stroke="currentColor"
            strokeWidth="2.1"
            strokeLinecap="round"
          />
        </svg>
      </span>
    );
  }

  // Moonshot / Kimi
  if (family.includes('moonshot') || family.includes('kimi')) {
    return (
      <span
        aria-hidden="true"
        title={provider}
        className={`inline-flex shrink-0 items-center justify-center bg-slate-900 text-cyan-300 ${box}`}
      >
        <svg viewBox="0 0 24 24" fill="none" className={svg}>
          <path
            d="M15 4.5a7.5 7.5 0 1 0 4.6 13A6.6 6.6 0 0 1 15 4.5Z"
            fill="currentColor"
          />
          <circle cx="17.8" cy="7.2" r="1.5" fill="#38BDF8" />
        </svg>
      </span>
    );
  }

  // Zhipu / GLM
  if (family.includes('zhipu') || family.includes('glm') || family.includes('z.ai')) {
    return (
      <span
        aria-hidden="true"
        title={provider}
        className={`inline-flex shrink-0 items-center justify-center bg-teal-600/14 text-teal-700 ring-1 ring-inset ring-teal-600/25 ${box}`}
      >
        <svg viewBox="0 0 24 24" fill="none" className={svg}>
          <path
            d="M5.5 6.5h13L5.5 17.5h13"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
    );
  }

  // Cohere / Command
  if (family.includes('cohere') || family.includes('command')) {
    return (
      <span
        aria-hidden="true"
        title={provider}
        className={`inline-flex shrink-0 items-center justify-center bg-emerald-600/14 text-emerald-700 ring-1 ring-inset ring-emerald-600/25 ${box}`}
      >
        <svg viewBox="0 0 24 24" fill="none" className={svg}>
          <rect x="4" y="6" width="11" height="4.8" rx="2.4" fill="currentColor" />
          <rect x="4" y="13.2" width="7" height="4.8" rx="2.4" fill="#059669" />
          <circle cx="17" cy="15.6" r="2.5" fill="#D97757" />
        </svg>
      </span>
    );
  }

  // Clean crisp geometric badge fallback
  const letter = (modelName || provider || 'M').trim().charAt(0).toUpperCase() || 'M';
  return (
    <span
      aria-hidden="true"
      title={provider}
      className={`inline-flex shrink-0 items-center justify-center bg-slate-900 font-mono text-[10px] font-bold text-white ${box}`}
    >
      {letter}
    </span>
  );
}
