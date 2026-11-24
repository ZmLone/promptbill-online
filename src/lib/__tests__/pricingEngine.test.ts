import assert from 'node:assert/strict';
import { calculateModelCost, type LLMModel } from '../pricingEngine';

const sampleModel: LLMModel = {
  id: 'test-model',
  name: 'Test Model',
  provider: 'TestProvider',
  inputPer1M: 4,
  cachedInputPer1M: 0.4,
  cacheWritePer1M: 5,
  outputPer1M: 20,
  batchDiscount: 0.5,
  longContextMultiplierInput: 2,
  longContextMultiplierOutput: 1.5,
  longContextThresholdTokens: 100_000,
  contextWindow: '200K',
  qualityScore: 80,
};

// 1. No cache, no batch, below long-context threshold (1,000 calls/day * 30 = 30,000 calls/mo)
// Input: 30,000 * 10,000 * $4 / 1M = $1,200; Output: 30,000 * 1,000 * $20 / 1M = $600 -> Total = $1,800
const noCache = calculateModelCost(sampleModel, {
  inputTokensPerCall: 10_000,
  outputTokensPerCall: 1_000,
  callsPerDay: 1_000,
  cacheHitPercent: 0,
  cacheWriteSharePercent: 0,
  batchPercent: 0,
});
assert.equal(noCache.hasPricingData, true);
assert.equal(noCache.monthlyTotalCost, 1800);

// 2. Partial cache hit (50%) + cache write share (20% of remaining 50% = 10% write, 40% standard input)
// Blended input rate = 0.4*4 + 0.1*5 + 0.5*0.4 = 1.6 + 0.5 + 0.2 = 2.3/1M
// Input cost = 30,000 * 10,000 * 2.3 / 1M = $690; Output cost = $600 -> Total = $1,290
const partialCache = calculateModelCost(sampleModel, {
  inputTokensPerCall: 10_000,
  outputTokensPerCall: 1_000,
  callsPerDay: 1_000,
  cacheHitPercent: 50,
  cacheWriteSharePercent: 20,
  batchPercent: 0,
});
assert.equal(partialCache.monthlyTotalCost, 1290);

// 3. Batch enabled (100% at 50% discount) on no-cache baseline -> half of $1,800 = $900
const withBatch = calculateModelCost(sampleModel, {
  inputTokensPerCall: 10_000,
  outputTokensPerCall: 1_000,
  callsPerDay: 1_000,
  cacheHitPercent: 0,
  batchPercent: 100,
});
assert.equal(withBatch.batchSupported, true);
assert.equal(withBatch.monthlyTotalCost, 900);

// 4. Long-context threshold: just below (100,000), at (100,000), and just above (100,001)
const belowOrAtThreshold = calculateModelCost(sampleModel, {
  inputTokensPerCall: 100_000,
  outputTokensPerCall: 0,
  callsPerDay: 100, // 3,000 calls/mo -> 300M tokens = 300 * $4 = $1,200
  cacheHitPercent: 0,
  batchPercent: 0,
});
assert.equal(belowOrAtThreshold.triggersLongContextMultiplier, false);
assert.equal(belowOrAtThreshold.monthlyTotalCost, 1200);

const aboveThreshold = calculateModelCost(sampleModel, {
  inputTokensPerCall: 100_001,
  outputTokensPerCall: 0,
  callsPerDay: 100, // 2x input multiplier -> $8/1M * 300.003M = $2,400.024
  cacheHitPercent: 0,
  batchPercent: 0,
});
assert.equal(aboveThreshold.triggersLongContextMultiplier, true);
assert.equal(aboveThreshold.monthlyTotalCost, 2400.024);

// 5. Missing cacheWritePer1M does NOT invent 1.25x
const noCacheWriteModel: LLMModel = {
  ...sampleModel,
  cacheWritePer1M: null,
  batchDiscount: null,
};
const uncachedWrite = calculateModelCost(noCacheWriteModel, {
  inputTokensPerCall: 10_000,
  outputTokensPerCall: 0,
  callsPerDay: 1_000,
  cacheHitPercent: 0,
  cacheWriteSharePercent: 50,
  batchPercent: 100,
});
assert.equal(uncachedWrite.cacheWriteSupported, false);
assert.equal(uncachedWrite.cacheWriteRatePer1M, null);
assert.equal(uncachedWrite.batchSupported, false);
assert.equal(uncachedWrite.monthlyTotalCost, 1200);

// 6. Zero, negative, NaN, and missing price inputs handled safely
const zeroCalls = calculateModelCost(sampleModel, {
  inputTokensPerCall: 5000,
  outputTokensPerCall: 500,
  callsPerDay: 0,
  cacheHitPercent: 0,
  batchPercent: 0,
});
assert.equal(zeroCalls.monthlyTotalCost, 0);

const invalidInputs = calculateModelCost(sampleModel, {
  inputTokensPerCall: -500,
  outputTokensPerCall: Number.NaN,
  callsPerDay: Number.POSITIVE_INFINITY,
  cacheHitPercent: 150,
  batchPercent: -10,
});
assert.equal(invalidInputs.monthlyTotalCost, 0);

const missingPriceModel: LLMModel = {
  id: 'no-price',
  name: 'No Price Model',
  provider: 'Provider',
  inputPer1M: null,
  cachedInputPer1M: null,
  outputPer1M: null,
};
const missingPriceRes = calculateModelCost(missingPriceModel, {
  inputTokensPerCall: 1000,
  outputTokensPerCall: 500,
  callsPerDay: 100,
  cacheHitPercent: 0,
  batchPercent: 0,
});
assert.equal(missingPriceRes.hasPricingData, false);
assert.equal(missingPriceRes.monthlyTotalCost, null);

console.log('All pricingEngine unit assertions passed.');
