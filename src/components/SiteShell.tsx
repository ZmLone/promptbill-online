'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  ArrowUpDown,
  Calculator,
  Sparkles,
  FileText,
  GitBranch,
  Megaphone,
  Code2,
  Cpu,
  Scale,
  ChevronDown,
  ExternalLink,
  Menu,
  X,
} from 'lucide-react';

const PRIMARY_NAV: {
  href: string;
  label: string;
  icon: React.FC<{ className?: string }>;
}[] = [
  { href: '/leaderboard', label: 'Leaderboard', icon: ArrowUpDown },
  { href: '/compare', label: 'Compare', icon: Scale },
  { href: '/pricing', label: 'API Pricing', icon: Calculator },
  { href: '/tools/llm-selector', label: 'Selector', icon: Sparkles },
  { href: '/best-llms-for-coding', label: 'Coding', icon: Code2 },
  { href: '/tools/token-counter', label: 'Tokenizer', icon: FileText },
  { href: '/tools/routing-simulator', label: 'Routing', icon: GitBranch },
  { href: '/models', label: 'Models', icon: Cpu },
];

const MORE_COLUMNS: {
  heading: string;
  links: { label: string; href: string }[];
}[] = [
  {
    heading: 'Tools & Calculators',
    links: [
      { label: 'API Pricing & Rates', href: '/pricing' },
      { label: 'LLM API News', href: '/news' },
      { label: 'LLM Selector', href: '/tools/llm-selector' },
      { label: 'Token Counter', href: '/tools/token-counter' },
      { label: 'Routing Simulator', href: '/tools/routing-simulator' },
      { label: 'Models Directory', href: '/models' },
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
      { label: 'Advertise', href: '/advertise' },
      { label: 'Methodology', href: '/methodology' },
    ],
  },
];

