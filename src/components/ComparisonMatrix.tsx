'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { ArrowUpDown } from 'lucide-react';

export interface MatrixModel {
  id: string;
  slug?: string;
  name: string;
  provider?: string;
  score?: number;
  qualityScore?: number;
  valueScore?: number;
  inputPer1M: number;
  outputPer1M: number;
  cachedInputPer1M?: number;
  tokPerSec?: number;
  contextWindow?: string;
  elo?: number;
}

export interface MatrixInputs {
  inputTokensPerCall?: number;
  outputTokensPerCall?: number;
  callsPerDay?: number;
  cacheHitPct?: number;
  batchSharePct?: number;
  retryBufferPct?: number;
}

export interface Props {
  models: MatrixModel[];
  inputs?: MatrixInputs;
  selectedModelId?: string;
  onSelectModel?: (id: string) => void;
}

type SortKey = 'monthlyTotalCost' | 'qualityScore' | 'valueScore' | 'inputPer1M' | 'outputPer1M';

export const ComparisonMatrix: React.FC<Props> = ({
  models,
  inputs = {},
  selectedModelId,
  onSelectModel,
}) => {
  const [sortKey, setSortKey] = useState<SortKey>('monthlyTotalCost');
  const [sortAsc, setSortAsc] = useState<boolean>(true);

  const inputTok = inputs.inputTokensPerCall ?? 6500;
  const outputTok = inputs.outputTokensPerCall ?? 650;
  const callsPerDay = inputs.callsPerDay ?? 2500;
  const cacheHit = Math.min(0.95, Math.max(0, (inputs.cacheHitPct ?? 50) / 100));
  const batchMult = 1 - Math.min(1, Math.max(0, (inputs.batchSharePct ?? 0) / 100)) * 0.5;
  const retryMult = 1 + Math.max(0, inputs.retryBufferPct ?? 5) / 100;

  const computedRows = useMemo(() => {
    const monthlyCalls = Math.max(0, callsPerDay) * 30 * retryMult;
    return (models || []).map((m) => {
      const qScore = m.qualityScore ?? m.score ?? 75;
      const cachedRate = m.cachedInputPer1M ?? m.inputPer1M * 0.1;
      const blendedIn = ((1 - cacheHit) * m.inputPer1M + cacheHit * cachedRate) * batchMult;
      const blendedOut = m.outputPer1M * batchMult;
      const monthlyTotalCost =
        (monthlyCalls * inputTok * blendedIn) / 1_000_000 +
        (monthlyCalls * outputTok * blendedOut) / 1_000_000;
      const valueScore =
        m.valueScore ??
        (m.outputPer1M > 0 ? Number((qScore / m.outputPer1M).toFixed(1)) : Number(qScore.toFixed(1)));
      return { model: m, qualityScore: qScore, valueScore, monthlyTotalCost };
    });
  }, [models, inputTok, outputTok, callsPerDay, cacheHit, batchMult, retryMult]);

  const sortedRows = useMemo(() => {
    return [...computedRows].sort((a, b) => {
      let valA = 0;
      let valB = 0;
      if (sortKey === 'monthlyTotalCost') { valA = a.monthlyTotalCost; valB = b.monthlyTotalCost; }
      else if (sortKey === 'qualityScore') { valA = a.qualityScore; valB = b.qualityScore; }
      else if (sortKey === 'valueScore') { valA = a.valueScore; valB = b.valueScore; }
      else if (sortKey === 'inputPer1M') { valA = a.model.inputPer1M; valB = b.model.inputPer1M; }
      else if (sortKey === 'outputPer1M') { valA = a.model.outputPer1M; valB = b.model.outputPer1M; }
      return sortAsc ? valA - valB : valB - valA;
    });
  }, [computedRows, sortKey, sortAsc]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc(!sortAsc);
    else { setSortKey(key); setSortAsc(key === 'monthlyTotalCost' || key === 'inputPer1M' || key === 'outputPer1M'); }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 md:hidden">
        {sortedRows.map(({ model: m, qualityScore, valueScore, monthlyTotalCost }) => {
          const isSelected = selectedModelId === m.id;
          return (
            <div
              key={m.id}
              onClick={() => onSelectModel?.(m.id)}
              className={`rounded-xl border p-4 space-y-2 ${
                isSelected ? 'border-emerald-500 bg-emerald-50/40' : 'border-slate-200 bg-white'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="font-bold text-slate-900 text-sm">
                    {m.slug ? <Link href={`/models/${m.slug}`} className="hover:underline">{m.name}</Link> : m.name}
                  </div>
                  {m.provider && <div className="text-xs text-slate-500">{m.provider}</div>}
                </div>
                <div className="text-right font-mono">
                  <div className="text-sm font-bold text-emerald-700">${monthlyTotalCost.toFixed(2)}/mo</div>
                  <div className="text-[11px] text-slate-500">Score {qualityScore.toFixed(1)}</div>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 font-mono text-xs text-slate-700">
                <span>In ${m.inputPer1M.toFixed(2)}/1M</span>
                <span>Out ${m.outputPer1M.toFixed(2)}/1M</span>
                <span>Value {valueScore.toFixed(1)}</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="hidden md:block overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="w-full text-left border-collapse text-xs sm:text-sm">
          <caption className="sr-only">Model pricing and 30-day cost comparison matrix</caption>
          <thead>
            <tr className="border-b border-slate-200 bg-slate-100/90 text-xs font-semibold text-slate-700">
              <th scope="col" className="py-3 px-3.5">Model</th>
              <th scope="col" className="py-3 px-3"><button type="button" onClick={() => handleSort('qualityScore')} className="inline-flex items-center gap-1">Score <ArrowUpDown className="w-3.5 h-3.5" /></button></th>
              <th scope="col" className="py-3 px-3"><button type="button" onClick={() => handleSort('valueScore')} className="inline-flex items-center gap-1">Value <ArrowUpDown className="w-3.5 h-3.5" /></button></th>
              <th scope="col" className="py-3 px-3"><button type="button" onClick={() => handleSort('inputPer1M')} className="inline-flex items-center gap-1">Input / 1M <ArrowUpDown className="w-3.5 h-3.5" /></button></th>
              <th scope="col" className="py-3 px-3"><button type="button" onClick={() => handleSort('outputPer1M')} className="inline-flex items-center gap-1">Output / 1M <ArrowUpDown className="w-3.5 h-3.5" /></button></th>
              <th scope="col" className="py-3 px-3.5 text-right"><button type="button" onClick={() => handleSort('monthlyTotalCost')} className="inline-flex items-center gap-1 ml-auto">30-Day Est. <ArrowUpDown className="w-3.5 h-3.5" /></button></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200/80">
            {sortedRows.map(({ model: m, qualityScore, valueScore, monthlyTotalCost }, idx) => {
              const isSelected = selectedModelId === m.id;
              return (
                <tr key={m.id} onClick={() => onSelectModel?.(m.id)} className={`cursor-pointer ${isSelected ? 'bg-emerald-50/70' : idx % 2 === 0 ? 'bg-white hover:bg-slate-50' : 'bg-slate-50/50 hover:bg-slate-100/70'}`}>
                  <th scope="row" className="py-3 px-3.5 font-normal text-left">
                    <div className="font-semibold text-slate-900">
                      {m.slug ? <Link href={`/models/${m.slug}`} className="hover:text-emerald-700 hover:underline">{m.name}</Link> : m.name}
                    </div>
                    {m.provider && <div className="text-xs text-slate-500">{m.provider}</div>}
                  </th>
                  <td className="py-3 px-3 font-mono font-semibold text-slate-900">{qualityScore.toFixed(1)}</td>
                  <td className="py-3 px-3 font-mono text-slate-800">{valueScore.toFixed(1)}</td>
                  <td className="py-3 px-3 font-mono text-slate-800">${m.inputPer1M.toFixed(2)}</td>
                  <td className="py-3 px-3 font-mono text-slate-800">${m.outputPer1M.toFixed(2)}</td>
                  <td className="py-3 px-3.5 text-right font-mono font-bold text-emerald-700">${monthlyTotalCost.toFixed(2)}/mo</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ComparisonMatrix;
