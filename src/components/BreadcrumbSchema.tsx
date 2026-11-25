import React from 'react';
import Link from 'next/link';

export interface BreadcrumbCrumb {
  name: string;
  href: string;
}

const BASE_URL = 'https://promptbill.online';

export function BreadcrumbSchema({ items }: { items: BreadcrumbCrumb[] }) {
  const fullTrail: BreadcrumbCrumb[] = [{ name: 'Home', href: '/' }, ...items];

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: fullTrail.map((crumb, idx) => ({
      '@type': 'ListItem',
      position: idx + 1,
      name: crumb.name,
      item: `${BASE_URL}${crumb.href === '/' ? '' : crumb.href}`,
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <nav aria-label="Breadcrumb" className="text-xs text-slate-600 mb-2">
        <ol className="flex flex-wrap items-center gap-1.5">
          {fullTrail.map((crumb, idx) => {
            const isLast = idx === fullTrail.length - 1;
            return (
              <li key={crumb.href} className="inline-flex items-center gap-1.5">
                {idx > 0 ? <span className="text-slate-400">/</span> : null}
                {isLast ? (
                  <span className="font-semibold text-slate-900" aria-current="page">
                    {crumb.name}
                  </span>
                ) : (
                  <Link href={crumb.href} className="hover:text-emerald-800 hover:underline">
                    {crumb.name}
                  </Link>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
    </>
  );
}
