import React from 'react';
import Link from 'next/link';

export type PricingRouteKey =
  | 'llm-pricing'
  | 'cheapest-models'
  | 'image-models'
  | 'ai-subscriptions'
  | 'price-history';

const NAV_LINKS: Array<{ key: PricingRouteKey; label: string; href: string }> = [
  { key: 'llm-pricing', label: 'LLM Pricing', href: '/pricing' },
  { key: 'cheapest-models', label: 'Cheapest Models', href: '/pricing/cheapest-models' },
  { key: 'image-models', label: 'Image Models', href: '/pricing/image-models' },
  { key: 'ai-subscriptions', label: 'AI Subscriptions', href: '/pricing/ai-subscriptions' },
  { key: 'price-history', label: 'Price History', href: '/pricing/price-history' },
];

export function PricingSectionNav({ active }: { active: PricingRouteKey }) {
  return (
    <nav
      aria-label="Pricing sections"
      className="flex justify-center border-b border-slate-200 pb-3"
    >
      <div className="inline-flex flex-wrap items-center justify-center gap-2 sm:gap-4">
        {NAV_LINKS.map((item) => {
          const isCurrent = item.key === active;
          return (
            <Link
              key={item.key}
              href={item.href}
              aria-current={isCurrent ? 'page' : undefined}
              className={`h-9 inline-flex items-center px-3 text-sm transition-colors border-b-2 -mb-[13px] ${
                isCurrent
                  ? 'border-slate-950 font-semibold text-slate-950'
                  : 'border-transparent font-medium text-slate-600 hover:text-slate-950'
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
