'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Megaphone } from 'lucide-react';

interface TopNavActionsProps {
  className?: string;
}

/**
 * Clean top-right action bar for PromptBill:
 * - Share button intentionally removed
 * - Single crisp, professional Advertise CTA linking to /advertise
 */
export function AdvertiseNavButton({ className = '' }: TopNavActionsProps) {
  const pathname = usePathname();
  const isAdvertiseActive = pathname === '/advertise';

  return (
    <div className={`inline-flex items-center gap-2 shrink-0 ${className}`}>
      <Link
        href="/advertise"
        aria-current={isAdvertiseActive ? 'page' : undefined}
        className={`inline-flex min-h-[38px] items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs sm:text-sm font-semibold tracking-tight transition-all ${
          isAdvertiseActive
            ? 'bg-emerald-600 text-white ring-1 ring-emerald-500/30'
            : 'bg-slate-900 text-white hover:bg-slate-800 border border-slate-800/80 shadow-2xs'
        }`}
      >
        <Megaphone className="w-3.5 h-3.5 text-emerald-400 shrink-0" aria-hidden="true" />
        <span>Advertise</span>
      </Link>
    </div>
  );
}
