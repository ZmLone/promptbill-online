'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Megaphone, Menu, X } from 'lucide-react';

interface SiteShellProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

const PRIMARY_NAV = [
  { label: 'Home', href: '/' },
  { label: 'Leaderboard', href: '/leaderboard' },
  { label: 'Compare', href: '/compare' },
  { label: 'API Pricing', href: '/pricing' },
  { label: 'LLM Selector', href: '/selector' },
  { label: 'Best for Coding', href: '/coding' },
  { label: 'Token Counter', href: '/counter' },
  { label: 'Routing', href: '/routing' },
  { label: 'All Models', href: '/models' },
];

const MORE_NAV = [
  { label: 'About', href: '/about' },
  { label: 'Enquiry', href: '/enquiry' },
  { label: 'Contact', href: '/contact' },
  { label: 'Privacy Policy', href: '/privacy-policy' },
];

export function SiteShell({ title, subtitle, children }: SiteShellProps) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-[#f8fafc] text-slate-900">
      {/* Top Header Bar */}
      <header className="sticky top-0 z-30 border-b border-slate-200/90 bg-white/95 backdrop-blur-xs">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
          {/* Brand Mark */}
          <Link href="/" className="flex items-center gap-2.5 shrink-0">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-slate-900 text-xs font-extrabold text-white tracking-tight">
              PB
            </span>
            <span className="flex flex-col leading-tight">
              <span className="text-sm font-bold text-slate-900">PromptBill</span>
              <span className="text-[11px] text-slate-500">promptbill.online</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav
            aria-label="Primary navigation"
            className="hidden xl:flex items-center gap-1 text-xs font-medium text-slate-600"
          >
            {PRIMARY_NAV.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-2.5 py-1.5 rounded-md whitespace-nowrap transition-colors ${
                    active
                      ? 'bg-slate-100 text-slate-950 font-semibold'
                      : 'hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Right Actions: Share button removed; "Deals" replaced with professional "Advertise" CTA */}
          <div className="flex items-center gap-2 shrink-0">
            <Link
              href="/advertise"
              className={`inline-flex min-h-[38px] items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs sm:text-sm font-semibold whitespace-nowrap transition-colors ${
                pathname === '/advertise'
                  ? 'bg-emerald-700 text-white shadow-2xs'
                  : 'bg-[#0f766e] hover:bg-[#115e59] text-white shadow-2xs'
              }`}
            >
              <Megaphone className="w-3.5 h-3.5 text-emerald-200 shrink-0" aria-hidden="true" />
              <span>Advertise</span>
            </Link>

            <button
              type="button"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              aria-expanded={mobileMenuOpen}
              aria-label="Toggle navigation menu"
              className="xl:hidden inline-flex min-h-[38px] min-w-[38px] items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 cursor-pointer"
            >
              {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Mobile / Tablet Drawer */}
        {mobileMenuOpen ? (
          <div className="xl:hidden border-t border-slate-200 bg-white px-4 py-3 space-y-3">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 text-xs font-medium">
              {[...PRIMARY_NAV, ...MORE_NAV].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`rounded-lg px-3 py-2 transition-colors ${
                    pathname === item.href
                      ? 'bg-emerald-50 text-emerald-900 font-semibold'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        ) : null}
      </header>

      {/* Page Title & Breadcrumb Banner */}
      <div className="border-b border-slate-200/80 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
          {subtitle ? (
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
              {subtitle}
            </p>
          ) : null}
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            {title}
          </h1>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white mt-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>PromptBill (promptbill.online) — LLM API pricing, token cost &amp; benchmark tools.</p>
          <div className="flex flex-wrap items-center gap-4 font-medium text-slate-600">
            <Link href="/about" className="hover:text-slate-900">
              About
            </Link>
            <Link href="/advertise" className="hover:text-slate-900">
              Advertise
            </Link>
            <Link href="/enquiry" className="hover:text-slate-900">
              Enquiry
            </Link>
            <Link href="/contact" className="hover:text-slate-900">
              Contact
            </Link>
            <Link href="/privacy-policy" className="hover:text-slate-900">
              Privacy Policy
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
