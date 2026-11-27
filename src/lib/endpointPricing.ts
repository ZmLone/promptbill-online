import type { CatalogHostingEndpoint, ModelEntry } from './catalog';
import {
  calculateModelCost,
  type CalculationInput,
  type CostBreakdown,
  type LLMModel,
} from './pricingEngine';

export type EndpointSelectionMode = 'cheapest' | 'first-party' | 'official';

export interface EndpointQuote {
  index: number;
  endpoint: CatalogHostingEndpoint;
  modelView: LLMModel;
  breakdown: CostBreakdown;
}

export function getEndpointKey(ep: CatalogHostingEndpoint, index: number): string {
  return `${index}::${ep.host}`;
}

export function buildModelForEndpoint(
  model: ModelEntry,
  ep?: CatalogHostingEndpoint
): LLMModel {
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

  return {
    id: model.id,
    slug: model.slug,
    name: model.name,
    provider: model.provider,
    family: model.family,
    inputPer1M: ep.inputPer1M !== null && ep.inputPer1M !== undefined ? ep.inputPer1M : model.inputPer1M,
    cachedInputPer1M:
      ep.cachedInputPer1M !== undefined ? ep.cachedInputPer1M : model.cachedInputPer1M,
    cacheWritePer1M:
      ep.cacheWritePer1M !== undefined ? ep.cacheWritePer1M : model.cacheWritePer1M,
    outputPer1M:
      ep.outputPer1M !== null && ep.outputPer1M !== undefined ? ep.outputPer1M : model.outputPer1M,
    batchDiscount:
      ep.batchDiscount !== undefined ? ep.batchDiscount : model.batchDiscount,
    longContextMultiplierInput: model.longContextMultiplierInput,
    longContextMultiplierOutput: model.longContextMultiplierOutput,
    longContextThresholdTokens: model.longContextThresholdTokens,
    contextWindow: model.contextWindow,
    qualityScore: model.qualityScore,
    score: model.score,
    speedTokensPerSec: model.speedTokensPerSec,
    tokPerSec: model.tokPerSec,
    notes: ep.notes ?? model.notes,
    hostingEndpoints: model.hostingEndpoints,
  };
}

export function evaluateModelEndpoints(
  model: ModelEntry,
  calcInput: CalculationInput
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
                evidenceStatus: model.pricingProvenance.status,
              },
              modelView: fallbackModel,
              breakdown: calculateModelCost(fallbackModel, calcInput),
            };
          })(),
        ]
      : endpoints.map((ep, index) => {
          const modelView = buildModelForEndpoint(model, ep);
          return {
            index,
            endpoint: ep,
            modelView,
            breakdown: calculateModelCost(modelView, calcInput),
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
  mode: EndpointSelectionMode = 'cheapest'
): {
  host: string;
  providerType: string;
  inputPer1M: number | null;
  outputPer1M: number | null;
  cachedInputPer1M: number | null;
  cacheWritePer1M: number | null;
  batchDiscount: number | null;
  monthlyTotalCost: number | null;
  isCheapestThirdParty: boolean;
} {
  const { firstPartyQuote, cheapestQuote } = evaluateModelEndpoints(model, {
    inputTokensPerCall: 6500,
    outputTokensPerCall: 650,
    reasoningTokensPerCall: 0,
    callsPerDay: 2500,
    cacheHitPercent: 0,
    cacheWriteSharePercent: 0,
    batchPercent: 0,
    retriesPercent: 0,
  });

  const chosen =
    mode === 'first-party' || mode === 'official' ? firstPartyQuote : cheapestQuote;

  return {
    host: chosen.endpoint.host,
    providerType: chosen.endpoint.providerType,
    inputPer1M: chosen.modelView.inputPer1M ?? null,
    outputPer1M: chosen.modelView.outputPer1M ?? null,
    cachedInputPer1M: chosen.modelView.cachedInputPer1M ?? null,
    cacheWritePer1M: chosen.modelView.cacheWritePer1M ?? null,
    batchDiscount: chosen.modelView.batchDiscount ?? null,
    monthlyTotalCost:
      typeof chosen.breakdown.monthlyTotalCost === 'number'
        ? chosen.breakdown.monthlyTotalCost
        : null,
    isCheapestThirdParty: chosen.index !== firstPartyQuote.index,
  };
}
