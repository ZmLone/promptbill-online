import type { CatalogHostingEndpoint, ModelEntry } from './catalog';
import { calculateModelCost } from './pricingEngine';

export type EndpointSelectionMode = 'cheapest' | 'first-party' | 'official';

export interface EndpointCalculationInput {
  inputTokensPerCall: number;
  outputTokensPerCall: number;
  reasoningTokensPerCall?: number;
  callsPerDay: number;
  cacheHitPercent: number;
  cacheWriteSharePercent?: number;
  batchPercent: number;
  retriesPercent?: number;
}

export interface EndpointModelView {
  id: string;
  slug: string;
  name: string;
  provider: string;
  family?: string | null;
  inputPer1M: number | null;
  cachedInputPer1M: number | null;
  cacheWritePer1M?: number | null;
  outputPer1M: number | null;
  batchDiscount: number | null;
  longContextMultiplierInput?: number | null;
  longContextMultiplierOutput?: number | null;
  longContextThresholdTokens?: number | null;
  contextWindow?: string | null;
  qualityScore?: number | null;
  score?: number | null;
  speedTokensPerSec?: number | null;
  tokPerSec?: number | null;
  notes?: string | null;
  hostingEndpoints?: CatalogHostingEndpoint[];
}

export type EndpointCostBreakdown = ReturnType<typeof calculateModelCost>;

export interface EndpointQuote {
  index: number;
  endpoint: CatalogHostingEndpoint;
  modelView: EndpointModelView;
  breakdown: EndpointCostBreakdown;
}

export function getEndpointKey(ep: CatalogHostingEndpoint, index: number): string {
  return `${index}::${ep.host}`;
}

export function buildModelForEndpoint(
  model: ModelEntry,
  ep?: CatalogHostingEndpoint
): EndpointModelView {
  if (!ep) {
    return {
      id: model.id,
      slug: model.slug,
      name: model.name,
      provider: model.provider,
      family: model.family,
      inputPer1M: model.inputPer1M,
      cachedInputPer1M: model.cachedInputPer1M,
      cacheWritePer1M: model.cacheWritePer1M,
      outputPer1M: model.outputPer1M,
      batchDiscount: model.batchDiscount,
      longContextMultiplierInput: model.longContextMultiplierInput,
      longContextMultiplierOutput: model.longContextMultiplierOutput,
      longContextThresholdTokens: model.longContextThresholdTokens,
      contextWindow: model.contextWindow,
      qualityScore: model.qualityScore,
      score: model.score,
      speedTokensPerSec: model.speedTokensPerSec,
      tokPerSec: model.tokPerSec,
      notes: model.notes,
      hostingEndpoints: model.hostingEndpoints,
    };
  }

  const epSpeed =
    ep.tokPerSec !== null && ep.tokPerSec !== undefined
      ? ep.tokPerSec
      : model.tokPerSec;

  return {
    id: model.id,
    slug: model.slug,
    name: model.name,
    provider: model.provider,
    family: model.family,
    inputPer1M:
      ep.inputPer1M !== null && ep.inputPer1M !== undefined
        ? ep.inputPer1M
        : model.inputPer1M,
    cachedInputPer1M:
      ep.cachedInputPer1M !== undefined ? ep.cachedInputPer1M : model.cachedInputPer1M,
    cacheWritePer1M:
      ep.cacheWritePer1M !== undefined ? ep.cacheWritePer1M : model.cacheWritePer1M,
    outputPer1M:
      ep.outputPer1M !== null && ep.outputPer1M !== undefined
        ? ep.outputPer1M
        : model.outputPer1M,
    batchDiscount:
      ep.batchDiscount !== undefined ? ep.batchDiscount : model.batchDiscount,
    longContextMultiplierInput: model.longContextMultiplierInput,
    longContextMultiplierOutput: model.longContextMultiplierOutput,
    longContextThresholdTokens: model.longContextThresholdTokens,
    contextWindow: model.contextWindow,
    qualityScore: model.qualityScore,
    score: model.score,
    speedTokensPerSec: epSpeed,
    tokPerSec: epSpeed,
    notes: ep.notes ?? model.notes,
    hostingEndpoints: model.hostingEndpoints,
  };
}

function runModelCost(
  modelView: EndpointModelView,
  calcInput: EndpointCalculationInput
): EndpointCostBreakdown {
  return calculateModelCost(
    modelView as Parameters<typeof calculateModelCost>[0],
    {
      inputTokensPerCall: calcInput.inputTokensPerCall,
      outputTokensPerCall: calcInput.outputTokensPerCall,
      reasoningTokensPerCall: calcInput.reasoningTokensPerCall ?? 0,
      callsPerDay: calcInput.callsPerDay,
      cacheHitPercent: calcInput.cacheHitPercent,
      cacheWriteSharePercent: calcInput.cacheWriteSharePercent ?? 0,
      batchPercent: calcInput.batchPercent,
      retriesPercent: calcInput.retriesPercent ?? 0,
    } as Parameters<typeof calculateModelCost>[1]
  );
}

