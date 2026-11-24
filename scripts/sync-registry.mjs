import fs from 'node:fs';

const LOCAL_MODELS_PATH = 'src/data/models.json';
const OPENROUTER_URL = 'https://openrouter.ai/api/v1/models';
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

function writeReport(reportLines, hasNewModels) {
  try {
    fs.writeFileSync(REPORT_PATH, reportLines.join('\n') + '\n', 'utf8');
    fs.writeFileSync(NEW_MODELS_FLAG_PATH, hasNewModels ? 'true' : 'false', 'utf8');
  } catch {
    // Ignore non-writable temporary path in restricted environments
  }
}

async function run() {
  const summary = {
    added: [],
    updated: [],
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
    const msg = `Upstream OpenRouter check failed (preserving existing local catalog): ${
      err instanceof Error ? err.message : String(err)
    }`;
    summary.failed.push(msg);
    const failReport = [
      '## LLM Registry Sync Report (Upstream Unavailable)',
      '',
      `- Status: Failed safely; existing \`${LOCAL_MODELS_PATH}\` was not overwritten.`,
      `- Error: ${msg}`,
    ];
    writeReport(failReport, false);
    console.error(msg);
    process.exit(1);
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
  let modelsJsonChanged = false;

  // 1. Update ONLY the OpenRouter ('Router') endpoint entry for existing models; never overwrite Official API prices.
  for (const model of localModels) {
    if (!model || typeof model.id !== 'string' || !model.id.trim()) {
      summary.rejected.push('Local record missing valid id');
      continue;
    }

    const match =
      remoteByNormKey.get(normalizeKey(model.id)) ||
      remoteByNormKey.get(normalizeKey(model.slug)) ||
      remoteByNormKey.get(normalizeKey(model.name));

    if (!match || !match.pricing) {
      summary.unchanged.push(model.id);
      continue;
    }

    const remoteIn = Number((Number(match.pricing.prompt) * 1_000_000).toFixed(4));
    const remoteOut = Number((Number(match.pricing.completion) * 1_000_000).toFixed(4));
    if (!Number.isFinite(remoteIn) || !Number.isFinite(remoteOut) || remoteIn < 0 || remoteOut < 0) {
      summary.rejected.push(`Rejected OpenRouter rates for ${model.id}`);
      continue;
    }

    if (!Array.isArray(model.hostingEndpoints)) {
      model.hostingEndpoints = [];
    }

    const routerIdx = model.hostingEndpoints.findIndex(
      (ep) => ep && (ep.providerType === 'Router' || /openrouter/i.test(String(ep.host || '')))
    );

    const prevRouter = routerIdx >= 0 ? model.hostingEndpoints[routerIdx] : null;
    const prevIn = prevRouter ? parseFiniteNonNeg(prevRouter.inputPer1M) : null;
    const prevOut = prevRouter ? parseFiniteNonNeg(prevRouter.outputPer1M) : null;

    const changed =
      prevIn === null ||
      prevOut === null ||
      Math.abs(remoteIn - prevIn) > 0.01 ||
      Math.abs(remoteOut - prevOut) > 0.01;

    if (changed) {
      const updatedRouterEndpoint = {
        host: prevRouter?.host || 'OpenRouter',
        providerType: 'Router',
        inputPer1M: remoteIn,
        cachedInputPer1M: prevRouter?.cachedInputPer1M ?? null,
        cacheWritePer1M: prevRouter?.cacheWritePer1M ?? null,
        outputPer1M: remoteOut,
        batchDiscount: prevRouter?.batchDiscount ?? null,
        latencyMs: prevRouter?.latencyMs ?? null,
        notes: prevRouter?.notes || `Synced from OpenRouter (${match.id})`,
        currency: 'USD',
        pricingUnit: 'per 1M tokens',
        sourceUrl: OPENROUTER_URL,
        lastVerified: checkedAtIso,
        evidenceStatus: 'Verified',
      };

      if (routerIdx >= 0) {
        model.hostingEndpoints[routerIdx] = updatedRouterEndpoint;
      } else {
        model.hostingEndpoints.push(updatedRouterEndpoint);
      }

      modelsJsonChanged = true;
      summary.updated.push(
        `${model.name} (OpenRouter endpoint: $${prevIn ?? 'N/A'}/$${prevOut ?? 'N/A'} -> $${remoteIn}/$${remoteOut} per 1M, verified ${checkedAtIso})`
      );
    } else {
      summary.unchanged.push(model.id);
    }
  }

  // 2. Discover new models without fabricating benchmarks, speeds, Elo, rate limits, or cache/batch defaults.
  const knownKeys = new Set();
  for (const m of localModels) {
    knownKeys.add(normalizeKey(m.id));
    knownKeys.add(normalizeKey(m.slug));
    knownKeys.add(normalizeKey(m.name));
  }

  const seenNewNormKeys = new Set();
  const newlyDetectedDrafts = [];

  for (const rm of remoteModels) {
    if (!rm || typeof rm.id !== 'string' || typeof rm.name !== 'string') continue;
    const lowerId = rm.id.toLowerCase();
    if (!MAJOR_PREFIXES.some((prefix) => lowerId.startsWith(prefix))) continue;
    if (IGNORED_VARIANT_SUFFIXES.some((sfx) => lowerId.endsWith(sfx))) continue;

    const normId = normalizeKey(rm.id);
    const cleanName = cleanDisplayName(rm.name);
    const normName = normalizeKey(cleanName);
    if (!normId || !cleanName) continue;
    if (knownKeys.has(normId) || knownKeys.has(normName)) continue;
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

    const candidate = {
      id: normId,
      slug: normId,
      rank: null,
      name: cleanName,
      provider,
      providerSlug: normalizeKey(provider),
      family: null,
      license: null,
      evidence: 'Estimated',
      score: null,
      qualityScore: null,
      interval: null,
      elo: null,
      inputPer1M: null,
      cachedInputPer1M: null,
      cacheWritePer1M: null,
      outputPer1M: null,
      longContextMultiplierInput: null,
      longContextMultiplierOutput: null,
      longContextThresholdTokens: null,
      contextWindow: ctxStr,
      maxOutputTokens: null,
      tokPerSec: null,
      speedTokensPerSec: null,
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
      notes: `Discovered via OpenRouter (${rm.id}); official API price and benchmark/speed metrics unverified.`,
      pricingProvenance: {
        status: routerIn !== null && routerOut !== null ? 'Estimated' : 'Unavailable',
        sourceUrl: OPENROUTER_URL,
        lastVerified: checkedAtIso,
        currency: 'USD',
        pricingUnit: 'per 1M tokens',
        notes: 'Router price recorded on OpenRouter endpoint; official direct provider API price not yet verified.',
      },
      benchmarkProvenance: {
        status: 'Unavailable',
        sourceUrl: null,
        lastVerified: null,
        notes: 'No benchmark score measured or recorded.',
      },
      speedProvenance: {
        status: 'Unavailable',
        sourceUrl: null,
        lastVerified: null,
        hardwareOrProvider: null,
        conditions: null,
        notes: 'No speed measurement recorded.',
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

    newlyDetectedDrafts.push(candidate);
    summary.added.push(`${cleanName} (${rm.id}) — drafted as Estimated with null benchmarks/speed`);
    if (newlyDetectedDrafts.length >= 12) break;
  }

  if (modelsJsonChanged) {
    fs.writeFileSync(LOCAL_MODELS_PATH, JSON.stringify(localModels, null, 2) + '\n', 'utf8');
  }

  const reportLines = [
    `## LLM Registry Sync Report (${checkedAtIso})`,
    '',
    `- **Updated (Router endpoints):** ${summary.updated.length}`,
    `- **Newly discovered drafts (not auto-merged without review):** ${summary.added.length}`,
    `- **Unchanged:** ${summary.unchanged.length}`,
    `- **Rejected:** ${summary.rejected.length}`,
    `- **Failed:** ${summary.failed.length}`,
    '',
    '### Updated Router Endpoints',
    ...(summary.updated.length > 0 ? summary.updated.map((x) => `- ${x}`) : ['- None']),
    '',
    '### Newly Detected Models (Review Before Adding)',
    ...(newlyDetectedDrafts.length > 0
      ? [
          ...summary.added.map((x) => `- ${x}`),
          '',
          '```json',
          JSON.stringify(newlyDetectedDrafts, null, 2),
          '```',
        ]
      : ['- None']),
    ...(summary.rejected.length > 0
      ? ['', '### Rejected Entries', ...summary.rejected.map((x) => `- ${x}`)]
      : []),
  ];

  writeReport(reportLines, newlyDetectedDrafts.length > 0);
  console.log(reportLines.join('\n'));
}

run();
