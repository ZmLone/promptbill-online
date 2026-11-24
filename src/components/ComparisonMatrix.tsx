'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { ArrowUpDown } from 'lucide-react';
import {
  calculateModelCost,
  formatCurrency,
  type LLMModel,
} from '../lib/pricingEngine';

export interface MatrixModel extends LLMModel {
  valueScore?: number | null;
}

export interface MatrixInputs {
  inputTokensPerCall?: number;
  outputTokensPerCall?: number;
  reasoningTokensPerCall?: number;
  callsPerDay?: number;
  cacheHitPct?: number;
  cacheWriteSharePct?: number;
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

function compareNullable(a: number | null, b: number | null, asc: boolean): number {
  if (a === null && b === null) return 0;
  if (a === null) return 1;
  if (b === null) return -1;
  return asc ? a - b : b - a;
}

export const ComparisonMatrix: React.FC<Props> = ({
  models,
  inputs = {},
  selectedModelId,
  onSelectModel,
}) => {
  const [sortKey, setSortKey] = useState<SortKey>('monthlyTotalCost');
  const [sortAsc, setSortAsc] = useState<boolean>(true);

  const computedRows = useMemo(() => {
    return (models || []).map((m) => {
      const calc = calculateModelCost(m, {
        inputTokensPerCall: inputs.inputTokensPerCall ?? 6500,
        outputTokensPerCall: inputs.outputTokensPerCall ?? 650,
        reasoningTokensPerCall: inputs.reasoningTokensPerCall ?? 0,
        callsPerDay: inputs.callsPerDay ?? 2500,
        cacheHitPercent: inputs.cacheHitPct ?? 0,
        cacheWriteSharePercent: inputs.cacheWriteSharePct ?? 0,
        batchPercent: inputs.batchSharePct ?? 0,
        retriesPercent: inputs.retryBufferPct ?? 0,
      });

      const scoreNum =
        typeof m.qualityScore === 'number' && Number.isFinite(m.qualityScore)
          ? m.qualityScore
          : typeof m.score === 'number' && Number.isFinite(m.score)
          ? m.score
          : null;

      const resolvedValue =
        typeof m.valueScore === 'number' && Number.isFinite(m.valueScore)
          ? m.valueScore
          : calc.valueScore;

      return {
        model: m,
        qualityScore: scoreNum,
        valueScore: resolvedValue,
        monthlyTotalCost: calc.hasPricingData ? calc.monthlyTotalCost : null,
      };
    });
  }, [models, inputs]);

  const sortedRows = useMemo(() => {
    return [...computedRows].sort((a, b) => {
      if (sortKey === 'monthlyTotalCost') {
        return compareNullable(a.monthlyTotalCost, b.monthlyTotalCost, sortAsc);
      }
      if (sortKey === 'qualityScore') {
        return compareNullable(a.qualityScore, b.qualityScore, sortAsc);
      }
      if (sortKey === 'valueScore') {
        return compareNullable(a.valueScore, b.valueScore, sortAsc);
      }
      if (sortKey === 'inputPer1M') {
        return compareNullable(a.model.inputPer1M, b.model.inputPer1M, sortAsc);
      }
      return compareNullable(a.model.outputPer1M, b.model.outputPer1M, sortAsc);
    });
  }, [computedRows, sortKey, sortAsc]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc(!sortAsc);
    else {
      setSortKey(key);
      setSortAsc(key === 'monthlyTotalCost' || key === 'inputPer1M' || key === 'outputPer1M');
    }
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
                isSelected ? 'border-emerald-600 bg-emerald-50/60' : 'border-slate-200 bg-white'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="font-bold text-slate-900 text-sm">
                    {m.slug ? (
                      <Link href={`/models/${m.slug}`} className="inline-flex min-h-[36px] items-center hover:underline">
                        {m.name}
                      </Link>
                    ) : (
                      m.name
                    )}
                  </div>
                  {m.provider && <div className="text-xs text-slate-700">{m.provider}</div>}
                </div>
                <div className="text-right font-mono">
                  <div className="text-sm font-bold text-emerald-800">
                    {monthlyTotalCost !== null ? `${formatCurrency(monthlyTotalCost)}/mo` : 'N/A'}
                  </div>
                  <div className="text-[11px] text-slate-700">
                    Score {qualityScore !== null ? qualityScore.toFixed(1) : 'N/A'}
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 font-mono text-xs text-slate-800">
                <span>In {m.inputPer1M !== null ? `$${m.inputPer1M.toFixed(2)}/1M` : 'N/A'}</span>
                <span>Out {m.outputPer1M !== null ? `$${m.outputPer1M.toFixed(2)}/1M` : 'N/A'}</span>
                <span>Value {valueScore !== null ? valueScore.toFixed(1) : 'N/A'}</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="hidden md:block overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="w-full text-left border-collapse text-xs sm:text-sm">
          <caption className="sr-only">Model pricing and 30-day cost comparison matrix</caption>
          <thead>
            <tr className="border-b border-slate-200 bg-slate-100/90 text-xs font-semibold text-slate-800">
              <th scope="col" className="py-3 px-3.5">Model</th>
              <th scope="col" className="py-3 px-3">
                <button type="button" onClick={() => handleSort('qualityScore')} className="inline-flex min-h-[36px] items-center gap-1 px-1.5">
                  Score <ArrowUpDown className="w-3.5 h-3.5" />
                </button>
              </th>
              <th scope="col" className="py-3 px-3">
                <button type="button" onClick={() => handleSort('valueScore')} className="inline-flex min-h-[36px] items-center gap-1 px-1.5">
                  Value <ArrowUpDown className="w-3.5 h-3.5" />
                </button>
              </th>
              <th scope="col" className="py-3 px-3">
                <button type="button" onClick={() => handleSort('inputPer1M')} className="inline-flex min-h-[36px] items-center gap-1 px-1.5">
                  Input / 1M <ArrowUpDown className="w-3.5 h-3.5" />
                </button>
              </th>
              <th scope="col" className="py-3 px-3">
                <button type="button" onClick={() => handleSort('outputPer1M')} className="inline-flex min-h-[36px] items-center gap-1 px-1.5">
                  Output / 1M <ArrowUpDown className="w-3.5 h-3.5" />
                </button>
              </th>
              <th scope="col" className="py-3 px-3.5 text-right">
                <button type="button" onClick={() => handleSort('monthlyTotalCost')} className="inline-flex min-h-[36px] items-center gap-1 ml-auto px-1.5">
                  30-Day Est. <ArrowUpDown className="w-3.5 h-3.5" />
                </button>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200/80">
            {sortedRows.map(({ model: m, qualityScore, valueScore, monthlyTotalCost }, idx) => {
              const isSelected = selectedModelId === m.id;
              return (
                <tr
                  key={m.id}
                  onClick={() => onSelectModel?.(m.id)}
                  className={`cursor-pointer ${
                    isSelected
                      ? 'bg-emerald-50/70'
                      : idx % 2 === 0
                      ? 'bg-white hover:bg-slate-50'
                      : 'bg-slate-50/50 hover:bg-slate-100/70'
                  }`}
                >
                  <th scope="row" className="py-3 px-3.5 font-normal text-left">
                    <div className="font-semibold text-slate-900">
                      {m.slug ? (
                        <Link href={`/models/${m.slug}`} className="inline-flex min-h-[32px] items-center hover:text-emerald-800 hover:underline">
                          {m.name}
                        </Link>
                      ) : (
                        m.name
                      )}
                    </div>
                    {m.provider && <div className="text-xs text-slate-700">{m.provider}</div>}
                  </th>
                  <td className="py-3 px-3 font-mono font-semibold text-slate-900">
                    {qualityScore !== null ? qualityScore.toFixed(1) : 'N/A'}
                  </td>
                  <td className="py-3 px-3 font-mono text-slate-800">
                    {valueScore !== null ? valueScore.toFixed(1) : 'N/A'}
                  </td>
                  <td className="py-3 px-3 font-mono text-slate-800">
                    {m.inputPer1M !== null ? `$${m.inputPer1M.toFixed(2)}` : 'N/A'}
                  </td>
                  <td className="py-3 px-3 font-mono text-slate-800">
                    {m.outputPer1M !== null ? `$${m.outputPer1M.toFixed(2)}` : 'N/A'}
                  </td>
                  <td className="py-3 px-3.5 text-right font-mono font-bold text-emerald-800">
                    {monthlyTotalCost !== null ? `${formatCurrency(monthlyTotalCost)}/mo` : 'N/A'}
                  </td>
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