export function SiteShell({
  title,
  subtitle,
  hidePageHeader = false,
  children,
}: {
  title?: string;
  subtitle?: string;
  hidePageHeader?: boolean;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [moreOpen, setMoreOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    router.prefetch('/');
    router.prefetch('/leaderboard');
    router.prefetch('/compare');
    router.prefetch('/pricing');
    router.prefetch('/models');
  }, [router]);

  useEffect(() => {
    setMobileMenuOpen(false);
    setMoreOpen(false);
  }, [pathname]);

  return (
    <div className="min-h-screen bg-[#fbfbfd] text-slate-900 flex flex-col pb-24 lg:pb-0 text-[14px] sm:text-[15px] leading-relaxed overflow-x-hidden">
      <header
        className="sticky top-0 z-30 border-b border-slate-200/70 bg-white/90 backdrop-blur-md"
        onMouseLeave={() => setMoreOpen(false)}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-2.5 sm:px-6 lg:px-8">
          {/* Brand Logo serves as the single clean Home link */}
          <Link
            href="/"
            prefetch={true}
            aria-label="PromptBill Home"
            className="flex items-center gap-2.5 shrink-0 min-h-[42px] group"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-950 font-mono text-xs font-bold text-white shadow-xs group-hover:bg-emerald-800 transition-colors">
              PB
            </span>
            <div>
              <div className="text-[15px] font-bold tracking-tight text-slate-950 leading-none">
                PromptBill
              </div>
              <div className="text-[11px] font-mono text-slate-500 mt-0.5">promptbill.online</div>
            </div>
          </Link>

          {/* Uniformly Spaced Desktop Nav (No Home tab clutter) */}
          <nav
            aria-label="Main Navigation"
            className="hidden xl:flex items-center gap-2 text-[13px] font-medium"
          >
            {PRIMARY_NAV.map((item) => {
              const Icon = item.icon;
              const active =
                pathname === item.href ||
                (item.href !== '/' && pathname?.startsWith(`${item.href}/`));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  prefetch={true}
                  className={`inline-flex h-9 items-center gap-1.5 rounded-full px-3.5 transition-colors whitespace-nowrap ${
                    active
                      ? 'bg-slate-950 text-white font-semibold shadow-2xs'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  <span>{item.label}</span>
                </Link>
              );
            })}

            <div className="relative" onMouseEnter={() => setMoreOpen(true)}>
              <button
                type="button"
                aria-expanded={moreOpen}
                onClick={() => setMoreOpen((prev) => !prev)}
                className={`inline-flex h-9 items-center gap-1 rounded-full px-3.5 transition-colors whitespace-nowrap ${
                  moreOpen
                    ? 'bg-slate-100 text-slate-950 font-semibold'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950'
                }`}
              >
                <span>More</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform ${moreOpen ? 'rotate-180' : ''}`}
                />
              </button>

              {moreOpen && (
                <div className="absolute right-0 mt-2 w-[580px] rounded-2xl border border-slate-200/90 bg-white/98 backdrop-blur-md p-6 shadow-xl grid grid-cols-3 gap-6 z-40">
                  {MORE_COLUMNS.map((col) => (
                    <div key={col.heading} className="space-y-2.5">
                      <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                        {col.heading}
                      </div>
                      <ul className="space-y-1.5 text-xs">
                        {col.links.map((lnk) => (
                          <li key={lnk.label}>
                            <Link
                              href={lnk.href}
                              prefetch={true}
                              onClick={() => setMoreOpen(false)}
                              className="flex min-h-[34px] items-center rounded-lg px-2.5 py-1.5 text-slate-700 hover:bg-slate-100 hover:text-slate-950 font-medium transition-colors"
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

          <div className="flex items-center gap-2.5 shrink-0">
            <Link
              href="/advertise"
              prefetch={true}
              className="hidden sm:inline-flex h-9 items-center gap-1.5 rounded-full border border-slate-200 bg-white px-4 text-xs font-semibold text-slate-800 hover:border-slate-300 hover:bg-slate-50 transition-colors"
            >
              <Megaphone className="w-3.5 h-3.5 text-emerald-700" />
              <span>Advertise</span>
            </Link>

            <button
              type="button"
              aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
              aria-expanded={mobileMenuOpen}
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              className="xl:hidden inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-900 hover:bg-slate-50"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="xl:hidden border-t border-slate-200/80 bg-white px-4 py-5 shadow-xl max-h-[78vh] overflow-y-auto space-y-5">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {PRIMARY_NAV.map((item) => {
                const Icon = item.icon;
                const active =
                  pathname === item.href ||
                  (item.href !== '/' && pathname?.startsWith(`${item.href}/`));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    prefetch={true}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex min-h-[44px] items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold ${
                      active
                        ? 'bg-slate-950 text-white'
                        : 'bg-slate-50 text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </Link>
                );
              })}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-3 border-t border-slate-100">
              {MORE_COLUMNS.map((col) => (
                <div key={col.heading} className="space-y-1.5">
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 px-2">
                    {col.heading}
                  </div>
                  <div className="flex flex-col gap-1">
                    {col.links.map((lnk) => (
                      <Link
                        key={lnk.href}
                        href={lnk.href}
                        prefetch={true}
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex min-h-[40px] items-center rounded-xl bg-slate-50/70 px-3 py-1.5 text-xs font-medium text-slate-800 hover:bg-slate-100"
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

      <main className="mx-auto w-full max-w-7xl flex-1 space-y-12 sm:space-y-16 px-4 py-6 sm:py-10 sm:px-6 lg:px-8">
        {!hidePageHeader && title ? (
          <div className="border-b border-slate-200/80 pb-4 sm:pb-6">
            {subtitle ? (
              <p className="text-[11px] font-semibold uppercase tracking-wider text-emerald-800 break-words">
                {subtitle}
              </p>
            ) : null}
            <h1 className="mt-1.5 text-xl sm:text-3xl font-bold tracking-tight text-slate-950 leading-snug">
              {title}
            </h1>
          </div>
        ) : null}
        {children}
      </main>

      <footer
        aria-label="Site footer"
        className="border-t border-slate-200/80 bg-white py-12 text-xs text-slate-600"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-4 space-y-2.5">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-950 font-mono text-[11px] font-bold text-white">
                  PB
                </span>
                <span className="font-bold text-slate-950 text-sm">PromptBill</span>
              </div>
              <p className="text-slate-500 leading-relaxed max-w-sm">
                Verified LLM API token pricing, caching &amp; batch cost math, and multi-endpoint
                benchmarks across Official APIs, Inference Clouds, and Routers.
              </p>
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <a
                  href="/sitemap.xml"
                  className="inline-flex min-h-[34px] items-center gap-1 rounded-full border border-slate-200 bg-slate-50/70 px-3 py-1 font-mono text-[11px] text-slate-700 hover:bg-slate-100"
                >
                  Sitemap <ExternalLink className="w-3 h-3" />
                </a>
                <a
                  href="/llms.txt"
                  className="inline-flex min-h-[34px] items-center gap-1 rounded-full border border-slate-200 bg-slate-50/70 px-3 py-1 font-mono text-[11px] text-slate-700 hover:bg-slate-100"
                >
                  llms.txt <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>

            <nav aria-label="Models and pricing" className="lg:col-span-2 space-y-2.5">
              <h2 className="text-[11px] font-bold uppercase tracking-wider text-slate-900">
                Catalog &amp; News
              </h2>
              <ul className="space-y-1.5">
                <li>
                  <Link href="/models" prefetch={true} className="inline-flex py-1 hover:text-slate-950">
                    Models Directory
                  </Link>
                </li>
                <li>
                  <Link href="/leaderboard" prefetch={true} className="inline-flex py-1 hover:text-slate-950">
                    Leaderboard
                  </Link>
                </li>
                <li>
                  <Link href="/compare" prefetch={true} className="inline-flex py-1 hover:text-slate-950">
                    Compare Models
                  </Link>
                </li>
                <li>
                  <Link href="/pricing" prefetch={true} className="inline-flex py-1 hover:text-slate-950">
                    API Pricing
                  </Link>
                </li>
                <li>
                  <Link href="/news" prefetch={true} className="inline-flex py-1 font-semibold text-emerald-800 hover:text-emerald-950">
                    LLM API News
                  </Link>
                </li>
              </ul>
            </nav>

            <nav aria-label="Cost tools" className="lg:col-span-2 space-y-2.5">
              <h2 className="text-[11px] font-bold uppercase tracking-wider text-slate-900">
                Cost Tools
              </h2>
              <ul className="space-y-1.5">
                <li>
                  <Link href="/tools/llm-selector" prefetch={true} className="inline-flex py-1 hover:text-slate-950">
                    LLM Selector
                  </Link>
                </li>
                <li>
                  <Link href="/tools/token-counter" prefetch={true} className="inline-flex py-1 hover:text-slate-950">
                    Token Counter
                  </Link>
                </li>
                <li>
                  <Link href="/tools/routing-simulator" prefetch={true} className="inline-flex py-1 hover:text-slate-950">
                    Routing Simulator
                  </Link>
                </li>
              </ul>
            </nav>

            <nav aria-label="Use-case guides" className="lg:col-span-2 space-y-2.5">
              <h2 className="text-[11px] font-bold uppercase tracking-wider text-slate-900">
                Best-Of Guides
              </h2>
              <ul className="space-y-1.5">
                <li>
                  <Link href="/best-llms-for-coding" prefetch={true} className="inline-flex py-1 hover:text-slate-950">
                    Best for Coding
                  </Link>
                </li>
                <li>
                  <Link href="/best-open-weight-llms" prefetch={true} className="inline-flex py-1 hover:text-slate-950">
                    Best Open-Weight
                  </Link>
                </li>
                <li>
                  <Link href="/cheapest-llms-for-classification" prefetch={true} className="inline-flex py-1 hover:text-slate-950">
                    Cheapest Classification
                  </Link>
                </li>
                <li>
                  <Link href="/fastest-llms-tokens-per-second" prefetch={true} className="inline-flex py-1 hover:text-slate-950">
                    Fastest (tok/s)
                  </Link>
                </li>
              </ul>
            </nav>

            <nav aria-label="Company and methodology" className="lg:col-span-2 space-y-2.5">
              <h2 className="text-[11px] font-bold uppercase tracking-wider text-slate-900">
                Trust &amp; Info
              </h2>
              <ul className="space-y-1.5">
                <li>
                  <Link href="/methodology" prefetch={true} className="inline-flex py-1 hover:text-slate-950">
                    Methodology
                  </Link>
                </li>
                <li>
                  <Link href="/about" prefetch={true} className="inline-flex py-1 hover:text-slate-950">
                    About PromptBill
                  </Link>
                </li>
                <li>
                  <Link href="/advertise" prefetch={true} className="inline-flex py-1 hover:text-slate-950">
                    Advertise
                  </Link>
                </li>
                <li>
                  <Link href="/contact" prefetch={true} className="inline-flex py-1 hover:text-slate-950">
                    Contact
                  </Link>
                </li>
                <li>
                  <Link href="/privacy-policy" prefetch={true} className="inline-flex py-1 hover:text-slate-950">
                    Privacy Policy
                  </Link>
                </li>
              </ul>
            </nav>
          </div>

          <div className="border-t border-slate-100 pt-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-[11px] text-slate-500">
            <span>
              PromptBill · Normalized USD per 1M token pricing &amp; LLM benchmark intelligence.
            </span>
            <span>All token rates normalized per 1,000,000 tokens (USD).</span>
          </div>
        </div>
      </footer>

      <nav
        aria-label="Mobile Quick Navigation"
        className="lg:hidden fixed bottom-0 inset-x-0 z-40 border-t border-slate-200/90 bg-white/95 backdrop-blur-md px-2 py-1.5 shadow-lg"
      >
        <div className="mx-auto grid max-w-lg grid-cols-4 gap-1.5">
          <Link
            href="/pricing"
            prefetch={true}
            className={`touch-manipulation flex min-h-[44px] flex-col items-center justify-center rounded-xl text-[11px] font-semibold ${
              pathname?.startsWith('/pricing') ? 'bg-slate-950 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Calculator className="w-4 h-4 mb-0.5" />
            <span>Pricing</span>
          </Link>

          <Link
            href="/leaderboard"
            prefetch={true}
            className={`touch-manipulation flex min-h-[44px] flex-col items-center justify-center rounded-xl text-[11px] font-semibold ${
              pathname?.startsWith('/leaderboard')
                ? 'bg-slate-950 text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <ArrowUpDown className="w-4 h-4 mb-0.5" />
            <span>Leaderboard</span>
          </Link>

          <Link
            href="/models"
            prefetch={true}
            className={`touch-manipulation flex min-h-[44px] flex-col items-center justify-center rounded-xl text-[11px] font-semibold ${
              pathname?.startsWith('/models')
                ? 'bg-slate-950 text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Cpu className="w-4 h-4 mb-0.5" />
            <span>Models</span>
          </Link>

          <Link
            href="/compare"
            prefetch={true}
            className={`touch-manipulation flex min-h-[44px] flex-col items-center justify-center rounded-xl text-[11px] font-semibold ${
              pathname?.startsWith('/compare')
                ? 'bg-slate-950 text-white'
                : 'text-slate-600 hover:bg-slate-100'
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
