'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const FOOTER_SECTIONS = [
  {
    title: 'Catalog & Pricing',
    links: [
      { href: '/models', label: 'Models' },
      { href: '/leaderboard', label: 'Leaderboard' },
      { href: '/compare', label: 'Compare' },
      { href: '/pricing', label: 'API Pricing' },
      { href: '/news', label: 'News' },
    ],
  },
  {
    title: 'Cost Tools',
    links: [
      { href: '/tools/llm-selector', label: 'LLM Selector' },
      { href: '/tools/token-counter', label: 'Token Counter' },
      { href: '/tools/routing-simulator', label: 'Routing Simulator' },
    ],
  },
  {
    title: 'Best-Of Guides',
    links: [
      { href: '/best-llms-for-coding', label: 'Best for Coding' },
      { href: '/best-open-weight-llms', label: 'Best Open-Weight' },
      { href: '/cheapest-llms-for-classification', label: 'Cheapest Classification' },
      { href: '/fastest-llms-tokens-per-second', label: 'Fastest (tok/s)' },
    ],
  },
  {
    title: 'Company & Verification',
    links: [
      { href: '/methodology', label: 'Methodology' },
      { href: '/about', label: 'About' },
      { href: '/advertise', label: 'Advertise' },
      { href: '/contact', label: 'Contact' },
      { href: '/privacy-policy', label: 'Privacy Policy' },
    ],
  },
];

export function SiteFooter() {
  const pathname = usePathname();

  if (pathname?.startsWith('/admin')) {
    return null;
  }

  return (
    <footer className="border-t border-slate-200 bg-slate-50/70 text-slate-600 mt-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-10 sm:py-12 space-y-8">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-8">
          {FOOTER_SECTIONS.map((section) => (
            <div key={section.title} className="space-y-2.5">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                {section.title}
              </h2>
              <ul className="space-y-1">
                {section.links.map((item) => {
                  const isActive =
                    pathname === item.href ||
                    (item.href !== '/' && pathname?.startsWith(`${item.href}/`));
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className={`inline-flex min-h-[36px] items-center text-sm transition-colors ${
                          isActive
                            ? 'font-semibold text-slate-950'
                            : 'text-slate-600 hover:text-slate-950'
                        }`}
                      >
                        {item.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-slate-200 pt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-slate-500">
          <div className="space-y-0.5">
            <p className="font-semibold text-slate-900">
              PromptBill · LLM API Pricing, Token Cost Calculator &amp; Benchmark Catalog
            </p>
            <p>
              Normalized USD per 1M token pricing across Official APIs, Inference Clouds, and
              Routers.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-4 font-medium">
            <Link href="/news" className="text-slate-700 hover:text-slate-950 hover:underline">
              News
            </Link>
            <Link href="/sitemap.xml" className="text-slate-700 hover:text-slate-950 hover:underline">
              Sitemap
            </Link>
            <Link href="/llms.txt" className="text-slate-700 hover:text-slate-950 hover:underline">
              llms.txt
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
