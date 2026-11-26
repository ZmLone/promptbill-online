'use client';

import React, { useMemo, useState } from 'react';
import {
  Search,
  CheckCircle2,
  Plus,
  Copy,
  Download,
  RotateCcw,
  Sliders,
} from 'lucide-react';

export interface EditableModelDraft {
  id: string;
  slug: string;
  name: string;
  provider: string;
  license: string;
  contextWindow: string;
  inputPer1M: number | null;
  cachedInputPer1M: number | null;
  outputPer1M: number | null;
  tokPerSec: number | null;
  score: number | null;
  status: 'Verified' | 'Estimated' | 'Pending Approval';
  bestFor: string;
  approved: boolean;
}

function toNumOrNull(raw: string): number | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const n = Number(trimmed);
  return Number.isFinite(n) ? n : null;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapInitialModels(models: any[]): EditableModelDraft[] {
  return models
    .filter((m) => !m?.archived)
    .map((m, idx) => {
      const provStatus = String(m?.pricingProvenance?.status || m?.evidence || '').toLowerCase();
      const status: EditableModelDraft['status'] =
        provStatus === 'verified' ? 'Verified' : 'Estimated';
      return {
        id: String(m?.id || m?.slug || `model-${idx}`),
        slug: String(m?.slug || `model-${idx}`),
        name: String(m?.name || 'Unnamed Model'),
        provider: String(m?.provider || 'Provider'),
        license: String(m?.license || 'Closed'),
        contextWindow: String(m?.contextWindow || '128K'),
        inputPer1M: typeof m?.inputPer1M === 'number' ? m.inputPer1M : null,
        cachedInputPer1M: typeof m?.cachedInputPer1M === 'number' ? m.cachedInputPer1M : null,
        outputPer1M: typeof m?.outputPer1M === 'number' ? m.outputPer1M : null,
        tokPerSec: typeof m?.tokPerSec === 'number' ? m.tokPerSec : null,
        score: typeof m?.score === 'number' ? m.score : null,
        status,
        bestFor: String(m?.bestFor || m?.notes || ''),
        approved: false,
      };
    });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function RegistryApprovalDashboard({ initialModels }: { initialModels: any[] }) {
  const baseline = useMemo(() => mapInitialModels(initialModels), [initialModels]);
  const [items, setItems] = useState<EditableModelDraft[]>(baseline);
  const [query, setQuery] = useState('');
  const [onlyModifiedOrApproved, setOnlyModifiedOrApproved] = useState(false);
  const [selectedSlug, setSelectedSlug] = useState<string>(baseline[0]?.slug || '');
  const [exportOpen, setExportOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  // New model quick-add form state
  const [newName, setNewName] = useState('');
  const [newProvider, setNewProvider] = useState('OpenAI');
  const [newInput, setNewInput] = useState('');
  const [newOutput, setNewOutput] = useState('');
  const [newScore, setNewScore] = useState('');
  const [newContext, setNewContext] = useState('128K');
  const [newSpeed, setNewSpeed] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((item) => {
      if (onlyModifiedOrApproved && !item.approved && item.status !== 'Pending Approval') {
        return false;
      }
      if (!q) return true;
      return `${item.name} ${item.provider} ${item.slug} ${item.bestFor}`.toLowerCase().includes(q);
    });
  }, [items, query, onlyModifiedOrApproved]);

  const activeModel =
    items.find((m) => m.slug === selectedSlug) || filtered[0] || items[0] || null;

  const approvedItems = useMemo(() => items.filter((m) => m.approved), [items]);

  function updateModel(slug: string, patch: Partial<EditableModelDraft>) {
    setItems((prev) =>
      prev.map((m) => (m.slug === slug ? { ...m, ...patch } : m)),
    );
  }

  function handleAddModel(e: React.FormEvent) {
    e.preventDefault();
    const cleanName = newName.trim();
    if (!cleanName) return;

    const baseSlug = cleanName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    const uniqueSlug = items.some((m) => m.slug === baseSlug)
      ? `${baseSlug}-${items.length + 1}`
      : baseSlug;

    const created: EditableModelDraft = {
      id: uniqueSlug,
      slug: uniqueSlug,
      name: cleanName,
      provider: newProvider.trim() || 'Custom',
      license: 'Closed',
      contextWindow: newContext.trim() || '128K',
      inputPer1M: toNumOrNull(newInput),
      cachedInputPer1M: null,
      outputPer1M: toNumOrNull(newOutput),
      tokPerSec: toNumOrNull(newSpeed),
      score: toNumOrNull(newScore),
      status: 'Pending Approval',
      bestFor: 'Staged in admin registry',
      approved: true,
    };

    setItems((prev) => [created, ...prev]);
    setSelectedSlug(created.slug);
    setNewName('');
    setNewInput('');
    setNewOutput('');
    setNewScore('');
    setNewSpeed('');
  }

  const exportPayload = useMemo(() => {
    return JSON.stringify(
      {
        exportedAt: new Date().toISOString(),
        approvedCount: approvedItems.length,
        models: approvedItems,
      },
      null,
      2,
    );
  }, [approvedItems]);

  async function handleCopyJson() {
    try {
      await navigator.clipboard.writeText(exportPayload);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  function handleDownloadJson() {
    const blob = new Blob([exportPayload], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'promptbill-approved-registry.json';
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      {/* Top Action Bar */}
      <div className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-lg font-extrabold text-slate-900">
            Registry Approval Workbench ({items.length} Models · {approvedItems.length} Approved)
          </h2>
          <p className="text-xs text-slate-600">
            Select a model to edit pricing, scores, speed, or verification status, mark it Approved, and export your staged JSON payload.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 text-xs">
          <button
            type="button"
            onClick={() => setOnlyModifiedOrApproved((prev) => !prev)}
            className={`inline-flex min-h-[40px] items-center gap-1.5 rounded-xl border px-3.5 py-2 font-semibold cursor-pointer ${
              onlyModifiedOrApproved
                ? 'border-emerald-700 bg-emerald-50 text-emerald-900'
                : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
            }`}
          >
            <Sliders className="h-3.5 w-3.5" />
            <span>Approved / Pending ({approvedItems.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setExportOpen((prev) => !prev)}
            className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2 font-semibold text-white hover:bg-slate-800 cursor-pointer"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Export Approved ({approvedItems.length})</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setItems(baseline);
              setQuery('');
              setOnlyModifiedOrApproved(false);
            }}
            className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* Export Drawer */}
      {exportOpen ? (
        <section className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-extrabold text-slate-900">
              Staged Approval JSON ({approvedItems.length} approved models)
            </h3>
            <div className="flex items-center gap-2 text-xs">
              <button
                type="button"
                onClick={handleCopyJson}
                className="inline-flex min-h-[36px] items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 font-semibold text-slate-800 hover:bg-slate-100 cursor-pointer"
              >
                <Copy className="h-3.5 w-3.5" />
                <span>{copied ? 'Copied!' : 'Copy JSON'}</span>
              </button>
              <button
                type="button"
                onClick={handleDownloadJson}
                className="inline-flex min-h-[36px] items-center gap-1.5 rounded-xl bg-emerald-800 px-3 py-1.5 font-semibold text-white hover:bg-emerald-900 cursor-pointer"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Download .json</span>
              </button>
            </div>
          </div>
          <pre className="max-h-64 overflow-auto rounded-2xl bg-slate-950 p-4 text-[11px] text-emerald-300 font-mono">
            {exportPayload}
          </pre>
        </section>
      ) : null}

      {/* Main Two-Column Editor + Model Queue */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Model Queue */}
        <section className="lg:col-span-5 rounded-3xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs space-y-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Filter models in queue..."
              className="min-h-[42px] w-full rounded-xl border border-slate-300 bg-slate-50 pl-9 pr-3 py-2 text-xs text-slate-900 focus:border-emerald-700 focus:bg-white focus:outline-none"
            />
          </div>

          <div className="max-h-[480px] overflow-y-auto divide-y divide-slate-100 pr-1">
            {filtered.map((m) => {
              const isSelected = activeModel?.slug === m.slug;
              return (
                <button
                  key={m.slug}
                  type="button"
                  onClick={() => setSelectedSlug(m.slug)}
                  className={`w-full text-left py-3 px-3 rounded-xl transition-colors flex items-center justify-between gap-2 cursor-pointer ${
                    isSelected ? 'bg-emerald-50/80 ring-1 ring-emerald-200' : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-slate-900 truncate">{m.name}</div>
                    <div className="text-[11px] text-slate-500">
                      {m.provider} · {m.status}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="font-mono text-xs font-bold text-slate-800">
                      {m.score !== null ? m.score.toFixed(1) : '—'}
                    </span>
                    {m.approved ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-700" />
                    ) : null}
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* Right: Selected Model Editor */}
        <section className="lg:col-span-7 rounded-3xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs space-y-5">
          {activeModel ? (
            <>
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">{activeModel.name}</h3>
                  <p className="text-xs text-slate-500">
                    Slug: <code className="font-mono">{activeModel.slug}</code> · Provider: {activeModel.provider}
                  </p>
                </div>

                <label className="inline-flex min-h-[38px] items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-1.5 text-xs font-bold text-slate-900 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={activeModel.approved}
                    onChange={(e) =>
                      updateModel(activeModel.slug, { approved: e.target.checked })
                    }
                    className="h-4 w-4 accent-emerald-700"
                  />
                  <span>Approved for Export</span>
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <label className="space-y-1 font-semibold text-slate-700">
                  <span>Benchmark Score</span>
                  <input
                    type="number"
                    step="0.1"
                    value={activeModel.score ?? ''}
                    onChange={(e) =>
                      updateModel(activeModel.slug, { score: toNumOrNull(e.target.value) })
                    }
                    className="min-h-[42px] w-full rounded-xl border border-slate-300 px-3 py-2 font-mono text-sm text-slate-900"
                  />
                </label>

                <label className="space-y-1 font-semibold text-slate-700">
                  <span>Provenance / Status</span>
                  <select
                    value={activeModel.status}
                    onChange={(e) =>
                      updateModel(activeModel.slug, {
                        status: e.target.value as EditableModelDraft['status'],
                      })
                    }
                    className="min-h-[42px] w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
                  >
                    <option value="Verified">Verified</option>
                    <option value="Estimated">Estimated</option>
                    <option value="Pending Approval">Pending Approval</option>
                  </select>
                </label>

                <label className="space-y-1 font-semibold text-slate-700">
                  <span>Input Price ($ / 1M tokens)</span>
                  <input
                    type="number"
                    step="0.01"
                    value={activeModel.inputPer1M ?? ''}
                    onChange={(e) =>
                      updateModel(activeModel.slug, {
                        inputPer1M: toNumOrNull(e.target.value),
                      })
                    }
                    className="min-h-[42px] w-full rounded-xl border border-slate-300 px-3 py-2 font-mono text-sm text-slate-900"
                  />
                </label>

                <label className="space-y-1 font-semibold text-slate-700">
                  <span>Output Price ($ / 1M tokens)</span>
                  <input
                    type="number"
                    step="0.01"
                    value={activeModel.outputPer1M ?? ''}
                    onChange={(e) =>
                      updateModel(activeModel.slug, {
                        outputPer1M: toNumOrNull(e.target.value),
                      })
                    }
                    className="min-h-[42px] w-full rounded-xl border border-slate-300 px-3 py-2 font-mono text-sm text-slate-900"
                  />
                </label>

                <label className="space-y-1 font-semibold text-slate-700">
                  <span>Cached Input ($ / 1M tokens)</span>
                  <input
                    type="number"
                    step="0.01"
                    value={activeModel.cachedInputPer1M ?? ''}
                    onChange={(e) =>
                      updateModel(activeModel.slug, {
                        cachedInputPer1M: toNumOrNull(e.target.value),
                      })
                    }
                    className="min-h-[42px] w-full rounded-xl border border-slate-300 px-3 py-2 font-mono text-sm text-slate-900"
                  />
                </label>

                <label className="space-y-1 font-semibold text-slate-700">
                  <span>Speed (tok/s) &amp; Context</span>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="number"
                      step="1"
                      placeholder="tok/s"
                      value={activeModel.tokPerSec ?? ''}
                      onChange={(e) =>
                        updateModel(activeModel.slug, {
                          tokPerSec: toNumOrNull(e.target.value),
                        })
                      }
                      className="min-h-[42px] w-full rounded-xl border border-slate-300 px-3 py-2 font-mono text-sm text-slate-900"
                    />
                    <input
                      type="text"
                      placeholder="e.g. 1M"
                      value={activeModel.contextWindow}
                      onChange={(e) =>
                        updateModel(activeModel.slug, { contextWindow: e.target.value })
                      }
                      className="min-h-[42px] w-full rounded-xl border border-slate-300 px-3 py-2 font-mono text-sm text-slate-900"
                    />
                  </div>
                </label>
              </div>

              <label className="block space-y-1 text-xs font-semibold text-slate-700">
                <span>Best For / Notes</span>
                <input
                  type="text"
                  value={activeModel.bestFor}
                  onChange={(e) => updateModel(activeModel.slug, { bestFor: e.target.value })}
                  className="min-h-[42px] w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900"
                />
              </label>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() =>
                    updateModel(activeModel.slug, {
                      approved: true,
                      status: activeModel.status === 'Pending Approval' ? 'Verified' : activeModel.status,
                    })
                  }
                  className="inline-flex min-h-[42px] items-center gap-2 rounded-xl bg-emerald-800 px-5 py-2 text-xs font-bold text-white hover:bg-emerald-900 cursor-pointer"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Approve Model Changes</span>
                </button>
              </div>
            </>
          ) : null}
        </section>
      </div>

      {/* Add New Model Draft Card */}
      <form
        onSubmit={handleAddModel}
        className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs space-y-4"
      >
        <div className="flex items-center gap-2">
          <Plus className="h-4 w-4 text-emerald-700" />
          <h3 className="text-sm font-extrabold text-slate-900">Stage a New Model Entry</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 text-xs">
          <input
            type="text"
            required
            placeholder="Model name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="min-h-[42px] rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 lg:col-span-2"
          />
          <input
            type="text"
            placeholder="Provider"
            value={newProvider}
            onChange={(e) => setNewProvider(e.target.value)}
            className="min-h-[42px] rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900"
          />
          <input
            type="number"
            step="0.01"
            placeholder="Input $/1M"
            value={newInput}
            onChange={(e) => setNewInput(e.target.value)}
            className="min-h-[42px] rounded-xl border border-slate-300 px-3 py-2 font-mono text-sm text-slate-900"
          />
          <input
            type="number"
            step="0.01"
            placeholder="Output $/1M"
            value={newOutput}
            onChange={(e) => setNewOutput(e.target.value)}
            className="min-h-[42px] rounded-xl border border-slate-300 px-3 py-2 font-mono text-sm text-slate-900"
          />
          <button
            type="submit"
            className="inline-flex min-h-[42px] items-center justify-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2 font-bold text-white hover:bg-slate-800 cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Stage Model</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <input
            type="number"
            step="0.1"
            placeholder="Benchmark score (optional)"
            value={newScore}
            onChange={(e) => setNewScore(e.target.value)}
            className="min-h-[40px] rounded-xl border border-slate-200 px-3 py-1.5 font-mono text-slate-900"
          />
          <input
            type="text"
            placeholder="Context window (e.g. 128K)"
            value={newContext}
            onChange={(e) => setNewContext(e.target.value)}
            className="min-h-[40px] rounded-xl border border-slate-200 px-3 py-1.5 font-mono text-slate-900"
          />
          <input
            type="number"
            step="1"
            placeholder="Speed tok/s (optional)"
            value={newSpeed}
            onChange={(e) => setNewSpeed(e.target.value)}
            className="min-h-[40px] rounded-xl border border-slate-200 px-3 py-1.5 font-mono text-slate-900"
          />
        </div>
      </form>
    </div>
  );
}
