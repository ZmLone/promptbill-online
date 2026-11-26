import fs from 'node:fs';

const LOCAL_MODELS_PATH = 'src/data/models.json';
const PENDING_QUEUE_PATH = 'src/data/pending-registry.json';
const OPENROUTER_URL = 'https://openrouter.ai/api/v1/models';
const BENCHMARK_FEED_URL = process.env.BENCHMARK_FEED_URL || '';
const REPORT_PATH = process.env.REGISTRY_SYNC_REPORT_PATH || '/tmp/registry-sync-report.md';
const NEW_MODELS_FLAG_PATH = process.env.REGISTRY_NEW_MODELS_FLAG_PATH || '/tmp/has-new-models.txt';

const MAJOR_PREFIXES = [
  'anthropic/',
  'openai/',
  'google/',
  'deepseek/',
  'qwen/',
  'x-ai/',
  'meta-llama/',
  'mistralai/',
  'cohere/',
  'moonshotai/',
];

const IGNORED_VARIANT_SUFFIXES = [
  ':batch',
  ':free',
  ':extended',
  ':thinking',
  ':beta',
  ':exacto',
  ':nitro',
  ':floor',
  ':online',
];

function normalizeKey(raw) {
  return String(raw || '')
    .toLowerCase()
    .replace(/^[^/]+\//, '')
    .replace(/:[^:]+$/, '')
    .replace(/[._\s]+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function inferProviderDisplay(remoteId) {
  const prefix = (String(remoteId).split('/')[0] || '').toLowerCase();
  const map = {
    anthropic: 'Anthropic',
    openai: 'OpenAI',
    google: 'Google Gemini',
    deepseek: 'DeepSeek',
    qwen: 'Qwen',
    'x-ai': 'xAI',
    'meta-llama': 'Meta',
    mistralai: 'Mistral',
    cohere: 'Cohere',
    moonshotai: 'Moonshot AI',
  };
  return map[prefix] || (prefix || null);
}

function cleanDisplayName(rawName) {
  return String(rawName || '')
    .replace(/^[A-Za-z0-9\s.-]+:\s*/, '')
    .trim();
}

function parseFiniteNonNeg(val) {
  if (val === null || val === undefined || val === '') return null;
  const num = Number(val);
  if (!Number.isFinite(num) || num < 0) return null;
  return num;
}

function formatContextWindowOrNull(ctxLen) {
  const num = parseFiniteNonNeg(ctxLen);
  if (num === null || num <= 0) return null;
  if (num >= 1_000_000) {
    const m = num / 1_000_000;
    return Number.isInteger(m) ? `${m}M` : `${m.toFixed(1)}M`;
  }
  return `${Math.round(num / 1000)}K`;
}

function writeReport(reportLines, hasPendingChanges) {
  try {
    fs.writeFileSync(REPORT_PATH, reportLines.join('\n') + '\n', 'utf8');
    fs.writeFileSync(NEW_MODELS_FLAG_PATH, hasPendingChanges ? 'true' : 'false', 'utf8');
  } catch {
    // Ignore non-writable temporary path in restricted environments
  }
}

function readExistingQueue() {
  try {
    if (!fs.existsSync(PENDING_QUEUE_PATH)) {
      return { updatedAt: null, items: [] };
    }
    const parsed = JSON.parse(fs.readFileSync(PENDING_QUEUE_PATH, 'utf8'));
    if (parsed && Array.isArray(parsed.items)) {
      return parsed;
    }
  } catch {
    // Fall back to empty queue if malformed
  }
  return { updatedAt: null, items: [] };
}

async function run() {
  const summary = {
    stagedNewModels: [],
    stagedPriceUpdates: [],
    stagedBenchmarkUpdates: [],
    unchanged: [],
    rejected: [],
    failed: [],
  };

  let localModels;
  try {
    const parsed = JSON.parse(fs.readFileSync(LOCAL_MODELS_PATH, 'utf8'));
    if (!Array.isArray(parsed)) {
      throw new Error('src/data/models.json must contain a JSON array');
    }
    localModels = parsed;
  } catch (err) {
    summary.failed.push(`Failed to read local catalog: ${err instanceof Error ? err.message : String(err)}`);
    console.error(summary.failed[0]);
    process.exit(1);
  }

  let remoteModels = [];
  try {
    const res = await fetch(OPENROUTER_URL);
    if (!res.ok) {
      throw new Error(`OpenRouter HTTP ${res.status}`);
    }
    const payload = await res.json();
    if (!payload || !Array.isArray(payload.data)) {
      throw new Error('Malformed OpenRouter response: missing data array');
    }
    remoteModels = payload.data;
  } catch (err) {
    const msg = `Upstream OpenRouter check failed (preserving existing catalog and queue): ${
      err instanceof Error ? err.message : String(err)
    }`;
    summary.failed.push(msg);
    writeReport(
      [
        '## LLM Registry Sync Report (Upstream Unavailable)',
        '',
        `- Status: Failed safely; neither \`${LOCAL_MODELS_PATH}\` nor \`${PENDING_QUEUE_PATH}\` was overwritten.`,
        `- Error: ${msg}`,
      ],
      false
    );
    console.error(msg);
    process.exit(1);
  }

  let remoteBenchmarks = [];
  if (BENCHMARK_FEED_URL) {
    try {
      const bRes = await fetch(BENCHMARK_FEED_URL);
      if (bRes.ok) {
        const bPayload = await bRes.json();
        remoteBenchmarks = Array.isArray(bPayload) ? bPayload : Array.isArray(bPayload?.data) ? bPayload.data : [];
      }
    } catch {
      // Optional benchmark feed failure should not block OpenRouter pricing/model discovery
    }
  }

  const benchmarkByKey = new Map();
  for (const bm of remoteBenchmarks) {
    if (!bm) continue;
    for (const rawKey of [bm.id, bm.slug, bm.name]) {
      const k = normalizeKey(rawKey);
      if (k && !benchmarkByKey.has(k)) benchmarkByKey.set(k, bm);
    }
  }

  const remoteByNormKey = new Map();
  for (const rm of remoteModels) {
    if (!rm || typeof rm.id !== 'string' || rm.id.trim().length === 0) {
      summary.rejected.push('Remote record missing valid string id');
      continue;
    }
    const lowerId = rm.id.toLowerCase();
    if (IGNORED_VARIANT_SUFFIXES.some((sfx) => lowerId.endsWith(sfx))) continue;

    const promptRate = parseFiniteNonNeg(rm.pricing?.prompt);
    const completionRate = parseFiniteNonNeg(rm.pricing?.completion);
    if (promptRate === null || completionRate === null) {
      summary.rejected.push(`Rejected ${rm.id}: non-finite or negative pricing`);
      continue;
    }

    const normId = normalizeKey(rm.id);
    const normName = normalizeKey(cleanDisplayName(rm.name));
    if (normId && !remoteByNormKey.has(normId)) remoteByNormKey.set(normId, rm);
    if (normName && !remoteByNormKey.has(normName)) remoteByNormKey.set(normName, rm);
  }

  const checkedAtIso = new Date().toISOString();
  const existingQueue = readExistingQueue();
  const nextQueueItems = [];

  const knownModelKeys = new Set();
  for (const m of localModels) {
    knownModelKeys.add(normalizeKey(m.id));
    knownModelKeys.add(normalizeKey(m.slug));
    knownModelKeys.add(normalizeKey(m.name));
  }

  const refreshedQueueIds = new Set();

  for (const model of localModels) {
    if (!model || typeof model.id !== 'string' || !model.id.trim()) {
      summary.rejected.push('Local record missing valid id');
      continue;
    }

    const match =
      remoteByNormKey.get(normalizeKey(model.id)) ||
      remoteByNormKey.get(normalizeKey(model.slug)) ||
      remoteByNormKey.get(normalizeKey(model.name));

    let hasAnyChangeForModel = false;

    if (match && match.pricing) {
      const remoteIn = Number((Number(match.pricing.prompt) * 1_000_000).toFixed(4));
      const remoteOut = Number((Number(match.pricing.completion) * 1_000_000).toFixed(4));
      if (Number.isFinite(remoteIn) && Number.isFinite(remoteOut) && remoteIn >= 0 && remoteOut >= 0) {
        const endpoints = Array.isArray(model.hostingEndpoints) ? model.hostingEndpoints : [];
        const prevRouter = endpoints.find(
          (ep) => ep && (ep.providerType === 'Router' || /openrouter/i.test(String(ep.host || '')))
        );
        const prevIn = prevRouter ? parseFiniteNonNeg(prevRouter.inputPer1M) : null;
        const prevOut = prevRouter ? parseFiniteNonNeg(prevRouter.outputPer1M) : null;

        const priceChanged =
          prevIn === null ||
          prevOut === null ||
          Math.abs(remoteIn - prevIn) > 0.01 ||
          Math.abs(remoteOut - prevOut) > 0.01;

        if (priceChanged) {
          const queueId = `price:${model.slug || model.id}`;
          refreshedQueueIds.add(queueId);
          nextQueueItems.push({
            queueId,
            type: 'price_update',
            detectedAt: checkedAtIso,
            modelId: model.id,
            modelSlug: model.slug || model.id,
            modelName: model.name,
            provider: model.provider,
            sourceUrl: OPENROUTER_URL,
            summary: `OpenRouter price: $${prevIn ?? 'N/A'}/$${prevOut ?? 'N/A'} -> $${remoteIn}/$${remoteOut} per 1M`,
            currentValues: {
              routerInputPer1M: prevIn,
              routerOutputPer1M: prevOut,
              officialInputPer1M: model.inputPer1M ?? null,
              officialOutputPer1M: model.outputPer1M ?? null,
            },
            proposedValues: {
              routerInputPer1M: remoteIn,
              routerOutputPer1M: remoteOut,
              remoteModelId: match.id,
              lastVerified: checkedAtIso,
            },
          });
          summary.stagedPriceUpdates.push(
            `${model.name}: $${prevIn ?? 'N/A'}/$${prevOut ?? 'N/A'} -> $${remoteIn}/$${remoteOut} per 1M`
          );
          hasAnyChangeForModel = true;
        }
      }
    }

    const bmMatch =
      benchmarkByKey.get(normalizeKey(model.id)) ||
      benchmarkByKey.get(normalizeKey(model.slug)) ||
      benchmarkByKey.get(normalizeKey(model.name));

    if (bmMatch) {
      const nextScore = parseFiniteNonNeg(bmMatch.score ?? bmMatch.qualityScore);
      const nextSpeed = parseFiniteNonNeg(bmMatch.tokPerSec ?? bmMatch.speedTokensPerSec);
      const scoreChanged = nextScore !== null && nextScore !== model.score;
      const speedChanged = nextSpeed !== null && nextSpeed !== model.tokPerSec;

      if (scoreChanged || speedChanged) {
        const queueId = `benchmark:${model.slug || model.id}`;
        refreshedQueueIds.add(queueId);
        nextQueueItems.push({
          queueId,
          type: 'benchmark_update',
          detectedAt: checkedAtIso,
          modelId: model.id,
          modelSlug: model.slug || model.id,
          modelName: model.name,
          provider: model.provider,
          sourceUrl: bmMatch.sourceUrl || BENCHMARK_FEED_URL,
          summary: `Score: ${model.score ?? 'N/A'} -> ${nextScore ?? model.score ?? 'N/A'}, Speed: ${model.tokPerSec ?? 'N/A'} -> ${nextSpeed ?? model.tokPerSec ?? 'N/A'} tok/s`,
          currentValues: {
            score: model.score ?? null,
            tokPerSec: model.tokPerSec ?? null,
          },
          proposedValues: {
            score: nextScore ?? model.score ?? null,
            tokPerSec: nextSpeed ?? model.tokPerSec ?? null,
            lastVerified: checkedAtIso,
          },
        });
        summary.stagedBenchmarkUpdates.push(
          `${model.name}: score ${model.score ?? 'N/A'} -> ${nextScore ?? model.score ?? 'N/A'}`
        );
        hasAnyChangeForModel = true;
      }
    }

    if (!hasAnyChangeForModel) {
      summary.unchanged.push(model.id);
    }
  }

  const seenNewNormKeys = new Set();
  for (const rm of remoteModels) {
    if (!rm || typeof rm.id !== 'string' || typeof rm.name !== 'string') continue;
    const lowerId = rm.id.toLowerCase();
    if (!MAJOR_PREFIXES.some((prefix) => lowerId.startsWith(prefix))) continue;
    if (IGNORED_VARIANT_SUFFIXES.some((sfx) => lowerId.endsWith(sfx))) continue;

    const normId = normalizeKey(rm.id);
    const cleanName = cleanDisplayName(rm.name);
    const normName = normalizeKey(cleanName);
    if (!normId || !cleanName) continue;
    if (knownModelKeys.has(normId) || knownModelKeys.has(normName)) continue;
    if (seenNewNormKeys.has(normId)) continue;

    seenNewNormKeys.add(normId);
    const provider = inferProviderDisplay(rm.id);
    if (!provider) {
      summary.rejected.push(`Rejected new model ${rm.id}: unable to verify provider`);
      continue;
    }

    const pIn = parseFiniteNonNeg(rm.pricing?.prompt);
    const pOut = parseFiniteNonNeg(rm.pricing?.completion);
    const routerIn = pIn !== null ? Number((pIn * 1_000_000).toFixed(4)) : null;
    const routerOut = pOut !== null ? Number((pOut * 1_000_000).toFixed(4)) : null;
    const ctxStr = formatContextWindowOrNull(rm.context_length);

    const bmMatch = benchmarkByKey.get(normId) || benchmarkByKey.get(normName);
    const bmScore = bmMatch ? parseFiniteNonNeg(bmMatch.score ?? bmMatch.qualityScore) : null;
    const bmSpeed = bmMatch ? parseFiniteNonNeg(bmMatch.tokPerSec ?? bmMatch.speedTokensPerSec) : null;

    const draftModel = {
      id: normId,
      slug: normId,
      rank: null,
      name: cleanName,
      provider,
      providerSlug: normalizeKey(provider),
      family: null,
      license: null,
      evidence: 'Estimated',
      score: bmScore,
      qualityScore: bmScore,
      interval: null,
      elo: null,
      inputPer1M: routerIn,
      cachedInputPer1M: null,
      cacheWritePer1M: null,
      outputPer1M: routerOut,
      longContextMultiplierInput: null,
      longContextMultiplierOutput: null,
      longContextThresholdTokens: null,
      contextWindow: ctxStr,
      maxOutputTokens: null,
      tokPerSec: bmSpeed,
      speedTokensPerSec: bmSpeed,
      ag: null,
      co: null,
      re: null,
      mm: null,
      kn: null,
      ml: null,
      if: null,
      ma: null,
      rpmLimit: null,
      tpmLimit: null,
      tpdLimit: null,
      batchDiscount: null,
      tier: null,
      bestFor: null,
      notes: `Discovered via OpenRouter (${rm.id}); review official API pricing and benchmarks before publishing.`,
      pricingProvenance: {
        status: routerIn !== null && routerOut !== null ? 'Estimated' : 'Unavailable',
        sourceUrl: OPENROUTER_URL,
        lastVerified: checkedAtIso,
        currency: 'USD',
        pricingUnit: 'per 1M tokens',
        notes: 'Initial rate imported from OpenRouter; verify direct provider API pricing.',
      },
      benchmarkProvenance: {
        status: bmScore !== null ? 'Estimated' : 'Unavailable',
        sourceUrl: bmMatch?.sourceUrl || null,
        lastVerified: bmScore !== null ? checkedAtIso : null,
        notes: bmScore !== null ? 'Imported from benchmark feed; review before publishing.' : 'No benchmark score measured or recorded.',
      },
      speedProvenance: {
        status: bmSpeed !== null ? 'Estimated' : 'Unavailable',
        sourceUrl: bmMatch?.sourceUrl || null,
        lastVerified: bmSpeed !== null ? checkedAtIso : null,
        hardwareOrProvider: null,
        conditions: null,
        notes: bmSpeed !== null ? 'Imported from benchmark feed; review before publishing.' : 'No speed measurement recorded.',
      },
      priceHistory: [],
      hostingEndpoints:
        routerIn !== null && routerOut !== null
          ? [
              {
                host: 'OpenRouter',
                providerType: 'Router',
                inputPer1M: routerIn,
                cachedInputPer1M: null,
                cacheWritePer1M: null,
                outputPer1M: routerOut,
                batchDiscount: null,
                latencyMs: null,
                notes: `Router listing from OpenRouter (${rm.id})`,
                currency: 'USD',
                pricingUnit: 'per 1M tokens',
                sourceUrl: OPENROUTER_URL,
                lastVerified: checkedAtIso,
                evidenceStatus: 'Verified',
              },
            ]
          : [],
    };

    const queueId = `new:${normId}`;
    refreshedQueueIds.add(queueId);
    nextQueueItems.push({
      queueId,
      type: 'new_model',
      detectedAt: checkedAtIso,
      modelId: normId,
      modelSlug: normId,
      modelName: cleanName,
      provider,
      sourceUrl: OPENROUTER_URL,
      summary: `New model (${rm.id}) · Router $${routerIn ?? 'N/A'}/$${routerOut ?? 'N/A'} per 1M · Context ${ctxStr ?? 'N/A'}`,
      draftModel,
    });
    summary.stagedNewModels.push(`${cleanName} (${rm.id})`);
    if (summary.stagedNewModels.length >= 20) break;
  }

  for (const oldItem of existingQueue.items) {
    if (!oldItem || !oldItem.queueId || refreshedQueueIds.has(oldItem.queueId)) continue;
    if (oldItem.type === 'new_model' && knownModelKeys.has(normalizeKey(oldItem.modelSlug || oldItem.modelId))) {
      continue;
    }
    nextQueueItems.push(oldItem);
  }

  const nextQueuePayload = {
    updatedAt: checkedAtIso,
    items: nextQueueItems,
  };

  const prevSerialized = JSON.stringify(existingQueue, null, 2) + '\n';
  const nextSerialized = JSON.stringify(nextQueuePayload, null, 2) + '\n';
  if (prevSerialized !== nextSerialized) {
    fs.writeFileSync(PENDING_QUEUE_PATH, nextSerialized, 'utf8');
  }

  const totalStagedNow =
    summary.stagedNewModels.length +
    summary.stagedPriceUpdates.length +
    summary.stagedBenchmarkUpdates.length;

  const reportLines = [
    `## LLM Registry Staging Report (${checkedAtIso})`,
    '',
    `- **Staged new models:** ${summary.stagedNewModels.length}`,
    `- **Staged price updates:** ${summary.stagedPriceUpdates.length}`,
    `- **Staged benchmark updates:** ${summary.stagedBenchmarkUpdates.length}`,
    `- **Total items awaiting approval in \`/admin\`:** ${nextQueueItems.length}`,
    `- **Unchanged:** ${summary.unchanged.length}`,
    `- **Rejected:** ${summary.rejected.length}`,
    '',
    '### Staged New Models',
    ...(summary.stagedNewModels.length > 0 ? summary.stagedNewModels.map((x) => `- ${x}`) : ['- None']),
    '',
    '### Staged Price Updates',
    ...(summary.stagedPriceUpdates.length > 0 ? summary.stagedPriceUpdates.map((x) => `- ${x}`) : ['- None']),
    '',
    '### Staged Benchmark Updates',
    ...(summary.stagedBenchmarkUpdates.length > 0 ? summary.stagedBenchmarkUpdates.map((x) => `- ${x}`) : ['- None']),
  ];

  writeReport(reportLines, totalStagedNow > 0);
  console.log(reportLines.join('\n'));
}

run();
