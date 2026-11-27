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
  hideOnHome?: boolean;
}[] = [
  { href: '/', label: 'Home', icon: Home, hideOnHome: true },
  { href: '/leaderboard', label: 'Leaderboard', icon: ArrowUpDown },
  { href: '/compare', label: 'Compare', icon: Scale },
  { href: '/pricing', label: 'API Pricing', icon: Calculator },
  { href: '/tools/llm-selector', label: 'LLM Selector', icon: Sparkles },
  { href: '/best-llms-for-coding', label: 'Coding', icon: Code2 },
  { href: '/tools/token-counter', label: 'Token Counter', icon: FileText },
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
  const isHome = pathname === '/';

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

  const visibleDesktopNav = PRIMARY_NAV.filter((item) => !(isHome && item.hideOnHome));

  return (
    <div className="min-h-screen bg-[#fbfbfd] text-slate-900 flex flex-col pb-24 lg:pb-0 text-[14px] sm:text-[15px] leading-relaxed overflow-x-hidden">
      <header
        className="sticky top-0 z-30 border-b border-slate-200/70 bg-white/85 backdrop-blur-md"
        onMouseLeave={() => setMoreOpen(false)}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-2.5 sm:px-6 lg:px-8">
          <Link
            href="/"
            prefetch={true}
            aria-label="PromptBill Home"
            className="flex items-center gap-2.5 shrink-0 min-h-[42px] pr-1 group"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-950 font-mono text-xs font-bold text-white shadow-xs group-hover:bg-emerald-900 transition-colors">
              PB
            </span>
            <div>
              <div className="text-[15px] font-bold tracking-tight text-slate-950 leading-none">
                PromptBill
              </div>
              <div className="text-[11px] font-mono text-slate-500 mt-0.5">promptbill.online</div>
            </div>
          </Link>

          <nav aria-label="Main Navigation" className="hidden xl:flex items-center gap-1 text-xs font-medium">
            {visibleDesktopNav.map((item) => {
              const Icon = item.icon;
              const active =
                pathname === item.href || (item.href === '/models' && pathname?.startsWith('/models'));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  prefetch={true}
                  className={`inline-flex min-h-[36px] items-center gap-1.5 rounded-full px-3 py-1.5 transition-colors ${
                    active
                      ? 'bg-slate-950 text-white'
                      : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-950'
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
                className="inline-flex min-h-[36px] items-center gap-1 rounded-full px-3 py-1.5 text-slate-600 hover:bg-slate-100/80 hover:text-slate-950"
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

          <div className="flex items-center gap-2 shrink-0">
            <Link
              href="/advertise"
              prefetch={true}
              className="hidden sm:inline-flex min-h-[36px] items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-800 hover:border-slate-300 hover:bg-slate-50 transition-colors"
            >
              <Megaphone className="w-3.5 h-3.5 text-emerald-700" />
              <span>Advertise</span>
            </Link>

            <button
              type="button"
              aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
              aria-expanded={mobileMenuOpen}
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              className="xl:hidden inline-flex min-h-[42px] min-w-[42px] items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-900 hover:bg-slate-50"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="xl:hidden border-t border-slate-200/80 bg-white px-4 py-5 shadow-xl max-h-[78vh] overflow-y-auto space-y-5">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {visibleDesktopNav.map((item) => {
                const Icon = item.icon;
                const active =
                  pathname === item.href || (item.href === '/models' && pathname?.startsWith('/models'));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    prefetch={true}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex min-h-[44px] items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold ${
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

      <footer className="border-t border-slate-200/70 bg-white py-10 text-xs text-slate-600">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="font-bold text-slate-950 text-sm">PromptBill</div>
              <p className="text-slate-500">
                Verified LLM API token pricing, caching &amp; batch cost math, and multi-endpoint benchmarks.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <a
                href="/sitemap.xml"
                className="inline-flex min-h-[36px] items-center gap-1 rounded-full border border-slate-200 px-3 py-1.5 font-mono text-[11px] text-slate-700 hover:bg-slate-50"
              >
                Sitemap <ExternalLink className="w-3 h-3" />
              </a>
              <a
                href="/llms.txt"
                className="inline-flex min-h-[36px] items-center gap-1 rounded-full border border-slate-200 px-3 py-1.5 font-mono text-[11px] text-slate-700 hover:bg-slate-50"
              >
                llms.txt <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-slate-100 pt-5 text-slate-600">
            <Link href="/" prefetch={true} className="hover:text-slate-950">Home</Link>
            <Link href="/leaderboard" prefetch={true} className="hover:text-slate-950">Leaderboard</Link>
            <Link href="/compare" prefetch={true} className="hover:text-slate-950">Compare</Link>
            <Link href="/pricing" prefetch={true} className="hover:text-slate-950">API Pricing</Link>
            <Link href="/models" prefetch={true} className="hover:text-slate-950">Models</Link>
            <Link href="/best-llms-for-coding" prefetch={true} className="hover:text-slate-950">Coding</Link>
            <Link href="/tools/llm-selector" prefetch={true} className="hover:text-slate-950">Selector</Link>
            <Link href="/tools/token-counter" prefetch={true} className="hover:text-slate-950">Token Counter</Link>
            <Link href="/tools/routing-simulator" prefetch={true} className="hover:text-slate-950">Routing</Link>
            <Link href="/methodology" prefetch={true} className="hover:text-slate-950">Methodology</Link>
            <Link href="/about" prefetch={true} className="hover:text-slate-950">About</Link>
            <Link href="/contact" prefetch={true} className="hover:text-slate-950">Contact</Link>
            <Link href="/privacy-policy" prefetch={true} className="hover:text-slate-950">Privacy Policy</Link>
          </div>
        </div>
      </footer>

      <nav
        aria-label="Mobile Quick Navigation"
        className="lg:hidden fixed bottom-0 inset-x-0 z-40 border-t border-slate-200/90 bg-white/95 backdrop-blur-md px-2 py-1.5 shadow-lg"
      >
        <div className="mx-auto grid max-w-lg grid-cols-4 gap-1.5">
          <Link
            href="/"
            prefetch={true}
            className={`touch-manipulation flex min-h-[44px] flex-col items-center justify-center rounded-xl text-[11px] font-semibold ${
              isHome ? 'bg-slate-950 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Home className="w-4 h-4 mb-0.5" />
            <span>Home</span>
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
