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
  Copy,
  Check,
  ExternalLink,
} from 'lucide-react';

const NAV_ITEMS: { href: string; label: string; icon: React.FC<{ className?: string }> }[] = [
  { href: '/', label: 'Leaderboard', icon: ArrowUpDown },
  { href: '/pricing', label: 'API Pricing', icon: Calculator },
  { href: '/best-llms-for-coding', label: 'Best for Coding', icon: Code2 },
  { href: '/tools/llm-selector', label: 'LLM Selector', icon: Sparkles },
  { href: '/tools/token-counter', label: 'Token Counter', icon: FileText },
  { href: '/tools/routing-simulator', label: 'Routing', icon: GitBranch },
  { href: '/deals', label: 'Deals', icon: Tag },
  { href: '/methodology', label: 'Methodology', icon: BookOpen },
  { href: '/advertise', label: 'Advertise', icon: Megaphone },
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
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (typeof window === 'undefined') return;
    navigator.clipboard?.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex flex-col">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2.5">
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
            {NAV_ITEMS.map((item) => {
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
          </nav>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copied' : 'Share'}
            </button>
            <Link
              href="/deals"
              className="rounded-lg bg-emerald-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
            >
              Deals
            </Link>
          </div>
        </div>

        <div className="flex xl:hidden overflow-x-auto border-t border-slate-100 px-4 py-2 gap-1.5 text-xs font-medium">
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`shrink-0 rounded-md px-2.5 py-1 ${
                  active ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl flex-1 space-y-6 px-4 py-8 sm:px-6 lg:px-8">
        <div className="border-b border-slate-200 pb-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">
            {subtitle}
          </p>
          <h1 className="mt-1 text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            {title}
          </h1>
        </div>
        {children}
      </main>

      <footer className="border-t border-slate-200 bg-white py-6 text-xs text-slate-600">
        <div className="mx-auto flex max-w-7xl flex-col sm:flex-row items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <div className="font-medium text-slate-700">
            PromptBill (<a href="https://promptbill.online" className="underline">https://promptbill.online</a>) · All rights reserved
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <Link href="/" className="hover:text-slate-900">Leaderboard</Link>
            <Link href="/pricing" className="hover:text-slate-900">API Pricing</Link>
            <Link href="/best-llms-for-coding" className="hover:text-slate-900">Best for Coding</Link>
            <Link href="/models/claude-fable-5-2" className="hover:text-slate-900">Claude Fable 5.2</Link>
            <Link href="/compare/claude-fable-5-2-vs-gemini-4-neon" className="hover:text-slate-900">Fable 5.2 vs Gemini 4 Neon</Link>
            <Link href="/providers/anthropic" className="hover:text-slate-900">Anthropic</Link>
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
