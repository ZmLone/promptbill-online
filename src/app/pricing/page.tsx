'use client';

import React, { useState, useMemo } from 'react';
import { ALL_MODELS } from '../../lib/catalog';
import { SiteShell } from '../../components/SiteShell';

export default function PricingPage() {
  const [inputTokensPerCall, setInputTokensPerCall] = useState(6500);
  const [outputTokensPerCall, setOutputTokensPerCall] = useState(650);
  const [callsPerDay, setCallsPerDay] = useState(2500);
  const [cacheHitPct, setCacheHitPct] = useState(50);
  const [batchSharePct, setBatchSharePct] = useState(0);
  const [retryBufferPct, setRetryBufferPct] = useState(5);
  const [payingUsers, setPayingUsers] = useState(2500);
  const [pricePerUser, setPricePerUser] = useState(19);

  const monthlyRevenue = payingUsers * pricePerUser;

  const rows = useMemo(() => {
    const baseMonthlyCalls = Math.max(0, callsPerDay) * 30;
    const effectiveCalls = baseMonthlyCalls * (1 + Math.max(0, retryBufferPct) / 100);
    const cacheFrac = Math.min(0.95, Math.max(0, cacheHitPct / 100));
    const batchMult = 1 - Math.min(1, Math.max(0, batchSharePct / 100)) * 0.5;

    return [...ALL_MODELS]
      .map((m) => {
        const blendedIn = ((1 - cacheFrac) * m.inputPer1M + cacheFrac * m.cachedInputPer1M) * batchMult;
        const blendedOut = m.outputPer1M * batchMult;
        const monthlyCost =
          (effectiveCalls * inputTokensPerCall * blendedIn) / 1_000_000 +
          (effectiveCalls * outputTokensPerCall * blendedOut) / 1_000_000;
        const grossMarginPct =
          monthlyRevenue > 0 ? Math.max(0, ((monthlyRevenue - monthlyCost) / monthlyRevenue) * 100) : 0;
        return { model: m, monthlyCost, grossMarginPct };
      })
      .sort((a, b) => a.monthlyCost - b.monthlyCost);
  }, [inputTokensPerCall, outputTokensPerCall, callsPerDay, cacheHitPct, batchSharePct, retryBufferPct, monthlyRevenue]);

  return (
    <SiteShell
      title="API Pricing, Retry Buffer & SaaS Margin Calculator"
      subtitle="promptbill.online/pricing · Blended Spend & Unit Economics"
    >
      <section className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6 space-y-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 text-xs border-b border-slate-100 pb-5">
          <label className="space-y-1">
            <span className="text-slate-600 font-medium">Input tok/call</span>
            <input type="number" min={0} value={inputTokensPerCall} onChange={(e) => setInputTokensPerCall(Math.max(0, Number(e.target.value)))} className="w-full rounded-lg border border-slate-300 px-2.5 py-2 font-mono text-slate-900" />
          </label>
          <label className="space-y-1">
            <span className="text-slate-600 font-medium">Output tok/call</span>
            <input type="number" min={0} value={outputTokensPerCall} onChange={(e) => setOutputTokensPerCall(Math.max(0, Number(e.target.value)))} className="w-full rounded-lg border border-slate-300 px-2.5 py-2 font-mono text-slate-900" />
          </label>
          <label className="space-y-1">
            <span className="text-slate-600 font-medium">Calls / day</span>
            <input type="number" min={0} value={callsPerDay} onChange={(e) => setCallsPerDay(Math.max(0, Number(e.target.value)))} className="w-full rounded-lg border border-slate-300 px-2.5 py-2 font-mono text-slate-900" />
          </label>
          <label className="space-y-1">
            <span className="text-slate-600 font-medium">Cache hit %</span>
            <input type="number" min={0} max={95} value={cacheHitPct} onChange={(e) => setCacheHitPct(Math.min(95, Math.max(0, Number(e.target.value))))} className="w-full rounded-lg border border-slate-300 px-2.5 py-2 font-mono text-slate-900" />
          </label>
          <label className="space-y-1">
            <span className="text-slate-600 font-medium">Batch % (50% off)</span>
            <input type="number" min={0} max={100} value={batchSharePct} onChange={(e) => setBatchSharePct(Math.min(100, Math.max(0, Number(e.target.value))))} className="w-full rounded-lg border border-slate-300 px-2.5 py-2 font-mono text-slate-900" />
          </label>
          <label className="space-y-1">
            <span className="text-slate-600 font-medium">Retry %</span>
            <input type="number" min={0} max={40} value={retryBufferPct} onChange={(e) => setRetryBufferPct(Math.min(40, Math.max(0, Number(e.target.value))))} className="w-full rounded-lg border border-slate-300 px-2.5 py-2 font-mono text-slate-900" />
          </label>
          <label className="space-y-1">
            <span className="text-slate-600 font-medium">Paid users</span>
            <input type="number" min={1} value={payingUsers} onChange={(e) => setPayingUsers(Math.max(1, Number(e.target.value)))} className="w-full rounded-lg border border-slate-300 px-2.5 py-2 font-mono text-slate-900" />
          </label>
          <label className="space-y-1">
            <span className="text-slate-600 font-medium">$/user/mo</span>
            <input type="number" min={1} value={pricePerUser} onChange={(e) => setPricePerUser(Math.max(1, Number(e.target.value)))} className="w-full rounded-lg border border-slate-300 px-2.5 py-2 font-mono text-slate-900" />
          </label>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[740px]">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-600">
                <th className="py-2.5 px-3">Model</th>
                <th className="py-2.5 px-3">Input / Cached / Output ($/1M)</th>
                <th className="py-2.5 px-3">Score</th>
                <th className="py-2.5 px-3">Est. SaaS Margin</th>
                <th className="py-2.5 px-3 text-right">Est. 30-Day Spend</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {rows.map(({ model, monthlyCost, grossMarginPct }) => (
                <tr key={model.id} className="hover:bg-slate-50">
                  <td className="py-3 px-3">
                    <div className="font-semibold text-slate-900">{model.name}</div>
                    <div className="text-xs text-slate-500">{model.provider}</div>
                  </td>
                  <td className="py-3 px-3 font-mono text-xs text-slate-700">
                    ${model.inputPer1M.toFixed(2)} / ${model.cachedInputPer1M.toFixed(2)} / ${model.outputPer1M.toFixed(2)}
                  </td>
                  <td className="py-3 px-3 font-mono text-xs text-slate-700">{model.score.toFixed(1)}</td>
                  <td className="py-3 px-3 font-mono text-xs font-semibold text-slate-800">{grossMarginPct.toFixed(1)}%</td>
                  <td className="py-3 px-3 text-right font-mono font-bold text-emerald-700">
                    ${monthlyCost.toFixed(2)}/mo
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </SiteShell>
  );
}
