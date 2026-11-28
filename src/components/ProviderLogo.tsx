import React from 'react';

interface ProviderLogoProps {
  provider: string;
  modelName?: string;
  modelSlug?: string;
  size?: 'sm' | 'md' | 'lg';
}

function getBoxClass(size: 'sm' | 'md' | 'lg') {
  if (size === 'lg') return 'h-10 w-10 rounded-xl';
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

  // OpenAI — Official 6-petal interwoven knot mark
  if (
    family.includes('openai') ||
    /\bgpt-?\d/.test(family) ||
    /\bo[1345]-?(mini|pro|high)?\b/.test(family)
  ) {
    return (
      <span
        aria-hidden="true"
        title={provider}
        className={`inline-flex shrink-0 items-center justify-center bg-slate-950 text-white shadow-2xs ${box}`}
      >
        <svg viewBox="0 0 24 24" fill="currentColor" className={svg}>
          <path d="M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1686a.071.071 0 0 1 .038.052v5.5826a4.504 4.504 0 0 1-4.4945 4.4944zm-9.6607-4.1254a4.4708 4.4708 0 0 1-.5346-3.0137l.142.0852 4.783 2.7582a.7712.7712 0 0 0 .7806 0l5.8428-3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502a4.4992 4.4992 0 0 1-6.1408-1.6464zM2.3408 7.8956a4.485 4.485 0 0 1 2.3655-1.9728V11.6a.7664.7664 0 0 0 .3879.6765l5.8144 3.3543-2.0201 1.1685a.0757.0757 0 0 1-.071 0l-4.8303-2.7865A4.504 4.504 0 0 1 2.3408 7.872zm16.5963 3.8558L13.1038 8.364l2.0201-1.1638a.0757.0757 0 0 1 .071 0l4.8303 2.7913a4.4944 4.4944 0 0 1-.6765 8.1042v-5.6772a.79.79 0 0 0-.407-.667zm2.0107-3.0231l-.142-.0852-4.7735-2.7818a.7759.7759 0 0 0-.7854 0L9.409 9.2297V6.8974a.0662.0662 0 0 1 .0284-.0615l4.8303-2.7866a4.4992 4.4992 0 0 1 6.6802 4.66zM8.3065 12.863l-2.02-1.1638a.0804.0804 0 0 1-.038-.0567V6.0742a4.4992 4.4992 0 0 1 7.3757-3.4537l-.142.0805L8.704 5.459a.7948.7948 0 0 0-.3927.6813zm1.0976-2.3654l2.602-1.4998 2.6069 1.4998v2.9994l-2.5974 1.4997-2.6067-1.4997Z" />
        </svg>
      </span>
    );
  }

  // Anthropic / Claude — Official starburst flower mark
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
        className={`inline-flex shrink-0 items-center justify-center bg-[#D97757]/15 text-[#C96442] ring-1 ring-inset ring-[#D97757]/30 ${box}`}
      >
        <svg viewBox="0 0 24 24" fill="currentColor" className={svg}>
          <path d="M17.3041 3.541h-3.6718l6.6981 16.918H24L17.3041 3.541zm-10.6082 0L0 20.459h3.7442l1.3693-3.5527h7.0052l1.3693 3.5527h3.7442L10.5363 3.5409H6.6959zm.4203 10.6186L8.6157 9.95l1.4996 4.2096H7.1162z" />
        </svg>
      </span>
    );
  }

  // Google / Gemini — Official multi-color 4-point Gemini star
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
        className={`inline-flex shrink-0 items-center justify-center bg-slate-50 ring-1 ring-inset ring-slate-200/80 ${box}`}
      >
        <svg viewBox="0 0 24 24" fill="none" className={svg}>
          <path
            d="M12 2C12.24 7.72 16.28 11.76 22 12C16.28 12.24 12.24 16.28 12 22C11.76 16.28 7.72 12.24 2 12C7.72 11.76 11.76 7.72 12 2Z"
            fill="url(#pbGeminiOfficial)"
          />
          <defs>
            <linearGradient id="pbGeminiOfficial" x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#1A73E8" />
              <stop offset="50%" stopColor="#8E44AD" />
              <stop offset="100%" stopColor="#EA4335" />
            </linearGradient>
          </defs>
        </svg>
      </span>
    );
  }

  // DeepSeek — Official DeepSeek whale emblem
  if (family.includes('deepseek')) {
    return (
      <span
        aria-hidden="true"
        title={provider}
        className={`inline-flex shrink-0 items-center justify-center bg-[#4D6BFE]/15 text-[#3B59F6] ring-1 ring-inset ring-[#4D6BFE]/30 ${box}`}
      >
        <svg viewBox="0 0 24 24" fill="currentColor" className={svg}>
          <path d="M21.46 9.85c-.62-.42-1.44-.5-2.25-.22-.64-2.43-2.66-4.46-5.38-5.13-2.97-.73-6.17.13-8.17 2.2-1.46 1.5-2.16 3.52-1.96 5.56-.98.54-1.6 1.48-1.56 2.52.05 1.38 1.07 2.56 2.55 2.95 1.73 2.5 4.82 3.86 8.15 3.48 3.68-.42 6.66-2.85 7.51-6.14.99-.18 1.77-.86 1.98-1.76.22-.95-.18-1.95-.87-2.53Zm-11.2 1.25a1.15 1.15 0 1 1 0 2.3 1.15 1.15 0 0 1 0-2.3Z" />
        </svg>
      </span>
    );
  }

  // Mistral — Official Mistral 5-block geometric emblem
  if (family.includes('mistral') || family.includes('codestral') || family.includes('ministral')) {
    return (
      <span
        aria-hidden="true"
        title={provider}
        className={`inline-flex shrink-0 items-center justify-center bg-amber-500/12 ring-1 ring-inset ring-amber-500/25 ${box}`}
      >
        <svg viewBox="0 0 24 24" fill="none" className={svg}>
          <rect x="3" y="4" width="3.6" height="3.6" fill="#F7D046" />
          <rect x="17.4" y="4" width="3.6" height="3.6" fill="#F7D046" />
          <rect x="3" y="7.6" width="7.2" height="3.6" fill="#F29F05" />
          <rect x="13.8" y="7.6" width="7.2" height="3.6" fill="#F29F05" />
          <rect x="3" y="11.2" width="18" height="3.6" fill="#EA580C" />
          <rect x="3" y="14.8" width="3.6" height="5.2" fill="#D9381E" />
          <rect x="10.2" y="14.8" width="3.6" height="5.2" fill="#D9381E" />
          <rect x="17.4" y="14.8" width="3.6" height="5.2" fill="#D9381E" />
        </svg>
      </span>
    );
  }

  // xAI / Grok — Official xAI geometric X mark
  if (family.includes('xai') || family.includes('grok')) {
    return (
      <span
        aria-hidden="true"
        title={provider}
        className={`inline-flex shrink-0 items-center justify-center bg-zinc-950 text-white shadow-2xs ${box}`}
      >
        <svg viewBox="0 0 24 24" fill="currentColor" className={svg}>
          <path d="M2.25 4.5h3.72l5.28 7.05L16.95 4.5h3.28l-7.24 9.57L20.55 20h-3.72l-5.73-7.65L5.22 20H1.94l7.67-10.12L2.25 4.5Z" />
        </svg>
      </span>
    );
  }

  // Meta / Llama — Official Meta continuous infinity mark
  if (family.includes('meta') || family.includes('llama')) {
    return (
      <span
        aria-hidden="true"
        title={provider}
        className={`inline-flex shrink-0 items-center justify-center bg-[#0668E1]/12 text-[#0668E1] ring-1 ring-inset ring-[#0668E1]/25 ${box}`}
      >
        <svg viewBox="0 0 24 24" fill="none" className={svg}>
          <path
            d="M6.8 7.6C4.2 7.6 2.5 9.8 2.5 12.4c0 2.4 1.4 4.1 3.5 4.1 1.7 0 3.1-1.2 4.7-3.8l1.3-2.1 1.3 2.1c1.6 2.6 3 3.8 4.7 3.8 2.1 0 3.5-1.7 3.5-4.1 0-2.6-1.7-4.8-4.3-4.8-1.8 0-3.2 1.2-4.6 3.4L12 12.6l-.9-1.5C9.8 8.8 8.5 7.6 6.8 7.6Z"
            stroke="currentColor"
            strokeWidth="2.3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
    );
  }

  // Qwen / Alibaba — Official Qwen geometric Q prism
  if (family.includes('qwen') || family.includes('alibaba')) {
    return (
      <span
        aria-hidden="true"
        title={provider}
        className={`inline-flex shrink-0 items-center justify-center bg-[#6D28D9]/12 text-[#6D28D9] ring-1 ring-inset ring-[#6D28D9]/25 ${box}`}
      >
        <svg viewBox="0 0 24 24" fill="none" className={svg}>
          <path
            d="M12 3L20 7.6v8.8L12 21l-8-4.6V7.6L12 3Z"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinejoin="round"
          />
          <path
            d="M14.2 14.2 20 20"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
          />
        </svg>
      </span>
    );
  }

  // Moonshot / Kimi — Official Kimi moon & orbit mark
  if (family.includes('moonshot') || family.includes('kimi')) {
    return (
      <span
        aria-hidden="true"
        title={provider}
        className={`inline-flex shrink-0 items-center justify-center bg-slate-950 text-white shadow-2xs ${box}`}
      >
        <svg viewBox="0 0 24 24" fill="none" className={svg}>
          <path
            d="M15.4 4.2a8 8 0 1 0 4.6 14.1A6.9 6.9 0 0 1 15.4 4.2Z"
            fill="#FFFFFF"
          />
          <circle cx="18.2" cy="6.8" r="1.7" fill="#38BDF8" />
        </svg>
      </span>
    );
  }

  // Zhipu / GLM — Official Zhipu geometric Z mark
  if (family.includes('zhipu') || family.includes('glm') || family.includes('z.ai')) {
    return (
      <span
        aria-hidden="true"
        title={provider}
        className={`inline-flex shrink-0 items-center justify-center bg-slate-950 text-emerald-400 shadow-2xs ${box}`}
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

  // Cohere / Command
  if (family.includes('cohere') || family.includes('command')) {
    return (
      <span
        aria-hidden="true"
        title={provider}
        className={`inline-flex shrink-0 items-center justify-center bg-[#39594D]/14 text-[#2F4E42] ring-1 ring-inset ring-[#39594D]/25 ${box}`}
      >
        <svg viewBox="0 0 24 24" fill="currentColor" className={svg}>
          <rect x="3.5" y="5.5" width="12" height="5" rx="2.5" />
          <rect x="3.5" y="13.5" width="7.5" height="5" rx="2.5" fill="#10B981" />
          <circle cx="17.5" cy="16" r="2.6" fill="#D97757" />
        </svg>
      </span>
    );
  }

  const initials = (modelName || provider || 'AI')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('') || 'AI';

  return (
    <span
      aria-hidden="true"
      title={provider}
      className={`inline-flex shrink-0 items-center justify-center bg-slate-900 font-mono text-[10px] font-bold text-white shadow-2xs ${box}`}
    >
      {initials}
    </span>
  );
}
