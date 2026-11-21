'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ArrowUpDown,
  Calculator,
  Sparkles,
  FileText,
  GitBranch,
  Tag,
  BookOpen,
  Megaphone,
  Code2,
  Cpu,
  Scale,
  ChevronDown,
  Copy,
  Check,
  ExternalLink,
} from 'lucide-react';

const PRIMARY_NAV: { href: string; label: string; icon: React.FC<{ className?: string }> }[] = [
  { href: '/', label: 'Leaderboard', icon: ArrowUpDown },
  { href: '/compare', label: 'Compare (A vs B)', icon: Scale },
  { href: '/models', label: 'All Models', icon: Cpu },
  { href: '/pricing', label: 'API Pricing', icon: Calculator },
  { href: '/best-llms-for-coding', label: 'Best for Coding', icon: Code2 },
  { href: '/tools/llm-selector', label: 'LLM Selector', icon: Sparkles },
  { href: '/tools/token-counter', label: 'Token Counter', icon: FileText },
  { href: '/tools/routing-simulator', label: 'Routing', icon: GitBranch },
  { href: '/deals', label: 'Deals', icon: Tag },
];

const MORE_COLUMNS: {
  heading: string;
  links: { label: string; href: string }[];
}[] = [
  {
    heading: 'Popular Comparisons',
    links: [
      { label: 'Fable 5.2 vs Gemini 4 Neon', href: '/compare/claude-fable-5-2-vs-gemini-4-neon' },
      { label: 'Fable 5.2 vs GPT-6.2 Astra', href: '/compare/claude-fable-5-2-vs-gpt-6-2-astra' },
      { label: 'Gemini 4 Neon vs GPT-6.2 Astra', href: '/compare/gemini-4-neon-vs-gpt-6-2-astra' },
      { label: 'Gemini 4 Carbon vs Sonnet 5.5', href: '/compare/gemini-4-carbon-vs-claude-sonnet-5-5' },
      { label: 'All 190 Top-20 Comparisons', href: '/compare' },
    ],
  },
  {
    heading: 'Use-Case Hubs',
    links: [
      { label: 'Best LLMs for Coding', href: '/best-llms-for-coding' },
      { label: 'Best Open-Weight LLMs', href: '/best-open-weight-llms' },
      { label: 'Cheapest for Classification', href: '/cheapest-llms-for-classification' },
      { label: 'Fastest LLMs (Tok/s)', href: '/fastest-llms-tokens-per-second' },
    ],
  },
  {
    heading: 'Providers & Info',
    links: [
      { label: 'Anthropic Models', href: '/providers/anthropic' },
      { label: 'Google Gemini Models', href: '/providers/google-gemini' },
      { label: 'OpenAI Models', href: '/providers/openai' },
      { label: 'Methodology', href: '/methodology' },
      { label: 'Advertise', href: '/advertise' },
    ],
  },
];

export function SiteShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (typeof window === 'undefined') return;
    navigator.clipboard?.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex flex-col">
      <header
        className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur"
        onMouseLeave={() => setMoreOpen(false)}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2.5 shrink-0">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 font-mono text-sm font-bold text-white">
              PB
            </span>
            <div>
              <div className="text-base font-bold tracking-tight text-slate-900 leading-none">
                PromptBill
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">promptbill.online</div>
            </div>
          </Link>

          <nav aria-label="Main Navigation" className="hidden xl:flex items-center gap-1 text-xs font-medium">
            {PRIMARY_NAV.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 transition-colors ${
                    active
                      ? 'bg-slate-900 text-white'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{item.label}</span>
                </Link>
              );
            })}

            <div className="relative" onMouseEnter={() => setMoreOpen(true)}>
              <button
                type="button"
                aria-expanded={moreOpen}
                onClick={() => setMoreOpen((prev) => !prev)}
                className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              >
                <span>More</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${moreOpen ? 'rotate-180' : ''}`} />
              </button>

              {moreOpen && (
                <div className="absolute right-0 mt-1.5 w-[560px] rounded-xl border border-slate-200 bg-white p-5 shadow-lg grid grid-cols-3 gap-5 z-40">
                  {MORE_COLUMNS.map((col) => (
                    <div key={col.heading} className="space-y-2">
                      <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                        {col.heading}
                      </div>
                      <ul className="space-y-1 text-xs">
                        {col.links.map((lnk) => (
                          <li key={lnk.label}>
                            <Link
                              href={lnk.href}
                              onClick={() => setMoreOpen(false)}
                              className="block rounded-md px-2 py-1 text-slate-700 hover:bg-slate-100 hover:text-slate-900 font-medium"
                            >
                              {lnk.label}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </nav>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{copied ? 'Copied' : 'Share'}</span>
            </button>
            <Link
              href="/deals"
              className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
            >
              Deals
            </Link>
          </div>
        </div>

        {/* Mobile / Tablet Touch-Friendly Horizontal Scroll Bar */}
        <nav aria-label="Mobile Navigation" className="flex xl:hidden overflow-x-auto border-t border-slate-100 px-4 py-2 gap-1.5 text-xs font-medium no-scrollbar">
          {[...PRIMARY_NAV, { href: '/methodology', label: 'Methodology', icon: BookOpen }, { href: '/advertise', label: 'Advertise', icon: Megaphone }].map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`shrink-0 rounded-full px-3 py-1.5 ${
                  active ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700 active:bg-slate-200'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </header>

      <main className="mx-auto w-full max-w-7xl flex-1 space-y-6 px-4 py-6 sm:py-8 sm:px-6 lg:px-8">
        <div className="border-b border-slate-200 pb-4 sm:pb-5">
          <p className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-emerald-700 break-all">
            {subtitle}
          </p>
          <h1 className="mt-1 text-xl sm:text-3xl font-bold tracking-tight text-slate-900 leading-snug">
            {title}
          </h1>
        </div>
        {children}
      </main>

      <footer className="border-t border-slate-200 bg-white py-6 text-xs text-slate-600">
        <div className="mx-auto flex max-w-7xl flex-col sm:flex-row items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <div className="font-medium text-slate-700 text-center sm:text-left">
            PromptBill (<a href="https://promptbill.online" className="underline">https://promptbill.online</a>) · All rights reserved
          </div>
          <div className="flex flex-wrap justify-center sm:justify-end items-center gap-3 sm:gap-4">
            <Link href="/" className="hover:text-slate-900">Leaderboard</Link>
            <Link href="/compare" className="hover:text-slate-900">Compare Hub</Link>
            <Link href="/models" className="hover:text-slate-900">All Models</Link>
            <Link href="/pricing" className="hover:text-slate-900">API Pricing</Link>
            <a href="/sitemap.xml" className="inline-flex items-center gap-1 hover:text-slate-900">
              Sitemap <ExternalLink className="w-3 h-3" />
            </a>
            <a href="/llms.txt" className="inline-flex items-center gap-1 hover:text-slate-900">
              llms.txt <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
