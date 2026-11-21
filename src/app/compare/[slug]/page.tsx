import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { ALL_MODELS, getAutoComparisonPairs, parseComparisonSlug } from '../../../lib/catalog';
import { SiteShell } from '../../../components/SiteShell';

export function generateStaticParams() {
  return getAutoComparisonPairs(20).map((pair) => ({ slug: pair.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const parsed = parseComparisonSlug(slug) || { slug: `${ALL_MODELS[0].slug}-vs-${ALL_MODELS[1].slug}`, modelA: ALL_MODELS[0], modelB: ALL_MODELS[1] };
  const { modelA, modelB } = parsed;
  const title = `${modelA.name} vs ${modelB.name}: API Pricing, Tok/s Speed, Elo & Benchmarks`;
  const description = `Compare ${modelA.name} ($${modelA.inputPer1M.toFixed(2)}/$${modelA.outputPer1M.toFixed(2)} per 1M, ${modelA.tokPerSec} tok/s, Elo ${modelA.elo}) vs ${modelB.name} ($${modelB.inputPer1M.toFixed(2)}/$${modelB.outputPer1M.toFixed(2)} per 1M, ${modelB.tokPerSec} tok/s, Elo ${modelB.elo}) across AG, CO, and RE scores.`;
  return {
    title,
    description,
    alternates: { canonical: `https://promptbill.online/compare/${modelA.slug}-vs-${modelB.slug}` },
    openGraph: { title, description, url: `https://promptbill.online/compare/${modelA.slug}-vs-${modelB.slug}`, siteName: 'PromptBill', type: 'article' },
  };
}

export default async function ComparePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const parsed = parseComparisonSlug(slug) || { slug: `${ALL_MODELS[0].slug}-vs-${ALL_MODELS[1].slug}`, modelA: ALL_MODELS[0], modelB: ALL_MODELS[1] };
  const { modelA, modelB } = parsed;

  const rows: { label: string; aVal: string; bVal: string }[] = [
    { label: 'Composite Score', aVal: modelA.score.toFixed(1), bVal: modelB.score.toFixed(1) },
    { label: 'Elo Rating', aVal: modelA.elo.toFixed(1), bVal: modelB.elo.toFixed(1) },
    { label: 'Input Price / 1M Tokens', aVal: `$${modelA.inputPer1M.toFixed(2)}`, bVal: `$${modelB.inputPer1M.toFixed(2)}` },
    { label: 'Cached Input / 1M Tokens', aVal: `$${modelA.cachedInputPer1M.toFixed(2)}`, bVal: `$${modelB.cachedInputPer1M.toFixed(2)}` },
    { label: 'Output Price / 1M Tokens', aVal: `$${modelA.outputPer1M.toFixed(2)}`, bVal: `$${modelB.outputPer1M.toFixed(2)}` },
    { label: 'Speed (Tokens / Sec)', aVal: `${modelA.tokPerSec} tok/s`, bVal: `${modelB.tokPerSec} tok/s` },
    { label: 'Context Window', aVal: modelA.contextWindow, bVal: modelB.contextWindow },
    { label: 'Agentic (AG)', aVal: String(modelA.ag), bVal: String(modelB.ag) },
    { label: 'Coding (CO)', aVal: String(modelA.co), bVal: String(modelB.co) },
    { label: 'Reasoning (RE)', aVal: String(modelA.re), bVal: String(modelB.re) },
    { label: 'Multimodal (MM)', aVal: String(modelA.mm), bVal: String(modelB.mm) },
    { label: 'Knowledge (KN)', aVal: String(modelA.kn), bVal: String(modelB.kn) },
    { label: 'Multilingual (ML)', aVal: String(modelA.ml), bVal: String(modelB.ml) },
    { label: 'Instruction Following (IF)', aVal: String(modelA.if), bVal: String(modelB.if) },
    { label: 'Math (MA)', aVal: String(modelA.ma), bVal: String(modelB.ma) },
  ];

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'ItemList',
        name: `${modelA.name} vs ${modelB.name} Comparison`,
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: modelA.name, url: `https://promptbill.online/models/${modelA.slug}` },
          { '@type': 'ListItem', position: 2, name: modelB.name, url: `https://promptbill.online/models/${modelB.slug}` },
        ],
      },
      {
        '@type': 'FAQPage',
        mainEntity: [
          {
            '@type': 'Question',
            name: `Which is cheaper per million tokens: ${modelA.name} or ${modelB.name}?`,
            acceptedAnswer: {
              '@type': 'Answer',
              text: `${modelA.name} is priced at $${modelA.inputPer1M.toFixed(2)} input / $${modelA.outputPer1M.toFixed(2)} output per 1M tokens, compared to ${modelB.name} at $${modelB.inputPer1M.toFixed(2)} input / $${modelB.outputPer1M.toFixed(2)} output per 1M tokens.`,
            },
          },
          {
            '@type': 'Question',
            name: `Which is faster in tokens per second: ${modelA.name} or ${modelB.name}?`,
            acceptedAnswer: {
              '@type': 'Answer',
              text: `${modelA.name} runs at ${modelA.tokPerSec} tok/s and ${modelB.name} runs at ${modelB.tokPerSec} tok/s.`,
            },
          },
        ],
      },
    ],
  };

  return (
    <SiteShell title={`${modelA.name} vs ${modelB.name} — API Pricing, Tok/s, Elo & Benchmarks`} subtitle={`promptbill.online/compare/${modelA.slug}-vs-${modelB.slug}`}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <article className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6 space-y-6">
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4 text-xs sm:text-sm text-slate-800 leading-relaxed">
          In a head-to-head comparison, <strong>{modelA.name}</strong> (Score {modelA.score.toFixed(1)}, Elo {modelA.elo.toFixed(1)}, <strong>${modelA.inputPer1M.toFixed(2)}/${modelA.outputPer1M.toFixed(2)}</strong> per 1M, <strong>{modelA.tokPerSec} tok/s</strong>, Coding {modelA.co}, Reasoning {modelA.re}) vs. <strong>{modelB.name}</strong> (Score {modelB.score.toFixed(1)}, Elo {modelB.elo.toFixed(1)}, <strong>${modelB.inputPer1M.toFixed(2)}/${modelB.outputPer1M.toFixed(2)}</strong> per 1M, <strong>{modelB.tokPerSec} tok/s</strong>, Coding {modelB.co}, Reasoning {modelB.re}).
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[620px]">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-600">
                <th className="py-2.5 px-3">Metric</th>
                <th className="py-2.5 px-3"><Link href={`/models/${modelA.slug}`} className="font-bold text-slate-900 underline">{modelA.name}</Link></th>
                <th className="py-2.5 px-3"><Link href={`/models/${modelB.slug}`} className="font-bold text-slate-900 underline">{modelB.name}</Link></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm font-mono">
              {rows.map((r) => (
                <tr key={r.label} className="hover:bg-slate-50">
                  <td className="py-3 px-3 font-sans font-medium text-slate-700">{r.label}</td>
                  <td className="py-3 px-3 text-slate-900">{r.aVal}</td>
                  <td className="py-3 px-3 text-slate-900">{r.bVal}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="pt-3 border-t border-slate-100 flex flex-wrap gap-2 text-xs">
          <Link href={`/models/${modelA.slug}`} className="rounded-lg border border-slate-300 px-3 py-1.5 font-medium text-slate-800 hover:bg-slate-50">{modelA.name} full page →</Link>
          <Link href={`/models/${modelB.slug}`} className="rounded-lg border border-slate-300 px-3 py-1.5 font-medium text-slate-800 hover:bg-slate-50">{modelB.name} full page →</Link>
          <Link href="/compare" className="rounded-lg bg-slate-900 px-3 py-1.5 font-medium text-white hover:bg-slate-800">Browse all comparisons</Link>
        </div>
      </article>
    </SiteShell>
  );
}
