'use client';

import React, { useState, useMemo } from 'react';

export interface PendingQueueItem {
  queueId: string;
  type: 'new_model' | 'price_update' | 'benchmark_update';
  detectedAt: string;
  modelId: string;
  modelSlug: string;
  modelName: string;
  provider: string;
  sourceUrl?: string | null;
  summary: string;
  currentValues?: Record<string, unknown>;
  proposedValues?: Record<string, unknown>;
  draftModel?: Record<string, unknown>;
}

export interface PendingQueuePayload {
  updatedAt: string | null;
  items: PendingQueueItem[];
}

interface EditableOverrides {
  score: string;
  tokPerSec: string;
  officialInput: string;
  officialOutput: string;
  routerInput: string;
  routerOutput: string;
  markVerified: boolean;
}

export function AdminRegistryClient({
  initialModels,
  initialPending,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  initialModels: any[];
  initialPending: PendingQueuePayload;
}) {
  const [adminPassword, setAdminPassword] = useState<string>('');
  const [unlocked, setUnlocked] = useState<boolean>(false);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [models, setModels] = useState<any[]>(initialModels);
  const [pendingItems, setPendingItems] = useState<PendingQueueItem[]>(initialPending.items || []);
  const [activeTab, setActiveTab] = useState<'all' | 'new_model' | 'price_update' | 'benchmark_update' | 'catalog'>('all');
  const [overrides, setOverrides] = useState<Record<string, EditableOverrides>>({});
  const [statusLog, setStatusLog] = useState<string[]>([]);
  const [publishing, setPublishing] = useState<boolean>(false);
  const [publishBanner, setPublishBanner] = useState<{ type: 'success' | 'error' | 'warn'; text: string } | null>(null);
  const [hasUnpublishedChanges, setHasUnpublishedChanges] = useState<boolean>(false);

  // Quick manual benchmark/price editor for existing live models
  const [editingLiveSlug, setEditingLiveSlug] = useState<string | null>(null);
  const [liveEditForm, setLiveEditForm] = useState<{
    score: string;
    tokPerSec: string;
    inputPer1M: string;
    outputPer1M: string;
    verified: boolean;
  }>({ score: '', tokPerSec: '', inputPer1M: '', outputPer1M: '', verified: true });

  function getItemEdits(item: PendingQueueItem): EditableOverrides {
    if (overrides[item.queueId]) return overrides[item.queueId];
    const draft = item.draftModel || {};
    const proposed = item.proposedValues || {};
    return {
      score:
        item.type === 'benchmark_update'
          ? String(proposed.score ?? '')
          : draft.score !== null && draft.score !== undefined
          ? String(draft.score)
          : '',
      tokPerSec:
        item.type === 'benchmark_update'
          ? String(proposed.tokPerSec ?? '')
          : draft.tokPerSec !== null && draft.tokPerSec !== undefined
          ? String(draft.tokPerSec)
          : '',
      officialInput:
        item.type === 'new_model' && draft.inputPer1M !== null && draft.inputPer1M !== undefined
          ? String(draft.inputPer1M)
          : '',
      officialOutput:
        item.type === 'new_model' && draft.outputPer1M !== null && draft.outputPer1M !== undefined
          ? String(draft.outputPer1M)
          : '',
      routerInput:
        item.type === 'price_update'
          ? String(proposed.routerInputPer1M ?? '')
          : draft.inputPer1M !== null && draft.inputPer1M !== undefined
          ? String(draft.inputPer1M)
          : '',
      routerOutput:
        item.type === 'price_update'
          ? String(proposed.routerOutputPer1M ?? '')
          : draft.outputPer1M !== null && draft.outputPer1M !== undefined
          ? String(draft.outputPer1M)
          : '',
      markVerified: false,
    };
  }

  function updateItemEdit(queueId: string, patch: Partial<EditableOverrides>, item: PendingQueueItem) {
    const current = getItemEdits(item);
    setOverrides((prev) => ({
      ...prev,
      [queueId]: { ...current, ...patch },
    }));
  }

  function parseOptionalNum(raw: string): number | null {
    const trimmed = raw.trim();
    if (!trimmed) return null;
    const n = Number(trimmed);
    return Number.isFinite(n) && n >= 0 ? n : null;
  }

  function approveItem(item: PendingQueueItem) {
    const edits = getItemEdits(item);
    const nowIso = new Date().toISOString();
    const provStatus = edits.markVerified ? 'Verified' : 'Estimated';

    setModels((prevModels) => {
      const next = [...prevModels];

      if (item.type === 'new_model' && item.draftModel) {
        const scoreVal = parseOptionalNum(edits.score);
        const speedVal = parseOptionalNum(edits.tokPerSec);
        const offIn = parseOptionalNum(edits.officialInput);
        const offOut = parseOptionalNum(edits.officialOutput);
        const rIn = parseOptionalNum(edits.routerInput);
        const rOut = parseOptionalNum(edits.routerOutput);

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const endpoints: any[] = [];
        if (offIn !== null && offOut !== null) {
          endpoints.push({
            host: `${item.provider} Official API`,
            providerType: 'Official API',
            inputPer1M: offIn,
            cachedInputPer1M: null,
            cacheWritePer1M: null,
            outputPer1M: offOut,
            batchDiscount: null,
            latencyMs: null,
            notes: 'Approved via PromptBill Admin',
            currency: 'USD',
            pricingUnit: 'per 1M tokens',
            sourceUrl: item.sourceUrl || null,
            lastVerified: nowIso,
            evidenceStatus: provStatus,
          });
        }
        if (rIn !== null && rOut !== null) {
          endpoints.push({
            host: 'OpenRouter',
            providerType: 'Router',
            inputPer1M: rIn,
            cachedInputPer1M: null,
            cacheWritePer1M: null,
            outputPer1M: rOut,
            batchDiscount: null,
            latencyMs: null,
            notes: 'Synced from OpenRouter & approved via Admin',
            currency: 'USD',
            pricingUnit: 'per 1M tokens',
            sourceUrl: item.sourceUrl || 'https://openrouter.ai/api/v1/models',
            lastVerified: nowIso,
            evidenceStatus: 'Verified',
          });
        }

        const newRecord = {
          ...item.draftModel,
          rank: next.length + 1,
          evidence: provStatus,
          score: scoreVal,
          qualityScore: scoreVal,
          tokPerSec: speedVal,
          speedTokensPerSec: speedVal,
          inputPer1M: offIn ?? rIn,
          outputPer1M: offOut ?? rOut,
          pricingProvenance: {
            status: (offIn ?? rIn) !== null ? provStatus : 'Unavailable',
            sourceUrl: item.sourceUrl || 'https://openrouter.ai/api/v1/models',
            lastVerified: nowIso,
            currency: 'USD',
            pricingUnit: 'per 1M tokens',
            notes: 'Approved via PromptBill Admin',
          },
          benchmarkProvenance: {
            status: scoreVal !== null ? provStatus : 'Unavailable',
            sourceUrl: null,
            lastVerified: scoreVal !== null ? nowIso : null,
            notes: scoreVal !== null ? 'Approved via PromptBill Admin' : 'No benchmark score recorded.',
          },
          speedProvenance: {
            status: speedVal !== null ? provStatus : 'Unavailable',
            sourceUrl: null,
            lastVerified: speedVal !== null ? nowIso : null,
            hardwareOrProvider: null,
            conditions: null,
            notes: speedVal !== null ? 'Approved via PromptBill Admin' : 'No speed measurement recorded.',
          },
          hostingEndpoints: endpoints,
        };

        const existingIdx = next.findIndex((m) => m.slug === newRecord.slug || m.id === newRecord.id);
        if (existingIdx >= 0) {
          next[existingIdx] = newRecord;
        } else {
          next.push(newRecord);
        }
      } else if (item.type === 'price_update') {
        const idx = next.findIndex((m) => m.slug === item.modelSlug || m.id === item.modelId);
        if (idx >= 0) {
          const target = { ...next[idx] };
          const rIn = parseOptionalNum(edits.routerInput);
          const rOut = parseOptionalNum(edits.routerOutput);
          const endpoints = Array.isArray(target.hostingEndpoints) ? [...target.hostingEndpoints] : [];
          const routerIdx = endpoints.findIndex(
            (ep) => ep && (ep.providerType === 'Router' || /openrouter/i.test(String(ep.host || '')))
          );
          if (rIn !== null && rOut !== null) {
            const updatedEp = {
              ...(routerIdx >= 0 ? endpoints[routerIdx] : {}),
              host: 'OpenRouter',
              providerType: 'Router',
              inputPer1M: rIn,
              outputPer1M: rOut,
              currency: 'USD',
              pricingUnit: 'per 1M tokens',
              sourceUrl: item.sourceUrl || 'https://openrouter.ai/api/v1/models',
              lastVerified: nowIso,
              evidenceStatus: 'Verified',
            };
            if (routerIdx >= 0) endpoints[routerIdx] = updatedEp;
            else endpoints.push(updatedEp);
          }
          target.hostingEndpoints = endpoints;
          next[idx] = target;
        }
      } else if (item.type === 'benchmark_update') {
        const idx = next.findIndex((m) => m.slug === item.modelSlug || m.id === item.modelId);
        if (idx >= 0) {
          const target = { ...next[idx] };
          const scoreVal = parseOptionalNum(edits.score);
          const speedVal = parseOptionalNum(edits.tokPerSec);
          if (scoreVal !== null) {
            target.score = scoreVal;
            target.qualityScore = scoreVal;
            target.benchmarkProvenance = {
              status: provStatus,
              sourceUrl: item.sourceUrl || target.benchmarkProvenance?.sourceUrl || null,
              lastVerified: nowIso,
              notes: 'Benchmark update approved via PromptBill Admin',
            };
          }
          if (speedVal !== null) {
            target.tokPerSec = speedVal;
            target.speedTokensPerSec = speedVal;
            target.speedProvenance = {
              status: provStatus,
              sourceUrl: item.sourceUrl || target.speedProvenance?.sourceUrl || null,
              lastVerified: nowIso,
              hardwareOrProvider: target.speedProvenance?.hardwareOrProvider || null,
              conditions: null,
              notes: 'Speed update approved via PromptBill Admin',
            };
          }
          if (edits.markVerified) target.evidence = 'Verified';
          next[idx] = target;
        }
      }

      return next;
    });

    setPendingItems((prev) => prev.filter((p) => p.queueId !== item.queueId));
    setHasUnpublishedChanges(true);
    setStatusLog((prev) => [`Approved: ${item.modelName} (${item.type.replace('_', ' ')})`, ...prev]);
  }

  function rejectItem(item: PendingQueueItem) {
    setPendingItems((prev) => prev.filter((p) => p.queueId !== item.queueId));
    setHasUnpublishedChanges(true);
    setStatusLog((prev) => [`Dismissed: ${item.modelName}`, ...prev]);
  }

  function approveAllVisible() {
    for (const item of filteredPending) {
      approveItem(item);
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function startEditingLiveModel(m: any) {
    setEditingLiveSlug(m.slug);
    setLiveEditForm({
      score: m.score !== null && m.score !== undefined ? String(m.score) : '',
      tokPerSec: m.tokPerSec !== null && m.tokPerSec !== undefined ? String(m.tokPerSec) : '',
      inputPer1M: m.inputPer1M !== null && m.inputPer1M !== undefined ? String(m.inputPer1M) : '',
      outputPer1M: m.outputPer1M !== null && m.outputPer1M !== undefined ? String(m.outputPer1M) : '',
      verified: m.evidence === 'Verified',
    });
  }

  function saveLiveModelEdit(slug: string) {
    const nowIso = new Date().toISOString();
    const scoreVal = parseOptionalNum(liveEditForm.score);
    const speedVal = parseOptionalNum(liveEditForm.tokPerSec);
    const inVal = parseOptionalNum(liveEditForm.inputPer1M);
    const outVal = parseOptionalNum(liveEditForm.outputPer1M);
    const status = liveEditForm.verified ? 'Verified' : 'Estimated';

    setModels((prev) =>
      prev.map((m) => {
        if (m.slug !== slug) return m;
        const endpoints = Array.isArray(m.hostingEndpoints) ? [...m.hostingEndpoints] : [];
        const offIdx = endpoints.findIndex((ep) => ep && ep.providerType === 'Official API');
        if (offIdx >= 0 && inVal !== null && outVal !== null) {
          endpoints[offIdx] = {
            ...endpoints[offIdx],
            inputPer1M: inVal,
            outputPer1M: outVal,
            lastVerified: nowIso,
            evidenceStatus: status,
          };
        }
        return {
          ...m,
          evidence: status,
          score: scoreVal,
          qualityScore: scoreVal,
          tokPerSec: speedVal,
          speedTokensPerSec: speedVal,
          inputPer1M: inVal,
          outputPer1M: outVal,
          pricingProvenance: {
            ...(m.pricingProvenance || {}),
            status: inVal !== null && outVal !== null ? status : 'Unavailable',
            lastVerified: nowIso,
          },
          benchmarkProvenance: {
            ...(m.benchmarkProvenance || {}),
            status: scoreVal !== null ? status : 'Unavailable',
            lastVerified: scoreVal !== null ? nowIso : null,
          },
          speedProvenance: {
            ...(m.speedProvenance || {}),
            status: speedVal !== null ? status : 'Unavailable',
            lastVerified: speedVal !== null ? nowIso : null,
          },
          hostingEndpoints: endpoints,
        };
      })
    );

    setEditingLiveSlug(null);
    setHasUnpublishedChanges(true);
    setStatusLog((prev) => [`Updated live model: ${slug}`, ...prev]);
  }

  async function publishToGitHub() {
    setPublishing(true);
    setPublishBanner(null);

    const modelsJsonContent = JSON.stringify(models, null, 2) + '\n';
    const pendingJsonContent =
      JSON.stringify(
        {
          updatedAt: new Date().toISOString(),
          items: pendingItems,
        },
        null,
        2
      ) + '\n';

    try {
      const res = await fetch('/api/admin/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminPassword,
          modelsJsonContent,
          pendingJsonContent,
        }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        setHasUnpublishedChanges(false);
        setPublishBanner({ type: 'success', text: data.message });
      } else {
        setPublishBanner({
          type: data.needsSetup ? 'warn' : 'error',
          text: data.error || 'Could not publish automatically.',
        });
      }
    } catch {
      setPublishBanner({
        type: 'error',
        text: 'Network error while publishing. You can still download models.json below.',
      });
    } finally {
      setPublishing(false);
    }
  }

  function downloadJsonFile(filename: string, content: string) {
    const blob = new Blob([content], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  const filteredPending = useMemo(() => {
    if (activeTab === 'all') return pendingItems;
    if (activeTab === 'catalog') return [];
    return pendingItems.filter((i) => i.type === activeTab);
  }, [pendingItems, activeTab]);

  const counts = useMemo(
    () => ({
      all: pendingItems.length,
      new_model: pendingItems.filter((i) => i.type === 'new_model').length,
      price_update: pendingItems.filter((i) => i.type === 'price_update').length,
      benchmark_update: pendingItems.filter((i) => i.type === 'benchmark_update').length,
    }),
    [pendingItems]
  );

  if (!unlocked) {
    return (
      <div className="max-w-md mx-auto rounded-xl border border-slate-200 bg-white p-6 space-y-4">
        <h2 className="text-lg font-bold text-slate-900">Unlock PromptBill Admin</h2>
        <p className="text-xs text-slate-600 leading-relaxed">
          Enter your <code className="font-mono">ADMIN_PASSWORD</code> (configured in Vercel Environment Variables) to review and publish model, pricing, and benchmark updates.
        </p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (adminPassword.trim()) setUnlocked(true);
          }}
          className="space-y-3"
        >
          <input
            type="password"
            placeholder="Enter admin password"
            value={adminPassword}
            onChange={(e) => setAdminPassword(e.target.value)}
            className="min-h-[42px] w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900"
          />
          <button
            type="submit"
            className="w-full min-h-[42px] rounded-lg bg-emerald-800 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-900"
          >
            Open Approval Dashboard
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Publish Bar */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="text-xs font-semibold text-slate-600">
            Last GitHub Sync: {initialPending.updatedAt ? new Date(initialPending.updatedAt).toLocaleString() : 'Not run yet'} · Live Models: {models.length}
          </div>
          <div className="text-sm font-bold text-slate-900">
            {pendingItems.length} item(s) waiting for your approval
            {hasUnpublishedChanges ? (
              <span className="ml-2 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-900">
                Unsaved approvals ready to publish
              </span>
            ) : null}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={publishToGitHub}
            disabled={publishing}
            className="min-h-[42px] rounded-lg bg-emerald-800 px-4 py-2 text-xs sm:text-sm font-bold text-white hover:bg-emerald-900 disabled:opacity-60"
          >
            {publishing ? 'Publishing to GitHub...' : 'Publish Approved Changes to Website'}
          </button>
          <button
            type="button"
            onClick={() => downloadJsonFile('models.json', JSON.stringify(models, null, 2) + '\n')}
            className="min-h-[42px] rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-50"
          >
            Download models.json
          </button>
        </div>
      </div>

      {publishBanner ? (
        <div
          className={`rounded-xl border p-4 text-xs sm:text-sm ${
            publishBanner.type === 'success'
              ? 'border-emerald-300 bg-emerald-50 text-emerald-950'
              : publishBanner.type === 'warn'
              ? 'border-amber-300 bg-amber-50 text-amber-950'
              : 'border-rose-300 bg-rose-50 text-rose-950'
          }`}
        >
          {publishBanner.text}
        </div>
      ) : null}

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2 text-xs">
          {[
            { id: 'all', label: `All Pending (${counts.all})` },
            { id: 'new_model', label: `New Models (${counts.new_model})` },
            { id: 'price_update', label: `Price Updates (${counts.price_update})` },
            { id: 'benchmark_update', label: `Benchmarks (${counts.benchmark_update})` },
            { id: 'catalog', label: `Edit Live Catalog (${models.length})` },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`min-h-[38px] rounded-lg px-3.5 py-2 font-semibold ${
                activeTab === tab.id
                  ? 'bg-slate-900 text-white'
                  : 'border border-slate-200 bg-white text-slate-800 hover:bg-slate-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab !== 'catalog' && filteredPending.length > 0 ? (
          <button
            type="button"
            onClick={approveAllVisible}
            className="min-h-[38px] rounded-lg border border-emerald-700 bg-emerald-50 px-3.5 py-2 text-xs font-semibold text-emerald-900 hover:bg-emerald-100"
          >
            Approve All ({filteredPending.length})
          </button>
        ) : null}
      </div>

      {/* Pending Review Cards */}
      {activeTab !== 'catalog' ? (
        filteredPending.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-600">
            No pending items in this tab. GitHub Actions checks daily at 04:00 UTC (or you can run the workflow manually in GitHub Actions).
          </div>
        ) : (
          <div className="space-y-4">
            {filteredPending.map((item) => {
              const edits = getItemEdits(item);
              return (
                <div
                  key={item.queueId}
                  className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5 space-y-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase ${
                            item.type === 'new_model'
                              ? 'bg-indigo-100 text-indigo-900'
                              : item.type === 'price_update'
                              ? 'bg-amber-100 text-amber-900'
                              : 'bg-emerald-100 text-emerald-900'
                          }`}
                        >
                          {item.type.replace('_', ' ')}
                        </span>
                        <h3 className="text-base font-bold text-slate-900">{item.modelName}</h3>
                        <span className="text-xs text-slate-500">({item.provider})</span>
                      </div>
                      <p className="text-xs text-slate-700">{item.summary}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => approveItem(item)}
                        className="min-h-[38px] rounded-lg bg-emerald-800 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-emerald-900"
                      >
                        Approve
                      </button>
                      <button
                        type="button"
                        onClick={() => rejectItem(item)}
                        className="min-h-[38px] rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                      >
                        Dismiss
                      </button>
                    </div>
                  </div>

                  {/* Optional Quick Edit Fields Before Approving */}
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2 border-t border-slate-100 text-xs">
                    {item.type === 'new_model' ? (
                      <>
                        <label className="space-y-1">
                          <span className="text-slate-600 font-medium block">Official In / 1M</span>
                          <input
                            type="number"
                            step="any"
                            placeholder="Optional"
                            value={edits.officialInput}
                            onChange={(e) => updateItemEdit(item.queueId, { officialInput: e.target.value }, item)}
                            className="min-h-[36px] w-full rounded-lg border border-slate-300 px-2.5 py-1 font-mono"
                          />
                        </label>
                        <label className="space-y-1">
                          <span className="text-slate-600 font-medium block">Official Out / 1M</span>
                          <input
                            type="number"
                            step="any"
                            placeholder="Optional"
                            value={edits.officialOutput}
                            onChange={(e) => updateItemEdit(item.queueId, { officialOutput: e.target.value }, item)}
                            className="min-h-[36px] w-full rounded-lg border border-slate-300 px-2.5 py-1 font-mono"
                          />
                        </label>
                      </>
                    ) : null}

                    {item.type !== 'benchmark_update' ? (
                      <>
                        <label className="space-y-1">
                          <span className="text-slate-600 font-medium block">Router In / 1M</span>
                          <input
                            type="number"
                            step="any"
                            value={edits.routerInput}
                            onChange={(e) => updateItemEdit(item.queueId, { routerInput: e.target.value }, item)}
                            className="min-h-[36px] w-full rounded-lg border border-slate-300 px-2.5 py-1 font-mono"
                          />
                        </label>
                        <label className="space-y-1">
                          <span className="text-slate-600 font-medium block">Router Out / 1M</span>
                          <input
                            type="number"
                            step="any"
                            value={edits.routerOutput}
                            onChange={(e) => updateItemEdit(item.queueId, { routerOutput: e.target.value }, item)}
                            className="min-h-[36px] w-full rounded-lg border border-slate-300 px-2.5 py-1 font-mono"
                          />
                        </label>
                      </>
                    ) : null}

                    <label className="space-y-1">
                      <span className="text-slate-600 font-medium block">Benchmark Score</span>
                      <input
                        type="number"
                        step="0.1"
                        placeholder="e.g. 88.5"
                        value={edits.score}
                        onChange={(e) => updateItemEdit(item.queueId, { score: e.target.value }, item)}
                        className="min-h-[36px] w-full rounded-lg border border-slate-300 px-2.5 py-1 font-mono"
                      />
                    </label>

                    <label className="space-y-1">
                      <span className="text-slate-600 font-medium block">Speed (tok/s)</span>
                      <input
                        type="number"
                        step="1"
                        placeholder="e.g. 140"
                        value={edits.tokPerSec}
                        onChange={(e) => updateItemEdit(item.queueId, { tokPerSec: e.target.value }, item)}
                        className="min-h-[36px] w-full rounded-lg border border-slate-300 px-2.5 py-1 font-mono"
                      />
                    </label>

                    <label className="flex items-center gap-2 pt-5 font-medium text-slate-800 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={edits.markVerified}
                        onChange={(e) => updateItemEdit(item.queueId, { markVerified: e.target.checked }, item)}
                        className="h-4 w-4 rounded border-slate-300"
                      />
                      <span>Mark Verified</span>
                    </label>
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : (
        /* Edit Live Catalog Models (Scores, Speeds, Official Prices) */
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-100 font-semibold text-slate-800">
                <th className="py-2.5 px-3">Model</th>
                <th className="py-2.5 px-3">Score</th>
                <th className="py-2.5 px-3">Speed (tok/s)</th>
                <th className="py-2.5 px-3">Official In / Out</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {models.map((m) => {
                const isEditing = editingLiveSlug === m.slug;
                return (
                  <tr key={m.slug} className="bg-white">
                    <td className="py-2.5 px-3 font-semibold text-slate-900">
                      {m.name} <span className="font-normal text-slate-500">({m.provider})</span>
                    </td>
                    <td className="py-2.5 px-3 font-mono">
                      {isEditing ? (
                        <input
                          type="number"
                          step="0.1"
                          value={liveEditForm.score}
                          onChange={(e) => setLiveEditForm({ ...liveEditForm, score: e.target.value })}
                          className="w-20 rounded border border-slate-300 px-2 py-1"
                        />
                      ) : (
                        m.score ?? 'N/A'
                      )}
                    </td>
                    <td className="py-2.5 px-3 font-mono">
                      {isEditing ? (
                        <input
                          type="number"
                          step="1"
                          value={liveEditForm.tokPerSec}
                          onChange={(e) => setLiveEditForm({ ...liveEditForm, tokPerSec: e.target.value })}
                          className="w-20 rounded border border-slate-300 px-2 py-1"
                        />
                      ) : (
                        m.tokPerSec ?? 'N/A'
                      )}
                    </td>
                    <td className="py-2.5 px-3 font-mono">
                      {isEditing ? (
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            step="any"
                            value={liveEditForm.inputPer1M}
                            onChange={(e) => setLiveEditForm({ ...liveEditForm, inputPer1M: e.target.value })}
                            className="w-20 rounded border border-slate-300 px-2 py-1"
                          />
                          <span>/</span>
                          <input
                            type="number"
                            step="any"
                            value={liveEditForm.outputPer1M}
                            onChange={(e) => setLiveEditForm({ ...liveEditForm, outputPer1M: e.target.value })}
                            className="w-20 rounded border border-slate-300 px-2 py-1"
                          />
                        </div>
                      ) : (
                        `$${m.inputPer1M ?? 'N/A'} / $${m.outputPer1M ?? 'N/A'}`
                      )}
                    </td>
                    <td className="py-2.5 px-3">
                      {isEditing ? (
                        <label className="inline-flex items-center gap-1.5">
                          <input
                            type="checkbox"
                            checked={liveEditForm.verified}
                            onChange={(e) => setLiveEditForm({ ...liveEditForm, verified: e.target.checked })}
                          />
                          <span>Verified</span>
                        </label>
                      ) : (
                        m.evidence || 'Estimated'
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      {isEditing ? (
                        <div className="inline-flex gap-1.5">
                          <button
                            type="button"
                            onClick={() => saveLiveModelEdit(m.slug)}
                            className="rounded bg-emerald-800 px-2.5 py-1 font-semibold text-white"
                          >
                            Save
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingLiveSlug(null)}
                            className="rounded border border-slate-300 px-2.5 py-1"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => startEditingLiveModel(m)}
                          className="rounded border border-slate-300 px-2.5 py-1 font-semibold text-slate-800 hover:bg-slate-50"
                        >
                          Edit
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {statusLog.length > 0 ? (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-1.5 text-xs text-slate-700">
          <div className="font-bold text-slate-900">Session Activity</div>
          <ul className="list-disc pl-5 space-y-1">
            {statusLog.slice(0, 10).map((entry, idx) => (
              <li key={idx}>{entry}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
