import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ALL_MODELS, getModelBySlug } from '../../../lib/catalog';
import { SiteShell } from '../../../components/SiteShell';
import { ModelDetailCalculator } from '../../../components/ModelDetailCalculator';
import { REGISTRY_SNAPSHOT, computeDerivedMetrics } from '../../../lib/modelRegistry';
import { formatCurrency } from '../../../lib/pricingEngine';
import { getLatencyTier } from '../../../lib/endpointPricing';

export const revalidate = 60;

const BASE_URL = 'https://promptbill.online';

export function generateStaticParams() {
  return ALL_MODELS.map((m) => ({ slug: m.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const model = getModelBySlug(slug);
  if (!model) {
    return {
      title: 'Model Not Found · PromptBill',
      robots: { index: false, follow: false },
    };
  }
  const period = REGISTRY_SNAPSHOT.generatedMonthYear;
  const canonicalUrl = `${BASE_URL}/models/${model.slug}`;
  const priceSummary =
    model.inputPer1M !== null && model.outputPer1M !== null
      ? `${formatCurrency(model.inputPer1M)}/${formatCurrency(model.outputPer1M)} per 1M tokens (${model.pricingProvenance.status})`
      : 'pricing details on PromptBill';
  const scoreSummary =
    model.score !== null
      ? `score ${model.score.toFixed(1)} (${model.benchmarkProvenance.status})`
      : 'benchmark metrics tracked on PromptBill';
  const speedSummary =
    model.tokPerSec !== null ? `, ~${model.tokPerSec} tok/s throughput` : '';
  const title = `${model.name} (${model.provider}) Pricing, Speed & Benchmarks (${period})`;
  const description = `${model.name} by ${model.provider}: ${priceSummary}, context window ${model.contextWindow ?? 'N/A'}${speedSummary}, ${scoreSummary}, and multi-provider latency/cost calculator.`;

  return {
    title,
    description,
    alternates: { canonical: canonicalUrl },
    openGraph: {
      type: 'website',
      url: canonicalUrl,
      siteName: 'PromptBill',
      title,
      description,
    },
    twitter: {
      card: 'summary',
      title,
      description,
    },
  };
}

export default async function ModelDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const model = getModelBySlug(slug);
  if (!model) notFound();

  const period = REGISTRY_SNAPSHOT.generatedMonthYear;
  const derived = computeDerivedMetrics(
    model.score,
    model.inputPer1M,
    model.outputPer1M,
    model.tokPerSec
  );
  const legacyUpgrade = REGISTRY_SNAPSHOT.legacyUpgrades[model.slug];
  const isVerifiedPricing = model.pricingProvenance.status === 'Verified';
  const pricingHeadingLabel = isVerifiedPricing
    ? 'Verified Provider Rate Snapshot'
    : 'Estimated Rate Snapshot (Unverified)';

  const officialEndpoint =
    model.hostingEndpoints.find((ep) => ep.providerType === 'Official API') ??
    model.hostingEndpoints[0];

  const fastestEndpoint = [...model.hostingEndpoints]
    .filter((ep) => typeof ep.tokPerSec === 'number' && ep.tokPerSec > 0)
    .sort((a, b) => (b.tokPerSec ?? 0) - (a.tokPerSec ?? 0))[0];

  const lowestLatencyEndpoint = [...model.hostingEndpoints]
    .filter((ep) => typeof ep.latencyMs === 'number' && ep.latencyMs > 0)
    .sort((a, b) => (a.latencyMs ?? Infinity) - (b.latencyMs ?? Infinity))[0];

  const cheapestEndpoint = [...model.hostingEndpoints]
    .filter((ep) => typeof ep.outputPer1M === 'number' && ep.outputPer1M >= 0)
    .sort((a, b) => (a.outputPer1M ?? Infinity) - (b.outputPer1M ?? Infinity))[0];

  const pageUrl = `${BASE_URL}/models/${model.slug}`;
  const dateModified =
    model.pricingProvenance.lastVerified ||
    model.benchmarkProvenance.lastVerified ||
    undefined;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: 'Home',
            item: `${BASE_URL}/`,
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: 'Models',
            item: `${BASE_URL}/models`,
          },
          {
            '@type': 'ListItem',
            position: 3,
            name: model.provider,
            item: `${BASE_URL}/providers/${model.providerSlug}`,
          },
          {
            '@type': 'ListItem',
            position: 4,
            name: model.name,
            item: pageUrl,
          },
        ],
      },
      {
        '@type': 'SoftwareApplication',
        name: model.name,
        applicationCategory: 'AI Model / LLM API',
        operatingSystem: 'Cloud API',
        url: pageUrl,
        ...(dateModified ? { dateModified } : {}),
        creator: {
          '@type': 'Organization',
          name: model.provider,
        },
        ...(model.score !== null
          ? {
              aggregateRating: {
                '@type': 'AggregateRating',
                ratingValue: Number(model.score.toFixed(1)),
                bestRating: 100,
                worstRating: 0,
                ratingCount: 1,
              },
            }
          : {}),
        ...(model.inputPer1M !== null || model.outputPer1M !== null
          ? {
              offers:
                model.hostingEndpoints.length > 0
                  ? model.hostingEndpoints.map((ep) => ({
                      '@type': 'Offer',
                      seller: { '@type': 'Organization', name: ep.host },
                      priceCurrency: 'USD',
                      price:
                        ep.inputPer1M !== null && ep.outputPer1M !== null
                          ? Number(((ep.inputPer1M + ep.outputPer1M) / 2).toFixed(4))
                          : Number((ep.inputPer1M ?? ep.outputPer1M ?? 0).toFixed(4)),
                      description: `${ep.host} (${ep.providerType}): Input ${formatCurrency(ep.inputPer1M)} / Output ${formatCurrency(ep.outputPer1M)} per 1M tokens${ep.latencyMs ? `, ~${ep.latencyMs}ms TTFT` : ''}${ep.tokPerSec ? `, ~${ep.tokPerSec} tok/s` : ''}`,
                    }))
                  : {
                      '@type': 'Offer',
                      priceCurrency: 'USD',
                      price:
                        model.inputPer1M !== null && model.outputPer1M !== null
                          ? Number(((model.inputPer1M + model.outputPer1M) / 2).toFixed(4))
                          : Number((model.inputPer1M ?? model.outputPer1M ?? 0).toFixed(4)),
                      description: `Input ${formatCurrency(model.inputPer1M)} / Output ${formatCurrency(model.outputPer1M)} per 1M tokens (${model.pricingProvenance.status})`,
                    },
            }
          : {}),
      },
      {
        '@type': 'FAQPage',
        mainEntity: [
          {
            '@type': 'Question',
            name: `How much does ${model.name} cost per 1M tokens?`,
            acceptedAnswer: {
              '@type': 'Answer',
              text: `${model.name} (${model.provider}) lists official input at ${formatCurrency(model.inputPer1M)} per 1M tokens and output at ${formatCurrency(model.outputPer1M)} per 1M tokens (${model.pricingProvenance.status} pricing status; cached read ${formatCurrency(model.cachedInputPer1M)}/1M).${cheapestEndpoint && cheapestEndpoint.outputPer1M !== null ? ` Lowest tracked endpoint is ${cheapestEndpoint.host} at ${formatCurrency(cheapestEndpoint.inputPer1M)}/${formatCurrency(cheapestEndpoint.outputPer1M)} per 1M tokens.` : ''}`,
            },
          },
          {
            '@type': 'Question',
            name: `What is the latency, throughput, and benchmark score for ${model.name}?`,
            acceptedAnswer: {
              '@type': 'Answer',
              text: `${model.name} has a context window of ${model.contextWindow ?? 'N/A'}, a benchmark score of ${model.score !== null ? model.score.toFixed(1) : 'N/A'} (${model.benchmarkProvenance.status}), official throughput of ${model.tokPerSec !== null ? `~${model.tokPerSec} tok/s` : 'N/A'}, and official TTFT latency of ${typeof officialEndpoint?.latencyMs === 'number' ? `~${officialEndpoint.latencyMs}ms` : 'N/A'}.`,
            },
          },
        ],
      },
    ],
  };

  return (
    <SiteShell
      title={`${model.name} Pricing, Speed & Benchmarks (${period})`}
      subtitle={`promptbill.online/models/${model.slug} · ${model.provider}${model.licenseLabel ? ` · ${model.licenseLabel}` : ''}`}
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <article className="rounded-xl border border-slate-200 bg-white p-4 sm:p-6 space-y-6">
        {legacyUpgrade && (
          <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-xs sm:text-sm text-amber-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <span className="inline-block rounded bg-amber-900 px-2 py-0.5 text-[11px] font-bold text-white">
                {legacyUpgrade.status}
              </span>
              <p className="font-medium leading-relaxed">
                <strong>Note:</strong> {legacyUpgrade.summary}
              </p>
            </div>
            <Link
              href={`/models/${legacyUpgrade.successorSlug}`}
              className="inline-flex min-h-[40px] shrink-0 items-center justify-center rounded-lg bg-slate-900 px-3.5 py-2 text-xs font-semibold text-white hover:bg-slate-800"
            >
              View {legacyUpgrade.successorName} -&gt;
            </Link>
          </div>
        )}

        <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 text-xs sm:text-sm text-slate-800 leading-relaxed space-y-2">
          <p>
            <strong>{model.name}</strong> ({model.provider}) · Score:{' '}
            <strong>{model.score !== null ? model.score.toFixed(1) : 'N/A'}</strong> (
            {model.benchmarkProvenance.status}) · Value:{' '}
            <strong>
              {derived.valueRatio !== null ? `${derived.valueRatio} Score/$` : 'N/A'}
            </strong>{' '}
            · Blended:{' '}
            <strong>
              {derived.blendedPricePer1M !== null
                ? `${formatCurrency(derived.blendedPricePer1M)}/1M`
                : 'N/A'}
            </strong>{' '}
            · Context: <strong>{model.contextWindow ?? 'N/A'}</strong> · Speed:{' '}
            <strong>
              {model.tokPerSec !== null ? `~${model.tokPerSec} tok/s` : 'N/A'}
            </strong>
            {typeof officialEndpoint?.latencyMs === 'number' ? (
              <>
                {' '}
                · Official TTFT: <strong>~{officialEndpoint.latencyMs}ms</strong>
              </>
            ) : null}{' '}
            ({model.speedProvenance.status}).
          </p>
          <p className="text-xs text-slate-700">
            <strong>{pricingHeadingLabel}:</strong> Input{' '}
            <span className="font-mono font-semibold text-slate-900">
              {formatCurrency(model.inputPer1M)}/1M
            </span>
            , Output{' '}
            <span className="font-mono font-semibold text-slate-900">
              {formatCurrency(model.outputPer1M)}/1M
            </span>
            , Cached Read{' '}
            <span className="font-mono font-semibold text-slate-900">
              {formatCurrency(model.cachedInputPer1M)}/1M
            </span>
            , Cache Write{' '}
            <span className="font-mono font-semibold text-slate-900">
              {formatCurrency(model.cacheWritePer1M)}/1M
            </span>{' '}
            (Status: {model.pricingProvenance.status}; verified date:{' '}
            {model.pricingProvenance.lastVerified ?? 'Not recorded'}).
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3.5">
            <div className="text-xs text-slate-700">Benchmark Score</div>
            <div className="mt-1 font-mono text-xl font-bold text-slate-900">
              {model.score !== null ? model.score.toFixed(1) : 'N/A'}
            </div>
            <div className="text-xs text-slate-700">
              Status: {model.benchmarkProvenance.status} · Elo: {model.elo ?? 'N/A'}
            </div>
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3.5">
            <div className="text-xs text-slate-700">
              {isVerifiedPricing ? 'Verified Price (In / Out)' : 'Estimated Price (In / Out)'}
            </div>
            <div className="mt-1 font-mono text-xl font-bold text-slate-900">
              {model.inputPer1M !== null && model.outputPer1M !== null
                ? `$${model.inputPer1M.toFixed(2)} / $${model.outputPer1M.toFixed(2)}`
                : 'N/A'}
            </div>
            <div className="text-xs text-slate-700">
              Cached Read: {formatCurrency(model.cachedInputPer1M)}/1M
            </div>
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3.5">
            <div className="text-xs text-slate-700">Latency &amp; Throughput</div>
            <div className="mt-1 font-mono text-xl font-bold text-slate-900">
              {typeof officialEndpoint?.latencyMs === 'number'
                ? `<${officialEndpoint.latencyMs}ms`
                : model.tokPerSec !== null
                ? `~${model.tokPerSec} tok/s`
                : 'N/A'}
              {typeof officialEndpoint?.latencyMs === 'number' && model.tokPerSec !== null
                ? ` · ~${model.tokPerSec} tok/s`
                : ''}
            </div>
            <div className="text-xs text-slate-800 font-mono">
              Context: {model.contextWindow ?? 'N/A'} · Max Out: {model.maxOutputTokens ?? 'N/A'}
            </div>
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3.5">
            <div className="text-xs text-slate-700">Rate Limits &amp; Batch</div>
            <div className="mt-1 font-mono text-sm font-bold text-slate-900">
              {model.rpmLimit ?? 'N/A'}
            </div>
            <div className="text-xs text-slate-700 font-mono">
              Batch:{' '}
              {model.batchDiscount !== null
                ? `${Math.round(model.batchDiscount * 100)}%`
                : 'N/A'}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 text-center font-mono text-xs">
          {[
            ['AG (Agentic)', model.ag],
            ['CO (Coding)', model.co],
            ['RE (Reasoning)', model.re],
            ['MM (Multimodal)', model.mm],
            ['KN (Knowledge)', model.kn],
            ['ML (Multilingual)', model.ml],
            ['IF (Instruction)', model.if],
            ['MA (Math)', model.ma],
          ].map(([k, v]) => (
            <div key={String(k)} className="rounded-lg border border-slate-200 p-2.5 bg-white">
              <div className="text-[11px] font-sans text-slate-700">{k}</div>
              <div className="text-base font-bold text-slate-900 mt-0.5">
                {typeof v === 'number' ? v : 'N/A'}
              </div>
            </div>
          ))}
        </div>

        {model.hostingEndpoints.length > 0 && (
          <section aria-labelledby="endpoints-table-heading" className="space-y-2.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 id="endpoints-table-heading" className="text-base font-bold text-slate-900">
                  Provider Endpoints: Latency, Throughput &amp; Token Cost
                </h2>
                <p className="text-xs text-slate-600">
                  Side-by-side comparison of official API, inference clouds, and routers for {model.name}.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-semibold">
                {lowestLatencyEndpoint && typeof lowestLatencyEndpoint.latencyMs === 'number' && (
                  <span className="rounded-full bg-sky-50 px-2.5 py-1 text-sky-900 ring-1 ring-sky-200">
                    Lowest TTFT: {lowestLatencyEndpoint.host} (&lt;{lowestLatencyEndpoint.latencyMs}ms)
                  </span>
                )}
                {fastestEndpoint && typeof fastestEndpoint.tokPerSec === 'number' && (
                  <span className="rounded-full bg-teal-50 px-2.5 py-1 text-teal-900 ring-1 ring-teal-200">
                    Fastest: {fastestEndpoint.host} (~{fastestEndpoint.tokPerSec} tok/s)
                  </span>
                )}
              </div>
            </div>

            <div className="overflow-x-auto rounded-lg border border-slate-200">
              <table className="w-full text-left border-collapse text-xs sm:text-sm">
                <caption className="sr-only">
                  Endpoints, latency, throughput, and pricing entries for {model.name}
                </caption>
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-100/90 text-xs font-semibold text-slate-800">
                    <th scope="col" className="py-2.5 px-3">Endpoint</th>
                    <th scope="col" className="py-2.5 px-3">Type</th>
                    <th scope="col" className="py-2.5 px-3">Latency (TTFT)</th>
                    <th scope="col" className="py-2.5 px-3">Throughput</th>
                    <th scope="col" className="py-2.5 px-3">In / Out ($/1M)</th>
                    <th scope="col" className="py-2.5 px-3">Cached / Batch</th>
                    <th scope="col" className="py-2.5 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/80">
                  {model.hostingEndpoints.map((ep, i) => {
                    const effectiveTps = ep.tokPerSec ?? model.tokPerSec;
                    const latTier = getLatencyTier(ep.latencyMs);
                    const isFastest =
                      fastestEndpoint &&
                      fastestEndpoint.host === ep.host &&
                      typeof ep.tokPerSec === 'number';
                    const isCheapest =
                      cheapestEndpoint &&
                      cheapestEndpoint.host === ep.host &&
                      typeof ep.outputPer1M === 'number';

                    return (
                      <tr
                        key={`${ep.host}-${i}`}
                        className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'}
                      >
                        <th scope="row" className="py-2.5 px-3 font-semibold text-slate-900 text-left">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span>{ep.host}</span>
                            {isCheapest && (
                              <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-900">
                                Lowest Cost
                              </span>
                            )}
                            {isFastest && (
                              <span className="rounded bg-teal-100 px-1.5 py-0.5 text-[10px] font-bold text-teal-900">
                                Fastest
                              </span>
                            )}
                          </div>
                          {ep.notes && (
                            <div className="text-[11px] font-normal text-slate-500 mt-0.5">
                              {ep.notes}
                            </div>
                          )}
                        </th>
                        <td className="py-2.5 px-3 text-slate-700 whitespace-nowrap">
                          {ep.providerType ?? 'N/A'}
                        </td>
                        <td className="py-2.5 px-3 font-mono whitespace-nowrap">
                          {typeof ep.latencyMs === 'number' ? (
                            <div className="flex flex-col">
                              <span className="font-semibold text-slate-900">
                                &lt;{ep.latencyMs}ms
                              </span>
                              {latTier && (
                                <span
                                  className={`text-[10px] font-sans font-semibold ${
                                    latTier === 'Ultra-Low (<120ms)'
                                      ? 'text-emerald-700'
                                      : latTier === 'Fast (<175ms)'
                                      ? 'text-sky-700'
                                      : 'text-slate-500'
                                  }`}
                                >
                                  {latTier}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-500">N/A</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 font-mono font-semibold text-teal-800 whitespace-nowrap">
                          {typeof effectiveTps === 'number' ? `~${effectiveTps} tok/s` : 'N/A'}
                        </td>
                        <td className="py-2.5 px-3 font-mono font-semibold text-slate-900 whitespace-nowrap">
                          {ep.inputPer1M !== null && ep.outputPer1M !== null
                            ? `$${ep.inputPer1M.toFixed(2)} / $${ep.outputPer1M.toFixed(2)}`
                            : 'N/A'}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-xs text-slate-700 whitespace-nowrap">
                          <div>
                            Cache:{' '}
                            {ep.cachedInputPer1M !== null
                              ? formatCurrency(ep.cachedInputPer1M)
                              : '—'}
                          </div>
                          <div>
                            Batch:{' '}
                            {typeof ep.batchDiscount === 'number' && ep.batchDiscount > 0
                              ? `${Math.round(ep.batchDiscount * 100)}% off`
                              : '—'}
                          </div>
                        </td>
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          <span
                            className={`inline-block rounded px-2 py-0.5 text-[11px] font-semibold ${
                              ep.evidenceStatus === 'Verified'
                                ? 'bg-emerald-50 text-emerald-800'
                                : 'bg-amber-50 text-amber-800'
                            }`}
                          >
                            {ep.evidenceStatus ?? 'N/A'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        )}

        <ModelDetailCalculator model={model} />

        <div className="flex flex-wrap items-center gap-4 text-xs font-semibold">
          <Link
            href="/compare"
            className="inline-flex min-h-[36px] items-center text-emerald-800 underline"
          >
            Compare models -&gt;
          </Link>
          <Link
            href={`/providers/${model.providerSlug}`}
            className="inline-flex min-h-[36px] items-center text-slate-800 underline"
          >
            More {model.provider} models -&gt;
          </Link>
        </div>
      </article>
    </SiteShell>
  );
}
