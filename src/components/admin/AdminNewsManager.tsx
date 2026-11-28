'use client';

import React, { useCallback, useEffect, useState } from 'react';
import type { NewsArticle, NewsCategory, NewsPriceDelta } from '@/lib/news';

interface AdminNewsManagerProps {
  adminPassword: string;
  initialDraft?: NewsArticle | null;
  onDraftConsumed?: () => void;
}

const CATEGORIES: NewsCategory[] = [
  'Price Drop',
  'New Model',
  'Benchmark Shift',
  'Deprecation',
  'Endpoint Update',
];

function createEmptyArticle(): NewsArticle {
  return {
    slug: '',
    title: '',
    summary: '',
    category: 'Price Drop',
    publishedAt: new Date().toISOString(),
    authorName: 'Zeeshan Mushtaq Lone',
    authorUrl: 'https://promptbill.online/about',
    featured: false,
    relatedModelSlugs: [],
    priceDeltas: [],
    keyTakeaways: [''],
    sections: [{ heading: '', body: '' }],
    sourceUrls: [{ label: '', url: '' }],
  };
}

export default function AdminNewsManager({
  adminPassword,
  initialDraft,
  onDraftConsumed,
}: AdminNewsManagerProps) {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [editingOriginalSlug, setEditingOriginalSlug] = useState<string | null>(null);
  const [draft, setDraft] = useState<NewsArticle>(createEmptyArticle);
  const [relatedSlugsText, setRelatedSlugsText] = useState<string>('');

  const loadArticles = useCallback(async () => {
    if (!adminPassword) return;
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/admin/news', {
        headers: { 'x-admin-password': adminPassword },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load published articles');
      setArticles(Array.isArray(data.articles) ? data.articles : []);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Error loading news');
    } finally {
      setLoading(false);
    }
  }, [adminPassword]);

  useEffect(() => {
    loadArticles();
  }, [loadArticles]);

  useEffect(() => {
    if (initialDraft) {
      setEditingOriginalSlug(null);
      setDraft(initialDraft);
      setRelatedSlugsText((initialDraft.relatedModelSlugs || []).join(', '));
      setStatusMsg(`Auto-generated price drop draft loaded for "${initialDraft.title}". Review and publish.`);
      onDraftConsumed?.();
    }
  }, [initialDraft, onDraftConsumed]);

  function startEdit(article: NewsArticle) {
    setEditingOriginalSlug(article.slug);
    setDraft({
      ...article,
      keyTakeaways: article.keyTakeaways?.length ? [...article.keyTakeaways] : [''],
      sections: article.sections?.length ? article.sections.map((s) => ({ ...s })) : [{ heading: '', body: '' }],
      sourceUrls: article.sourceUrls?.length ? article.sourceUrls.map((s) => ({ ...s })) : [{ label: '', url: '' }],
      priceDeltas: article.priceDeltas?.length ? article.priceDeltas.map((d) => ({ ...d })) : [],
    });
    setRelatedSlugsText((article.relatedModelSlugs || []).join(', '));
    setStatusMsg(`Editing "${article.title}"`);
    setErrorMsg(null);
  }

  function resetEditor() {
    setEditingOriginalSlug(null);
    setDraft(createEmptyArticle());
    setRelatedSlugsText('');
    setStatusMsg(null);
    setErrorMsg(null);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setStatusMsg(null);
    setErrorMsg(null);

    try {
      const normalizedSlug = (draft.slug || draft.title)
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9-]+/g, '-')
        .replace(/^-+|-+$/g, '');

      const payload: NewsArticle = {
        ...draft,
        slug: normalizedSlug,
        relatedModelSlugs: relatedSlugsText
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
        keyTakeaways: draft.keyTakeaways.map((k) => k.trim()).filter(Boolean),
        sections: draft.sections.filter((s) => s.heading.trim() || s.body.trim()),
        sourceUrls: draft.sourceUrls.filter((s) => s.label.trim() && s.url.trim()),
      };

      const res = await fetch('/api/admin/news', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-password': adminPassword,
        },
        body: JSON.stringify({
          article: payload,
          originalSlug: editingOriginalSlug || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to publish article');

      setArticles(Array.isArray(data.articles) ? data.articles : []);
      setStatusMsg(
        editingOriginalSlug
          ? `Updated "${payload.title}" and committed to GitHub.`
          : `Published "${payload.title}" and committed to GitHub.`
      );
      setEditingOriginalSlug(null);
      setDraft(createEmptyArticle());
      setRelatedSlugsText('');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(slug: string, title: string) {
    if (!window.confirm(`Delete "${title}" (${slug}) from src/data/news.json?`)) return;
    setSaving(true);
    setStatusMsg(null);
    setErrorMsg(null);
    try {
      const res = await fetch(`/api/admin/news?slug=${encodeURIComponent(slug)}`, {
        method: 'DELETE',
        headers: { 'x-admin-password': adminPassword },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete article');

      setArticles(Array.isArray(data.articles) ? data.articles : []);
      if (editingOriginalSlug === slug) {
        resetEditor();
      }
      setStatusMsg(`Deleted "${title}" from GitHub.`);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Delete failed');
    } finally {
      setSaving(false);
    }
  }

  function addDeltaRow() {
    const emptyDelta: NewsPriceDelta = {
      modelSlug: '',
      modelName: '',
      provider: '',
      endpointHost: '',
      oldInputPer1M: null,
      newInputPer1M: null,
      oldOutputPer1M: null,
      newOutputPer1M: null,
    };
    setDraft((prev) => ({ ...prev, priceDeltas: [...prev.priceDeltas, emptyDelta] }));
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900">News &amp; Price Drop Feed Manager</h2>
          <p className="text-xs text-slate-500">
            Create, edit, or delete articles in <code className="font-mono">src/data/news.json</code>.
            Updates automatically refresh <code className="font-mono">/news</code>,{' '}
            <code className="font-mono">/news/rss.xml</code>,{' '}
            <code className="font-mono">/sitemap.xml</code>, and{' '}
            <code className="font-mono">/llms.txt</code>.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <a
            href="/news/rss.xml"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            View RSS Feed
          </a>
          <button
            type="button"
            onClick={loadArticles}
            disabled={loading}
            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            {loading ? 'Refreshing...' : 'Refresh List'}
          </button>
        </div>
      </div>

      {statusMsg ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-medium text-emerald-900">
          {statusMsg}
        </div>
      ) : null}

      {errorMsg ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-medium text-rose-900">
          {errorMsg}
        </div>
      ) : null}

      {/* Editor Form */}
      <form onSubmit={handleSave} className="rounded-2xl border border-slate-200 bg-white p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900">
            {editingOriginalSlug ? `Editing Article: ${editingOriginalSlug}` : 'New News Article / Price Drop Post'}
          </h3>
          {editingOriginalSlug ? (
            <button
              type="button"
              onClick={resetEditor}
              className="text-xs font-semibold text-slate-600 hover:text-slate-900 underline"
            >
              Cancel Edit &amp; Start New
            </button>
          ) : null}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Headline *</label>
            <input
              type="text"
              required
              value={draft.title}
              onChange={(e) => setDraft({ ...draft, title: e.target.value })}
              placeholder="DeepSeek V3.2 API Pricing Cut by 40% on DeepInfra"
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-900"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">URL Slug *</label>
            <input
              type="text"
              required
              value={draft.slug}
              onChange={(e) => setDraft({ ...draft, slug: e.target.value })}
              placeholder="deepseek-v3-2-price-drop-2026-11-28"
              className="w-full rounded-xl border border-slate-300 px-3 py-2 font-mono text-xs text-slate-900"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
            <select
              value={draft.category}
              onChange={(e) => setDraft({ ...draft, category: e.target.value as NewsCategory })}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-900 bg-white"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Related Model Slugs (comma-separated)
            </label>
            <input
              type="text"
              value={relatedSlugsText}
              onChange={(e) => setRelatedSlugsText(e.target.value)}
              placeholder="deepseek-v3-2, gpt-5-mini"
              className="w-full rounded-xl border border-slate-300 px-3 py-2 font-mono text-xs text-slate-900"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Summary *</label>
          <textarea
            required
            rows={2}
            value={draft.summary}
            onChange={(e) => setDraft({ ...draft, summary: e.target.value })}
            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-900"
          />
        </div>

        <label className="inline-flex items-center gap-2 text-xs font-medium text-slate-700">
          <input
            type="checkbox"
            checked={Boolean(draft.featured)}
            onChange={(e) => setDraft({ ...draft, featured: e.target.checked })}
            className="rounded border-slate-300"
          />
          Pin as Featured Story at top of /news
        </label>

        {/* Price Deltas */}
        <div className="space-y-2 border-t border-slate-100 pt-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800">Price Delta Rows (USD / 1M)</span>
            <button
              type="button"
              onClick={addDeltaRow}
              className="rounded-lg border border-slate-300 px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-50"
            >
              + Add Price Delta
            </button>
          </div>

          {draft.priceDeltas.map((delta, idx) => (
            <div key={idx} className="grid grid-cols-2 sm:grid-cols-7 gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3">
              <input
                type="text"
                placeholder="Model Slug"
                value={delta.modelSlug}
                onChange={(e) => {
                  const next = [...draft.priceDeltas];
                  next[idx] = { ...delta, modelSlug: e.target.value };
                  setDraft({ ...draft, priceDeltas: next });
                }}
                className="rounded-lg border border-slate-300 bg-white px-2 py-1.5 font-mono text-[11px]"
              />
              <input
                type="text"
                placeholder="Model Name"
                value={delta.modelName}
                onChange={(e) => {
                  const next = [...draft.priceDeltas];
                  next[idx] = { ...delta, modelName: e.target.value };
                  setDraft({ ...draft, priceDeltas: next });
                }}
                className="rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-[11px]"
              />
              <input
                type="text"
                placeholder="Provider / Host"
                value={delta.endpointHost || delta.provider}
                onChange={(e) => {
                  const next = [...draft.priceDeltas];
                  next[idx] = { ...delta, provider: e.target.value, endpointHost: e.target.value };
                  setDraft({ ...draft, priceDeltas: next });
                }}
                className="rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-[11px]"
              />
              <input
                type="number"
                step="any"
                placeholder="Old In"
                value={delta.oldInputPer1M ?? ''}
                onChange={(e) => {
                  const next = [...draft.priceDeltas];
                  next[idx] = {
                    ...delta,
                    oldInputPer1M: e.target.value === '' ? null : Number(e.target.value),
                  };
                  setDraft({ ...draft, priceDeltas: next });
                }}
                className="rounded-lg border border-slate-300 bg-white px-2 py-1.5 font-mono text-[11px]"
              />
              <input
                type="number"
                step="any"
                placeholder="New In"
                value={delta.newInputPer1M ?? ''}
                onChange={(e) => {
                  const next = [...draft.priceDeltas];
                  next[idx] = {
                    ...delta,
                    newInputPer1M: e.target.value === '' ? null : Number(e.target.value),
                  };
                  setDraft({ ...draft, priceDeltas: next });
                }}
                className="rounded-lg border border-slate-300 bg-white px-2 py-1.5 font-mono text-[11px]"
              />
              <input
                type="number"
                step="any"
                placeholder="Old Out"
                value={delta.oldOutputPer1M ?? ''}
                onChange={(e) => {
                  const next = [...draft.priceDeltas];
                  next[idx] = {
                    ...delta,
                    oldOutputPer1M: e.target.value === '' ? null : Number(e.target.value),
                  };
                  setDraft({ ...draft, priceDeltas: next });
                }}
                className="rounded-lg border border-slate-300 bg-white px-2 py-1.5 font-mono text-[11px]"
              />
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  step="any"
                  placeholder="New Out"
                  value={delta.newOutputPer1M ?? ''}
                  onChange={(e) => {
                    const next = [...draft.priceDeltas];
                    next[idx] = {
                      ...delta,
                      newOutputPer1M: e.target.value === '' ? null : Number(e.target.value),
                    };
                    setDraft({ ...draft, priceDeltas: next });
                  }}
                  className="w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5 font-mono text-[11px]"
                />
                <button
                  type="button"
                  onClick={() =>
                    setDraft({
                      ...draft,
                      priceDeltas: draft.priceDeltas.filter((_, i) => i !== idx),
                    })
                  }
                  className="px-1.5 text-xs font-bold text-rose-600 hover:text-rose-800"
                  title="Remove row"
                >
                  ×
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Body Section */}
        <div className="space-y-3 border-t border-slate-100 pt-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800">Article Sections</span>
            <button
              type="button"
              onClick={() =>
                setDraft({ ...draft, sections: [...draft.sections, { heading: '', body: '' }] })
              }
              className="rounded-lg border border-slate-300 px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-50"
            >
              + Add Section
            </button>
          </div>

          {draft.sections.map((sec, idx) => (
            <div key={idx} className="space-y-2 rounded-xl border border-slate-200 p-3">
              <input
                type="text"
                placeholder="Section Heading"
                value={sec.heading}
                onChange={(e) => {
                  const next = [...draft.sections];
                  next[idx] = { ...sec, heading: e.target.value };
                  setDraft({ ...draft, sections: next });
                }}
                className="w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs font-semibold"
              />
              <textarea
                rows={3}
                placeholder="Section body paragraphs..."
                value={sec.body}
                onChange={(e) => {
                  const next = [...draft.sections];
                  next[idx] = { ...sec, body: e.target.value };
                  setDraft({ ...draft, sections: next });
                }}
                className="w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs"
              />
            </div>
          ))}
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="rounded-xl bg-slate-900 px-5 py-2.5 text-xs font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
          >
            {saving
              ? 'Committing to GitHub...'
              : editingOriginalSlug
              ? 'Save Changes & Republish'
              : 'Publish News Article'}
          </button>
        </div>
      </form>

      {/* Published Articles List (Edit / Delete) */}
      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
        <div className="border-b border-slate-200 bg-slate-50 px-5 py-3 flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Published Articles ({articles.length})
          </h3>
        </div>

        {articles.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-500">
            No articles found in <code className="font-mono">src/data/news.json</code>.
          </div>
        ) : (
          <ul className="divide-y divide-slate-200">
            {articles.map((article) => (
              <li
                key={article.slug}
                className="flex flex-wrap items-center justify-between gap-4 px-5 py-4 hover:bg-slate-50/70"
              >
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-center gap-2 text-[11px]">
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 font-semibold text-slate-700">
                      {article.category}
                    </span>
                    <span className="font-mono text-slate-400">{article.slug}</span>
                  </div>
                  <div className="text-sm font-semibold text-slate-900 truncate">{article.title}</div>
                </div>

                <div className="flex items-center gap-2">
                  <a
                    href={`/news/${article.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100"
                  >
                    View
                  </a>
                  <button
                    type="button"
                    onClick={() => startEdit(article)}
                    className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 hover:bg-slate-100"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(article.slug, article.title)}
                    disabled={saving}
                    className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-100 disabled:opacity-50"
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
