'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import Link from 'next/link';
import type { CatalogModel } from '../lib/catalog';
import {
  toModelHistoryRecords,
  type ModelHistoryRecord,
  type PriceMetricKey,
} from '../lib/openrouterHistory';

function fmtRate(val: number | null | undefined): string {
  if (typeof val !== 'number' || !Number.isFinite(val)) return 'N/A';
  if (val > 0 && val < 0.01) return `$${val.toFixed(4)}`;
  return `$${val.toFixed(2)}`;
}

function fmtShortDate(iso: string): string {
  const parts = iso.split('-');
  if (parts.length !== 3) return iso;
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const m = Number(parts[1]) - 1;
  const d = Number(parts[2]);
  if (m < 0 || m > 11 || !Number.isFinite(d)) return iso;
  return `${months[m]} ${d}`;
}

export function PriceHistoryClient({
  models,
  initialRecords,
}: {
  models: CatalogModel[];
  initialRecords?: ModelHistoryRecord[];
}) {
  const fallbackRecords = useMemo(
    () => initialRecords ?? toModelHistoryRecords({}, models),
    [initialRecords, models]
  );

  const [records, setRecords] = useState<ModelHistoryRecord[]>(fallbackRecords);
  const [selectedProvider, setSelectedProvider] = useState<string>('all');
  const [metric, setMetric] = useState<PriceMetricKey>('input');
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [filterText, setFilterText] = useState<string>('');
  const [onlyChanged, setOnlyChanged] = useState<boolean>(false);
  const [syncing, setSyncing] = useState<boolean>(false);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);

  const loadHistory = useCallback(() => {
    fetch('/api/pricing-history')
      .then((res) => (res.ok ? res.json() : null))
      .then((payload) => {
        if (!payload || !Array.isArray(payload.series)) return;
        setRecords(payload.series);
      })
      .catch(() => {
        // Keep current records
      });
  }, []);

  useEffect(() => {
    if (!initialRecords || initialRecords.length === 0) {
      loadHistory();
    }
  }, [initialRecords, loadHistory]);

  const handleManualSync = async () => {
    setSyncing(true);
    setSyncStatus(null);
    try {
      const res = await fetch('/api/cron/sync-openrouter-prices?source=ui');
      const data = await res.json();
      if (res.ok && data.ok) {
        setSyncStatus(
          `Synced ${data.trackedModels} OpenRouter models (${data.changesDetected} price changes recorded)`
        );
        loadHistory();
      } else {
        setSyncStatus(data.error || 'Sync failed');
      }
    } catch {
      setSyncStatus('Network error during OpenRouter sync');
    } finally {
      setSyncing(false);
    }
  };

  const providers = useMemo(() => {
    const names = new Set<string>();
    for (const r of records) {
      if (r.provider) names.add(r.provider);
    }
    return ['all', ...Array.from(names).sort((a, b) => a.localeCompare(b))];
  }, [records]);

  const computedSeries = useMemo(() => {
    return records
      .filter((r) => selectedProvider === 'all' || r.provider === selectedProvider)
      .map((r) => {
        const pts = r.points.map((pt) => ({
          date: pt.date,
          val: metric === 'input' ? pt.inputPer1M : pt.outputPer1M,
        }));
        const firstVal = pts[0]?.val ?? 0;
        const lastVal = pts[pts.length - 1]?.val ?? 0;
        const pctChange =
          firstVal > 0 ? ((lastVal - firstVal) / firstVal) * 100 : 0;

        const normalizedPts = pts.map((pt) => ({
          date: pt.date,
          val: pt.val,
          pctFromStart: firstVal > 0 ? ((pt.val - firstVal) / firstVal) * 100 : 0,
        }));

        return {
          ...r,
          metricStart: firstVal,
          metricCurrent: lastVal,
          metricPctChange: pctChange,
          normalizedPts,
        };
      });
  }, [records, selectedProvider, metric]);

  const totalDataPoints = useMemo(
    () => computedSeries.reduce((acc, s) => acc + s.normalizedPts.length, 0),
    [computedSeries]
  );

  const avgChange = useMemo(() => {
    if (computedSeries.length === 0) return 0;
    const sum = computedSeries.reduce((acc, s) => acc + s.metricPctChange, 0);
    return sum / computedSeries.length;
  }, [computedSeries]);

  const timelineDates = useMemo(() => {
    const set = new Set<string>();
    for (const s of computedSeries) {
      for (const pt of s.normalizedPts) {
        set.add(pt.date);
      }
    }
    const sorted = Array.from(set).sort((a, b) => a.localeCompare(b));
    return sorted.length > 0 ? sorted : ['2026-11-28'];
  }, [computedSeries]);

  const dateIndexMap = useMemo(() => {
    const map = new Map<string, number>();
    timelineDates.forEach((d, idx) => map.set(d, idx));
    return map;
  }, [timelineDates]);

  const { yMin, yMax, yTicks } = useMemo(() => {
    let minVal = 0;
    let maxVal = 0;
    for (const s of computedSeries) {
      for (const pt of s.normalizedPts) {
        if (pt.pctFromStart < minVal) minVal = pt.pctFromStart;
        if (pt.pctFromStart > maxVal) maxVal = pt.pctFromStart;
      }
    }
    const lower = minVal < 0 ? Math.max(-100, Math.floor(minVal / 20) * 20) : 0;
    const upper = maxVal > 0 ? Math.ceil(maxVal / 20) * 20 : lower === 0 ? 100 : 0;
    const finalUpper = upper === lower ? lower + 20 : upper;

    const steps = 5;
    const stepSize = (finalUpper - lower) / steps;
    const ticks: number[] = [];
    for (let i = 0; i <= steps; i++) {
      ticks.push(Math.round(lower + i * stepSize));
    }
    return { yMin: lower, yMax: finalUpper, yTicks: ticks };
  }, [computedSeries]);

  const width = 940;
  const height = 310;
  const padLeft = 60;
  const padRight = 24;
  const padTop = 24;
  const padBottom = 40;
  const plotW = width - padLeft - padRight;
  const plotH = height - padTop - padBottom;

  const getX = (dateStr: string) => {
    const idx = dateIndexMap.get(dateStr) ?? 0;
    if (timelineDates.length <= 1) return padLeft + plotW / 2;
    return padLeft + (idx / (timelineDates.length - 1)) * plotW;
  };

  const getY = (pct: number) => {
    const ratio = (pct - yMin) / (yMax - yMin || 1);
    return padTop + plotH - Math.max(0, Math.min(1, ratio)) * plotH;
  };

  const visibleAxisDates = useMemo(() => {
    if (timelineDates.length <= 7) return timelineDates;
    const result: string[] = [];
    const step = (timelineDates.length - 1) / 6;
    for (let i = 0; i < 7; i++) {
      result.push(timelineDates[Math.round(i * step)]);
    }
    return Array.from(new Set(result));
  }, [timelineDates]);

  const hoveredItem = useMemo(
    () => computedSeries.find((s) => s.id === hoveredId) ?? null,
    [computedSeries, hoveredId]
  );

  const tableRows = useMemo(() => {
    const q = filterText.trim().toLowerCase();
    return computedSeries
      .filter((s) => {
        if (onlyChanged && Math.abs(s.metricPctChange) < 0.05 && s.changeCount === 0) {
          return false;
        }
        if (!q) return true;
        return (
          s.name.toLowerCase().includes(q) ||
          s.provider.toLowerCase().includes(q) ||
          s.id.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => a.metricPctChange - b.metricPctChange);
  }, [computedSeries, filterText, onlyChanged]);

  const providerTitle = selectedProvider === 'all' ? 'All Providers' : selectedProvider;
  const metricTitle = metric === 'input' ? 'Input Price' : 'Output Price';

  const avgLabel = `${avgChange > 0 ? '+' : ''}${avgChange.toFixed(1)}%`;
  const avgColor =
    avgChange < -0.05
      ? 'text-emerald-600'
      : avgChange > 0.05
      ? 'text-rose-600'
      : 'text-slate-950';

  // Cap SVG line rendering to top 80 series when "All Providers" has 300+ OpenRouter models so DOM stays instant
  const chartSeries = useMemo(() => computedSeries.slice(0, 80), [computedSeries]);

  return (
    <div className="space-y-8">
      <section
        aria-label="OpenRouter & Provider Pricing History"
        className="border border-slate-200 rounded-xl bg-white p-5 sm:p-8"
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-100">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-950 tracking-tight">
              OpenRouter &amp; LLM Pricing History
            </h2>
            {syncStatus && (
              <p className="mt-1 text-xs text-emerald-700 font-medium">{syncStatus}</p>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <select
              aria-label="Select provider"
              value={selectedProvider}
              onChange={(e) => setSelectedProvider(e.target.value)}
              className="h-10 min-w-[165px] rounded-lg border-2 border-emerald-500 bg-white px-3 text-sm font-medium text-slate-900 focus:outline-none"
            >
              {providers.map((p) => (
                <option key={p} value={p}>
                  {p === 'all' ? 'All Providers' : p}
                </option>
              ))}
            </select>

            <select
              aria-label="Select price metric"
              value={metric}
              onChange={(e) => setMetric(e.target.value as PriceMetricKey)}
              className="h-10 min-w-[155px] rounded-lg border border-slate-300 bg-white px-3 text-sm font-medium text-slate-900 focus:border-slate-950 focus:outline-none"
            >
              <option value="input">Input Price</option>
              <option value="output">Output Price</option>
            </select>

            <button
              type="button"
              onClick={handleManualSync}
              disabled={syncing}
              className="h-10 rounded-lg border border-slate-300 bg-slate-50 hover:bg-slate-100 disabled:opacity-50 px-3.5 text-xs font-semibold text-slate-900 transition-colors cursor-pointer"
            >
              {syncing ? 'Syncing...' : 'Sync OpenRouter Now'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 py-7 text-center">
          <div>
            <div className="text-2xl sm:text-3xl font-bold text-slate-950 tabular-nums">
              {computedSeries.length}
            </div>
            <div className="mt-1 text-xs sm:text-sm text-slate-500">Models</div>
          </div>

          <div>
            <div className="text-2xl sm:text-3xl font-bold text-slate-950 tabular-nums">
              {totalDataPoints}
            </div>
            <div className="mt-1 text-xs sm:text-sm text-slate-500">Data Points</div>
          </div>

          <div>
            <div className={`text-2xl sm:text-3xl font-bold tabular-nums ${avgColor}`}>
              {avgLabel}
            </div>
            <div className="mt-1 text-xs sm:text-sm text-slate-500">Avg Change</div>
          </div>
        </div>

        <div className="text-center pb-3">
          <h3 className="text-sm sm:text-base font-semibold text-slate-900">
            {providerTitle} - {metricTitle} Changes Over Time
          </h3>
          <p className="mt-1 text-xs text-slate-500 min-h-[18px]">
            {hoveredItem
              ? `${hoveredItem.name} (${hoveredItem.provider}): ${fmtRate(
                  hoveredItem.metricStart
                )} → ${fmtRate(hoveredItem.metricCurrent)} / 1M (${
                  hoveredItem.metricPctChange > 0 ? '+' : ''
                }${hoveredItem.metricPctChange.toFixed(1)}%)`
              : 'Auto-synced daily from OpenRouter API · Hover any line or row to inspect rate shifts'}
          </p>
        </div>

        <div className="w-full overflow-x-auto">
          <svg
            viewBox={`0 0 ${width} ${height}`}
            role="img"
            aria-label={`${providerTitle} ${metricTitle} changes over time`}
            className="w-full min-w-[620px] h-auto select-none"
          >
            <text
              x={15}
              y={padTop + plotH / 2}
              transform={`rotate(-90 15 ${padTop + plotH / 2})`}
              textAnchor="middle"
              className="fill-slate-500 text-[11px]"
            >
              Price Change (%)
            </text>

            {yTicks.map((tick) => {
              const y = getY(tick);
              return (
                <g key={tick}>
                  <line
                    x1={padLeft}
                    y1={y}
                    x2={width - padRight}
                    y2={y}
                    stroke={tick === 0 ? '#cbd5e1' : '#e2e8f0'}
                    strokeWidth={tick === 0 ? 1.25 : 1}
                  />
                  <text
                    x={padLeft - 10}
                    y={y + 4}
                    textAnchor="end"
                    className="fill-slate-500 text-[11px] font-mono"
                  >
                    {tick}%
                  </text>
                </g>
              );
            })}

            {visibleAxisDates.map((d) => {
              const x = getX(d);
              return (
                <text
                  key={d}
                  x={x}
                  y={height - 10}
                  textAnchor="middle"
                  className="fill-slate-500 text-[11px]"
                >
                  {fmtShortDate(d)}
                </text>
              );
            })}

            {chartSeries.map((series, sIdx) => {
              if (series.normalizedPts.length === 0) return null;
              const isHovered = hoveredId === series.id;
              const isDimmed = hoveredId !== null && !isHovered;
              const microOffset =
                Math.abs(series.metricPctChange) < 0.05 ? ((sIdx % 5) - 2) * 0.6 : 0;

              const cmds: string[] = [];
              series.normalizedPts.forEach((pt, idx) => {
                const x = getX(pt.date);
                const y = getY(pt.pctFromStart) + microOffset;
                if (idx === 0) {
                  cmds.push(`M ${x.toFixed(1)} ${y.toFixed(1)}`);
                } else {
                  const prevY =
                    getY(series.normalizedPts[idx - 1].pctFromStart) + microOffset;
                  cmds.push(`L ${x.toFixed(1)} ${prevY.toFixed(1)}`);
                  cmds.push(`L ${x.toFixed(1)} ${y.toFixed(1)}`);
                }
              });

              return (
                <g
                  key={series.id}
                  onMouseEnter={() => setHoveredId(series.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  className="cursor-pointer"
                >
                  <path
                    d={cmds.join(' ')}
                    fill="none"
                    stroke={series.color}
                    strokeWidth={isHovered ? 3.5 : 2}
                    strokeOpacity={isDimmed ? 0.2 : 0.85}
                  />
                  {series.normalizedPts.map((pt) => {
                    const cx = getX(pt.date);
                    const cy = getY(pt.pctFromStart) + microOffset;
                    return (
                      <circle
                        key={`${series.id}-${pt.date}`}
                        cx={cx}
                        cy={cy}
                        r={isHovered ? 4.2 : 2.6}
                        fill={series.color}
                        fillOpacity={isDimmed ? 0.2 : 1}
                      />
                    );
                  })}
                </g>
              );
            })}
          </svg>
        </div>
      </section>

      <section aria-label="Tracked OpenRouter & Provider Models" className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <h2 className="text-base font-semibold text-slate-950">
              Tracked Models ({tableRows.length})
            </h2>
            <label className="inline-flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={onlyChanged}
                onChange={(e) => setOnlyChanged(e.target.checked)}
                className="accent-slate-950"
              />
              <span>Price changes only</span>
            </label>
          </div>

          <input
            type="search"
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            placeholder="Filter by model, ID, or provider..."
            aria-label="Filter by model, ID, or provider"
            className="h-9 w-full sm:w-72 border border-slate-300 bg-white px-3 text-sm text-slate-950 placeholder:text-slate-500 focus:border-slate-950 focus:outline-none"
          />
        </div>

        <div className="overflow-x-auto border border-slate-300 bg-white">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-300 bg-slate-100 text-xs font-semibold text-slate-800">
                <th scope="col" className="py-3 px-4">Model</th>
                <th scope="col" className="py-3 px-4">Provider</th>
                <th scope="col" className="py-3 px-4 text-right">Initial {metricTitle}</th>
                <th scope="col" className="py-3 px-4 text-right">Current {metricTitle}</th>
                <th scope="col" className="py-3 px-4 text-right">Change</th>
                <th scope="col" className="py-3 px-4 text-right">Points</th>
                <th scope="col" className="py-3 px-4 text-right">Last Checked</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 font-mono">
              {tableRows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 px-4 text-center font-sans text-sm text-slate-600">
                    No matching model history records found.
                  </td>
                </tr>
              ) : (
                tableRows.slice(0, 150).map((row, idx) => (
                  <tr
                    key={row.id}
                    onMouseEnter={() => setHoveredId(row.id)}
                    onMouseLeave={() => setHoveredId(null)}
                    className={`h-14 align-middle transition-colors ${
                      hoveredId === row.id
                        ? 'bg-emerald-50/50'
                        : idx % 2 === 0
                        ? 'bg-white'
                        : 'bg-slate-50/50'
                    }`}
                  >
                    <th scope="row" className="py-3 px-4 font-sans font-normal text-left">
                      <div className="flex items-center gap-2.5">
                        <span
                          aria-hidden="true"
                          className="inline-block h-2.5 w-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: row.color }}
                        />
                        <div>
                          <Link
                            href="/pricing"
                            className="font-semibold text-slate-950 hover:underline underline-offset-2"
                          >
                            {row.name}
                          </Link>
                          <div className="text-[11px] font-mono text-slate-500">{row.id}</div>
                        </div>
                      </div>
                    </th>
                    <td className="py-3 px-4 font-sans text-xs text-slate-700">{row.provider}</td>
                    <td className="py-3 px-4 text-right text-slate-700 tabular-nums">
                      {fmtRate(row.metricStart)}
                    </td>
                    <td className="py-3 px-4 text-right font-semibold text-slate-950 tabular-nums">
                      {fmtRate(row.metricCurrent)}
                    </td>
                    <td className="py-3 px-4 text-right text-xs tabular-nums">
                      <span
                        className={
                          row.metricPctChange < -0.05
                            ? 'font-semibold text-emerald-700'
                            : row.metricPctChange > 0.05
                            ? 'font-semibold text-rose-700'
                            : 'text-slate-600'
                        }
                      >
                        {`${row.metricPctChange > 0 ? '+' : ''}${row.metricPctChange.toFixed(1)}%`}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right text-xs text-slate-700 tabular-nums">
                      {row.normalizedPts.length}
                    </td>
                    <td className="py-3 px-4 text-right text-xs text-slate-800 tabular-nums">
                      {row.lastUpdated}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
