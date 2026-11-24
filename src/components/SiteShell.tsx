'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Home,
  ArrowUpDown,
  Calculator,
  Sparkles,
  FileText,
  GitBranch,
  Tag,
  Code2,
  Cpu,
  Scale,
  ChevronDown,
  Copy,
  Check,
  ExternalLink,
  Menu,
  X,
} from 'lucide-react';

const PRIMARY_NAV: { href: string; label: string; icon: React.FC<{ className?: string }> }[] = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/leaderboard', label: 'Leaderboard', icon: ArrowUpDown },
  { href: '/compare', label: 'Compare', icon: Scale },
  { href: '/pricing', label: 'API Pricing', icon: Calculator },
  { href: '/tools/llm-selector', label: 'LLM Selector', icon: Sparkles },
  { href: '/best-llms-for-coding', label: 'Best for Coding', icon: Code2 },
  { href: '/tools/token-counter', label: 'Token Counter', icon: FileText },
  { href: '/tools/routing-simulator', label: 'Routing', icon: GitBranch },
  { href: '/models', label: 'All Models', icon: Cpu },
];

const MORE_COLUMNS: {
  heading: string;
  links: { label: string; href: string }[];
}[] = [
  {
    heading: 'Tools & Calculators',
    links: [
      { label: 'API Pricing & Rates', href: '/pricing' },
      { label: 'LLM Selector', href: '/tools/llm-selector' },
      { label: 'Token Counter', href: '/tools/token-counter' },
      { label: 'Routing Simulator', href: '/tools/routing-simulator' },
      { label: 'All Tracked Models', href: '/models' },
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
    heading: 'Comparisons & Info',
    links: [
      { label: 'Compare Hub (A vs B)', href: '/compare' },
      { label: 'Fable 5.2 vs Gemini 4 Neon', href: '/compare/claude-fable-5-2-vs-gemini-4-neon' },
      { label: 'Fable 5.2 vs GPT-6.2 Astra', href: '/compare/claude-fable-5-2-vs-gpt-6-2-astra' },
      { label: 'Deals', href: '/deals' },
      { label: 'Methodology', href: '/methodology' },
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
  const router = useRouter();
  const [moreOpen, setMoreOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    router.prefetch('/');
    router.prefetch('/leaderboard');
    router.prefetch('/compare');
    router.prefetch('/pricing');
  }, [router]);

  useEffect(() => {
    setMobileMenuOpen(false);
    setMoreOpen(false);
  }, [pathname]);

  const handleCopy = () => {
    if (typeof window === 'undefined') return;
    navigator.clipboard?.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex flex-col pb-24 lg:pb-0 text-[14px] sm:text-[15px] leading-relaxed overflow-x-hidden">
      <header
        className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur"
        onMouseLeave={() => setMoreOpen(false)}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-2 px-3.5 py-2 sm:px-6 lg:px-8">
          <Link href="/" prefetch={true} aria-label="PromptBill Home" className="flex items-center gap-2 shrink-0 min-h-[44px] pr-1">
            <span className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-lg bg-slate-900 font-mono text-xs sm:text-sm font-bold text-white">
              PB
            </span>
            <div>
              <div className="text-sm sm:text-base font-bold tracking-tight text-slate-900 leading-none">
                PromptBill
              </div>
              <div className="text-[11px] text-slate-600 mt-0.5">promptbill.online</div>
            </div>
          </Link>

          <nav aria-label="Main Navigation" className="hidden xl:flex items-center gap-1.5 text-xs font-medium">
            {PRIMARY_NAV.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  prefetch={true}
                  className={`inline-flex min-h-[44px] items-center gap-1.5 rounded-lg px-2.5 py-2 transition-colors ${
                    active
                      ? 'bg-slate-900 text-white'
                      : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
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
                className="inline-flex min-h-[44px] items-center gap-1 rounded-lg px-2.5 py-2 text-slate-700 hover:bg-slate-100 hover:text-slate-900"
              >
                <span>More</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${moreOpen ? 'rotate-180' : ''}`} />
              </button>

              {moreOpen && (
                <div className="absolute right-0 mt-1.5 w-[560px] rounded-xl border border-slate-200 bg-white p-5 shadow-lg grid grid-cols-3 gap-5 z-40">
                  {MORE_COLUMNS.map((col) => (
                    <div key={col.heading} className="space-y-2">
                      <div className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
                        {col.heading}
                      </div>
                      <ul className="space-y-2 text-xs">
                        {col.links.map((lnk) => (
                          <li key={lnk.label}>
                            <Link
                              href={lnk.href}
                              prefetch={true}
                              onClick={() => setMoreOpen(false)}
                              className="flex min-h-[36px] items-center rounded-md px-2.5 py-1.5 text-slate-700 hover:bg-slate-100 hover:text-slate-900 font-medium"
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
              aria-label="Copy current page URL"
              className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-700" /> : <Copy className="w-4 h-4" />}
              <span className="hidden sm:inline">{copied ? 'Copied' : 'Share'}</span>
            </button>

            <Link
              href="/deals"
              prefetch={true}
              className="hidden sm:inline-flex min-h-[44px] items-center gap-1 rounded-lg bg-emerald-800 px-3.5 py-2 text-xs font-semibold text-white hover:bg-emerald-900"
            >
              <Tag className="w-3.5 h-3.5" />
              <span>Deals</span>
            </Link>

            <button
              type="button"
              aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
              aria-expanded={mobileMenuOpen}
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              className="xl:hidden inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-900 hover:bg-slate-100"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="xl:hidden border-t border-slate-200 bg-white px-4 py-4 shadow-lg max-h-[75vh] overflow-y-auto space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {PRIMARY_NAV.map((item) => {
                const Icon = item.icon;
                const active = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    prefetch={true}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex min-h-[44px] items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold ${
                      active
                        ? 'bg-slate-900 text-white'
                        : 'bg-slate-50 text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </Link>
                );
              })}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-slate-100">
              {MORE_COLUMNS.map((col) => (
                <div key={col.heading} className="space-y-1.5">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-600 px-2">
                    {col.heading}
                  </div>
                  <div className="flex flex-col gap-1.5">
                    {col.links.map((lnk) => (
                      <Link
                        key={lnk.href}
                        href={lnk.href}
                        prefetch={true}
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex min-h-[40px] items-center rounded-lg bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-900 hover:bg-slate-100"
                      >
                        {lnk.label}
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </header>

      <main className="mx-auto w-full max-w-7xl flex-1 space-y-5 sm:space-y-6 px-3.5 py-4 sm:py-8 sm:px-6 lg:px-8">
        <div className="border-b border-slate-200 pb-3 sm:pb-5">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-emerald-800 break-words">
            {subtitle}
          </p>
          <h1 className="mt-1 text-lg sm:text-3xl font-bold tracking-tight text-slate-900 leading-snug">
            {title}
          </h1>
        </div>
        {children}
      </main>

      <footer className="border-t border-slate-200 bg-white py-6 text-xs text-slate-700">
        <div className="mx-auto flex max-w-7xl flex-col sm:flex-row items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <div className="font-medium text-slate-800 text-center sm:text-left">
            PromptBill (<a href="https://promptbill.online" className="underline">https://promptbill.online</a>) · All rights reserved
          </div>
          <div className="flex flex-wrap justify-center sm:justify-end items-center gap-2">
            <Link href="/" prefetch={true} className="inline-flex min-h-[44px] items-center px-2.5 py-2 hover:text-slate-950">Home</Link>
            <Link href="/leaderboard" prefetch={true} className="inline-flex min-h-[44px] items-center px-2.5 py-2 hover:text-slate-950">Leaderboard</Link>
            <Link href="/compare" prefetch={true} className="inline-flex min-h-[44px] items-center px-2.5 py-2 hover:text-slate-950">Compare</Link>
            <Link href="/pricing" prefetch={true} className="inline-flex min-h-[44px] items-center px-2.5 py-2 hover:text-slate-950">API Pricing</Link>
            <Link href="/best-llms-for-coding" prefetch={true} className="inline-flex min-h-[44px] items-center px-2.5 py-2 hover:text-slate-950">Coding</Link>
            <Link href="/tools/llm-selector" prefetch={true} className="inline-flex min-h-[44px] items-center px-2.5 py-2 hover:text-slate-950">Selector</Link>
            <Link href="/tools/token-counter" prefetch={true} className="inline-flex min-h-[44px] items-center px-2.5 py-2 hover:text-slate-950">Token Counter</Link>
            <Link href="/tools/routing-simulator" prefetch={true} className="inline-flex min-h-[44px] items-center px-2.5 py-2 hover:text-slate-950">Routing</Link>
            <Link href="/about" prefetch={true} className="inline-flex min-h-[44px] items-center px-2.5 py-2 hover:text-slate-950">About</Link>
            <Link href="/contact" prefetch={true} className="inline-flex min-h-[44px] items-center px-2.5 py-2 hover:text-slate-950">Contact</Link>
            <Link href="/privacy-policy" prefetch={true} className="inline-flex min-h-[44px] items-center px-2.5 py-2 hover:text-slate-950">Privacy Policy</Link>
            <a href="/sitemap.xml" className="inline-flex min-h-[44px] items-center gap-1 px-2.5 py-2 hover:text-slate-950">
              Sitemap <ExternalLink className="w-3 h-3" />
            </a>
            <a href="/llms.txt" className="inline-flex min-h-[44px] items-center gap-1 px-2.5 py-2 hover:text-slate-950">
              llms.txt <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </footer>

      <nav
        aria-label="Mobile Quick Navigation"
        className="lg:hidden fixed bottom-0 inset-x-0 z-40 border-t border-slate-200 bg-white/95 backdrop-blur px-2 py-1.5 shadow-lg"
      >
        <div className="mx-auto grid max-w-lg grid-cols-4 gap-1.5">
          <Link
            href="/"
            prefetch={true}
            className={`touch-manipulation flex min-h-[44px] flex-col items-center justify-center rounded-lg text-[11px] font-semibold ${
              pathname === '/'
                ? 'bg-emerald-800 text-white'
                : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            <Home className="w-4 h-4 mb-0.5" />
            <span>Home</span>
          </Link>

          <Link
            href="/leaderboard"
            prefetch={true}
            className={`touch-manipulation flex min-h-[44px] flex-col items-center justify-center rounded-lg text-[11px] font-semibold ${
              pathname?.startsWith('/leaderboard')
                ? 'bg-emerald-800 text-white'
                : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            <ArrowUpDown className="w-4 h-4 mb-0.5" />
            <span>Leaderboard</span>
          </Link>

          <Link
            href="/pricing"
            prefetch={true}
            className={`touch-manipulation flex min-h-[44px] flex-col items-center justify-center rounded-lg text-[11px] font-semibold ${
              pathname?.startsWith('/pricing')
                ? 'bg-emerald-800 text-white'
                : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            <Calculator className="w-4 h-4 mb-0.5" />
            <span>Pricing</span>
          </Link>

          <Link
            href="/compare"
            prefetch={true}
            className={`touch-manipulation flex min-h-[44px] flex-col items-center justify-center rounded-lg text-[11px] font-semibold ${
              pathname?.startsWith('/compare')
                ? 'bg-emerald-800 text-white'
                : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            <Scale className="w-4 h-4 mb-0.5" />
            <span>Compare</span>
          </Link>
        </div>
      </nav>
    </div>
  );
}
