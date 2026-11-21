'use client';

import React from 'react';
import Link from 'next/link';

export default function PromptBillSuite() {
  return (
    <div className="p-8 text-center">
      <Link href="/" className="underline font-semibold text-slate-900">
        Go to PromptBill Leaderboard
      </Link>
    </div>
  );
}
