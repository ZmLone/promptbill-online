'use client';

import React from 'react';
import Link from 'next/link';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="bg-[#f8fafc] text-slate-900 font-sans antialiased">
        <div className="mx-auto max-w-2xl px-4 py-16 text-center space-y-4">
          <h1 className="text-2xl font-bold text-slate-900">Something went wrong</h1>
          <p className="text-sm text-slate-600">
            {error?.message || 'An unexpected rendering error occurred on promptbill.online.'}
          </p>
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => reset()}
              className="rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800"
            >
              Try Again
            </button>
            <Link
              href="/"
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-50"
            >
              Back to Leaderboard
            </Link>
          </div>
        </div>
      </body>
    </html>
  );
}