export function evaluateModelEndpoints(
  model: ModelEntry,
  calcInput: EndpointCalculationInput
): {
  quotes: EndpointQuote[];
  firstPartyIndex: number;
  firstPartyQuote: EndpointQuote;
  cheapestQuote: EndpointQuote;
} {
  const endpoints = Array.isArray(model.hostingEndpoints) ? model.hostingEndpoints : [];
  const firstPartyIdx = (() => {
    const idx = endpoints.findIndex((ep) => ep.providerType === 'Official API');
    return idx >= 0 ? idx : 0;
  })();

  const quotes: EndpointQuote[] =
    endpoints.length === 0
      ? [
          (() => {
            const fallbackModel = buildModelForEndpoint(model);
            return {
              index: 0,
              endpoint: {
                host: `${model.provider} (Default)`,
                providerType: 'Official API' as const,
                inputPer1M: model.inputPer1M,
                cachedInputPer1M: model.cachedInputPer1M,
                cacheWritePer1M: model.cacheWritePer1M,
                outputPer1M: model.outputPer1M,
                batchDiscount: model.batchDiscount,
                tokPerSec: model.tokPerSec,
                evidenceStatus: model.pricingProvenance.status,
              },
              modelView: fallbackModel,
              breakdown: runModelCost(fallbackModel, calcInput),
            };
          })(),
        ]
      : endpoints.map((ep, index) => {
          const modelView = buildModelForEndpoint(model, ep);
          return {
            index,
            endpoint: ep,
            modelView,
            breakdown: runModelCost(modelView, calcInput),
          };
        });

  const firstPartyQuote = quotes.find((q) => q.index === firstPartyIdx) ?? quotes[0];

  const priced = quotes.filter(
    (q) =>
      q.breakdown.hasPricingData &&
      typeof q.breakdown.monthlyTotalCost === 'number' &&
      Number.isFinite(q.breakdown.monthlyTotalCost)
  );

  const cheapestQuote =
    priced.length === 0
      ? firstPartyQuote
      : priced.reduce((best, curr) => {
          const currCost = curr.breakdown.monthlyTotalCost ?? Number.POSITIVE_INFINITY;
          const bestCost = best.breakdown.monthlyTotalCost ?? Number.POSITIVE_INFINITY;
          return currCost < bestCost ? curr : best;
        });

  return {
    quotes,
    firstPartyIndex: firstPartyIdx,
    firstPartyQuote,
    cheapestQuote,
  };
}

export function getEffectiveModelRates(
  model: ModelEntry,
  mode: EndpointSelectionMode = 'cheapest',
  calcOverrides?: Partial<EndpointCalculationInput>
): {
  host: string;
  providerType: string;
  inputPer1M: number | null;
  outputPer1M: number | null;
  cachedInputPer1M: number | null;
  cacheWritePer1M: number | null;
  batchDiscount: number | null;
  tokPerSec: number | null;
  monthlyTotalCost: number | null;
  firstPartyMonthlyCost: number | null;
  savingsPercent: number;
  hasThirdPartyEndpoints: boolean;
  isCheapestThirdParty: boolean;
} {
  const { quotes, firstPartyQuote, cheapestQuote } = evaluateModelEndpoints(model, {
    inputTokensPerCall: calcOverrides?.inputTokensPerCall ?? 6500,
    outputTokensPerCall: calcOverrides?.outputTokensPerCall ?? 650,
    reasoningTokensPerCall: calcOverrides?.reasoningTokensPerCall ?? 0,
    callsPerDay: calcOverrides?.callsPerDay ?? 2500,
    cacheHitPercent: calcOverrides?.cacheHitPercent ?? 0,
    cacheWriteSharePercent: calcOverrides?.cacheWriteSharePercent ?? 0,
    batchPercent: calcOverrides?.batchPercent ?? 0,
    retriesPercent: calcOverrides?.retriesPercent ?? 0,
  });

  const chosen =
    mode === 'first-party' || mode === 'official' ? firstPartyQuote : cheapestQuote;

  const chosenCost =
    typeof chosen.breakdown.monthlyTotalCost === 'number'
      ? chosen.breakdown.monthlyTotalCost
      : null;
  const officialCost =
    typeof firstPartyQuote.breakdown.monthlyTotalCost === 'number'
      ? firstPartyQuote.breakdown.monthlyTotalCost
      : null;

  const savingsPercent =
    chosenCost !== null &&
    officialCost !== null &&
    officialCost > 0 &&
    chosenCost < officialCost - 0.0001
      ? Math.max(1, Math.round(((officialCost - chosenCost) / officialCost) * 100))
      : 0;

  return {
    host: chosen.endpoint.host,
    providerType: chosen.endpoint.providerType,
    inputPer1M: chosen.modelView.inputPer1M ?? null,
    outputPer1M: chosen.modelView.outputPer1M ?? null,
    cachedInputPer1M: chosen.modelView.cachedInputPer1M ?? null,
    cacheWritePer1M: chosen.modelView.cacheWritePer1M ?? null,
    batchDiscount: chosen.modelView.batchDiscount ?? null,
    tokPerSec: chosen.modelView.tokPerSec ?? null,
    monthlyTotalCost: chosenCost,
    firstPartyMonthlyCost: officialCost,
    savingsPercent,
    hasThirdPartyEndpoints: quotes.some((q) => q.endpoint.providerType !== 'Official API'),
    isCheapestThirdParty: chosen.index !== firstPartyQuote.index,
  };
}
