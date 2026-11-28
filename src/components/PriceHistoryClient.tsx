'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import type { CatalogModel } from '../lib/catalog';
import {
  buildPriceHistoryEvents,
  type PriceEventType,
} from '../lib/priceHistoryData';

type ViewMode = 'events' | 'audit';
type EventFilter = 'all' | PriceEventType;
type SortOption = 'date-desc' | 'blended-asc' | 'blended-desc' | 'provider';

function fmtRate(val: number | null | undefined): string {
  if (typeof val !== 'number' || !Number.isFinite(val)) return 'N/A';
  if (val > 0 && val < 0.01) return `$${val.toFixed(4)}`;
  return `$${val.toFixed(2)}`;
}

function fmtDelta(pct: number | null): string {
  if (typeof pct !== 'number' || !Number.isFinite(pct)) return 'Baseline';
  const sign = pct > 0 ? '+' : '';
  return `${sign}${pct.toFixed(1)}%`;
}

export function PriceHistoryClient({ models }: { models: CatalogModel[] }) {
  const [viewMode, setViewMode] = useState<ViewMode>('events');
  const [query, setQuery] = useState<string>('');
  const [provider, setProvider] = useState<string>('all');
  const [eventFilter, setEventFilter] = useState<EventFilter>('all');
  const [sortBy, setSortBy] = useState<SortOption>('date-desc');

  const allEvents = useMemo(() => buildPriceHistoryEvents(models), [models]);

  const providers = useMemo(() => {
    const unique = new Set<string>();
    for (const m of models) {
      if (m.provider) unique.add(m.provider);
    }
    return ['all', ...Array.from(unique).sort((a, b) => a.localeCompare(b))];
  }, [models]);

  const filteredEvents = useMemo(() => {
    const q = query.trim().toLowerCase();
    return allEvents
      .filter((ev) => {
        if (provider !== 'all' && ev.provider !== provider) return false;
        if (eventFilter !== 'all' && ev.eventType !== eventFilter) return false;
        if (!q) return true;
        return (
          ev.modelName.toLowerCase().includes(q) ||
          ev.provider.toLowerCase().includes(q) ||
          ev.note.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => {
        if (sortBy === 'provider') {
          const p = a.provider.localeCompare(b.provider);
          return p !== 0 ? p : a.modelName.localeCompare(b.modelName);
        }
        if (sortBy === 'blended-asc' || sortBy === 'blended-desc') {
          const bA =
            a.currentInputPer1M !== null && a.currentOutputPer1M !== null
              ? a.currentInputPer1M * 0.8 + a.currentOutputPer1M * 0.2
              : Number.POSITIVE_INFINITY;
          const bB =
            b.currentInputPer1M !== null && b.currentOutputPer1M !== null
              ? b.currentInputPer1M * 0.8 + b.currentOutputPer1M * 0.2
              : Number.POSITIVE_INFINITY;
          return sortBy === 'blended-asc' ? bA - bB : bB - bA;
        }
        return b.date.localeCompare(a.date);
      });
  }, [allEvents, provider, eventFilter, query, sortBy]);

  const auditRows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return models
      .filter((m) => {
        if (provider !== 'all' && m.provider !== provider) return false;
        if (!q) return true;
        return (
          m.name.toLowerCase().includes(q) ||
          m.provider.toLowerCase().includes(q) ||
          m.slug.toLowerCase().includes(q)
        );
      })
      .map((m) => {
        const inRate =
          typeof m.inputPer1M === 'number' && Number.isFinite(m.inputPer1M)
            ? m.inputPer1M
            : null;
        const cachedRate =
          typeof m.cachedInputPer1M === 'number' && Number.isFinite(m.cachedInputPer1M)
            ? m.cachedInputPer1M
            : null;
        const outRate =
          typeof m.outputPer1M === 'number' && Number.isFinite(m.outputPer1M)
            ? m.outputPer1M
            : null;
        const blended =
          inRate !== null && outRate !== null ? inRate * 0.8 + outRate * 0.2 : null;
        const verifiedDate = m.pricingProvenance?.lastVerified
          ? m.pricingProvenance.lastVerified.slice(0, 10)
          : 'N/A';
        const status = m.pricingProvenance?.status ?? 'Estimated';
        const endpointsCount = Array.isArray(m.hostingEndpoints)
          ? m.hostingEndpoints.length
          : 1;

        return {
          model: m,
          inRate,
          cachedRate,
          outRate,
          blended,
          verifiedDate,
          status,
          sourceUrl: m.pricingProvenance?.sourceUrl ?? null,
          endpointsCount,
        };
      })
      .sort((a, b) => {
        if (sortBy === 'provider') {
          const p = a.model.provider.localeCompare(b.model.provider);
          return p !== 0 ? p : a.model.name.localeCompare(b.model.name);
        }
        if (sortBy === 'blended-asc') {
          return (a.blended ?? Number.POSITIVE_INFINITY) - (b.blended ?? Number.POSITIVE_INFINITY);
        }
        if (sortBy === 'blended-desc') {
          return (b.blended ?? -1) - (a.blended ?? -1);
        }
        return b.verifiedDate.localeCompare(a.verifiedDate);
      });
  }, [models, provider, query, sortBy]);

  const badgeText = (type: PriceEventType) => {
    if (type === 'price-cut') return 'Price Cut';
    if (type === 'launch-snapshot') return 'Launch Snapshot';
    return 'Rate Audit';
  };

  const badgeTone = (type: PriceEventType) => {
    if (type === 'price-cut') return 'text-emerald-800 bg-emerald-50 border-emerald-200';
    if (type === 'launch-snapshot') return 'text-sky-900 bg-sky-50 border-sky-200';
    return 'text-slate-700 bg-slate-100 border-slate-200';
  };

  return (
    <div className="space-y-6">
      {/* Mode Switcher + Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-200 pb-4">
        <div className="inline-flex items-center gap-1">
          <button
            type="button"
            onClick={() => setViewMode('events')}
            className={`h-9 px-4 text-xs font-semibold transition-colors cursor-pointer border ${
              viewMode === 'events'
                ? 'border-slate-950 bg-slate-950 text-white'
                : 'border-slate-300 bg-white text-slate-800 hover:bg-slate-50'
            }`}
          >
            Chronological Timeline ({filteredEvents.length})
          </button>
          <button
            type="button"
            onClick={() => setViewMode('audit')}
            className={`h-9 px-4 text-xs font-semibold transition-colors cursor-pointer border ${
              viewMode === 'audit'
                ? 'border-slate-950 bg-slate-950 text-white'
                : 'border-slate-300 bg-white text-slate-800 hover:bg-slate-50'
            }`}
          >
            Full Rate Audit Table ({auditRows.length})
          </button>
        </div>

        <span className="text-xs text-slate-600 tabular-nums">
          Blended reference = 80% input + 20% output per 1M tokens
        </span>
      </div>

      {/* Uniform Filter Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-center">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search model, provider, or note..."
          aria-label="Search model, provider, or note"
          className="lg:col-span-2 h-10 w-full border border-slate-300 bg-white px-3 text-sm text-slate-950 placeholder:text-slate-500 focus:border-slate-950 focus:outline-none"
        />

        <select
          aria-label="Filter by provider"
          value={provider}
          onChange={(e) => setProvider(e.target.value)}
          className="h-10 w-full border border-slate-300 bg-white px-3 text-sm text-slate-950 focus:border-slate-950 focus:outline-none"
        >
          {providers.map((p) => (
            <option key={p} value={p}>
              {p === 'all' ? 'All Providers' : p}
            </option>
          ))}
        </select>

        {viewMode === 'events' ? (
          <select
            aria-label="Filter by event type"
            value={eventFilter}
            onChange={(e) => setEventFilter(e.target.value as EventFilter)}
            className="h-10 w-full border border-slate-300 bg-white px-3 text-sm text-slate-950 focus:border-slate-950 focus:outline-none"
          >
            <option value="all">All Event Types</option>
            <option value="launch-snapshot">Launch Snapshots</option>
            <option value="verification-audit">Rate Audits</option>
            <option value="price-cut">Price Cuts</option>
          </select>
        ) : (
          <div className="h-10 flex items-center px-3 border border-slate-200 bg-slate-50 text-xs text-slate-700">
            Showing all {auditRows.length} catalog entries
          </div>
        )}

        <select
          aria-label="Sort records"
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as SortOption)}
          className="h-10 w-full border border-slate-300 bg-white px-3 text-sm text-slate-950 focus:border-slate-950 focus:outline-none"
        >
          <option value="date-desc">Sort: Newest Verified</option>
          <option value="blended-asc">Sort: Lowest Blended / 1M</option>
          <option value="blended-desc">Sort: Highest Blended / 1M</option>
          <option value="provider">Sort: Provider A–Z</option>
        </select>
      </div>

      {/* VIEW 1: CHRONOLOGICAL TIMELINE LEDGER */}
      {viewMode === 'events' && (
        <div className="overflow-x-auto border border-slate-300 bg-white">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-300 bg-slate-100 text-xs font-semibold text-slate-800">
                <th scope="col" className="py-3 px-4">Date</th>
                <th scope="col" className="py-3 px-4">Model</th>
                <th scope="col" className="py-3 px-4">Event</th>
                <th scope="col" className="py-3 px-4 text-right">Input / 1M</th>
                <th scope="col" className="py-3 px-4 text-right">Output / 1M</th>
                <th scope="col" className="py-3 px-4 text-right">Change</th>
                <th scope="col" className="py-3 px-4 hidden lg:table-cell">Audit Note</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 font-mono">
              {filteredEvents.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 px-4 text-center font-sans text-sm text-slate-600">
                    No matching price history events found.
                  </td>
                </tr>
              ) : (
                filteredEvents.map((ev, idx) => (
                  <tr
                    key={ev.id}
                    className={`h-14 align-middle ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}
                  >
                    <td className="py-3 px-4 text-xs text-slate-800 whitespace-nowrap tabular-nums">
                      {ev.date}
                    </td>
                    <th scope="row" className="py-3 px-4 font-sans font-normal text-left">
                      <Link
                        href={`/models/${ev.modelSlug}`}
                        className="font-semibold text-slate-950 hover:underline underline-offset-2"
                      >
                        {ev.modelName}
                      </Link>
                      <div className="text-xs text-slate-600">{ev.provider}</div>
                    </th>
                    <td className="py-3 px-4 font-sans text-xs whitespace-nowrap">
                      <span
                        className={`inline-block border px-2 py-0.5 text-[11px] font-medium ${badgeTone(
                          ev.eventType
                        )}`}
                      >
                        {badgeText(ev.eventType)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right text-slate-950 tabular-nums whitespace-nowrap">
                      {ev.previousInputPer1M !== null ? (
                        <span>
                          <span className="text-slate-400 line-through mr-1.5">
                            {fmtRate(ev.previousInputPer1M)}
                          </span>
                          {fmtRate(ev.currentInputPer1M)}
                        </span>
                      ) : (
                        fmtRate(ev.currentInputPer1M)
                      )}
                    </td>
                    <td className="py-3 px-4 text-right text-slate-950 tabular-nums whitespace-nowrap">
                      {ev.previousOutputPer1M !== null ? (
                        <span>
                          <span className="text-slate-400 line-through mr-1.5">
                            {fmtRate(ev.previousOutputPer1M)}
                          </span>
                          {fmtRate(ev.currentOutputPer1M)}
                        </span>
                      ) : (
                        fmtRate(ev.currentOutputPer1M)
                      )}
                    </td>
                    <td className="py-3 px-4 text-right font-sans text-xs whitespace-nowrap">
                      <span
                        className={
                          ev.blendedDeltaPct !== null && ev.blendedDeltaPct < 0
                            ? 'font-semibold text-emerald-800'
                            : 'text-slate-600'
                        }
                      >
                        {fmtDelta(ev.blendedDeltaPct)}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-sans text-xs text-slate-700 hidden lg:table-cell max-w-xs">
                      {ev.note}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* VIEW 2: COMPLETE CATALOG AUDIT LEDGER */}
      {viewMode === 'audit' && (
        <div className="overflow-x-auto border border-slate-300 bg-white">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-300 bg-slate-100 text-xs font-semibold text-slate-800">
                <th scope="col" className="py-3 px-4">Model</th>
                <th scope="col" className="py-3 px-4">Verified Date</th>
                <th scope="col" className="py-3 px-4">Provenance</th>
                <th scope="col" className="py-3 px-4 text-right">Input / 1M</th>
                <th scope="col" className="py-3 px-4 hidden sm:table-cell text-right">Cached / 1M</th>
                <th scope="col" className="py-3 px-4 text-right">Output / 1M</th>
                <th scope="col" className="py-3 px-4 hidden md:table-cell text-right">Blended / 1M</th>
                <th scope="col" className="py-3 px-4 text-right">Endpoints</th>
                <th scope="col" className="py-3 px-4 text-right">Simulate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 font-mono">
              {auditRows.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-10 px-4 text-center font-sans text-sm text-slate-600">
                    No matching catalog records found.
                  </td>
                </tr>
              ) : (
                auditRows.map(
                  (
                    {
                      model: m,
                      inRate,
                      cachedRate,
                      outRate,
                      blended,
                      verifiedDate,
                      status,
                      endpointsCount,
                    },
                    idx
                  ) => (
                    <tr
                      key={m.id}
                      className={`h-14 align-middle ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}
                    >
                      <th scope="row" className="py-3 px-4 font-sans font-normal text-left">
                        <Link
                          href={`/models/${m.slug}`}
                          className="font-semibold text-slate-950 hover:underline underline-offset-2"
                        >
                          {m.name}
                        </Link>
                        <div className="text-xs text-slate-600">{m.provider}</div>
                      </th>
                      <td className="py-3 px-4 text-xs text-slate-800 tabular-nums whitespace-nowrap">
                        {verifiedDate}
                      </td>
                      <td className="py-3 px-4 font-sans text-xs whitespace-nowrap">
                        <span
                          className={
                            status === 'Verified'
                              ? 'font-medium text-emerald-800'
                              : 'font-medium text-amber-800'
                          }
                        >
                          {status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right text-slate-950 tabular-nums">
                        {fmtRate(inRate)}
                      </td>
                      <td className="py-3 px-4 text-right text-emerald-800 hidden sm:table-cell tabular-nums">
                        {fmtRate(cachedRate)}
                      </td>
                      <td className="py-3 px-4 text-right text-slate-950 tabular-nums">
                        {fmtRate(outRate)}
                      </td>
                      <td className="py-3 px-4 text-right font-semibold text-slate-950 hidden md:table-cell tabular-nums">
                        {fmtRate(blended)}
                      </td>
                      <td className="py-3 px-4 text-right text-slate-800 tabular-nums">
                        {endpointsCount}
                      </td>
                      <td className="py-3 px-4 text-right font-sans text-xs whitespace-nowrap">
                        <Link
                          href={`/?model=${encodeURIComponent(m.slug)}#estimator`}
                          className="font-medium text-slate-900 underline underline-offset-2 hover:text-emerald-800"
                        >
                          Calc
                        </Link>
                      </td>
                    </tr>
                  )
                )
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
