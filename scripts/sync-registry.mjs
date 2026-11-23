import fs from 'node:fs';

const LOCAL_MODELS_PATH = 'src/data/models.json';
const CATALOG_TS_PATH = 'src/lib/catalog.ts';
const REPORT_PATH = '/tmp/registry-sync-report.md';
const NEW_MODELS_FLAG_PATH = '/tmp/has-new-models.txt';

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
  const prefix = (remoteId.split('/')[0] || '').toLowerCase();
  const map = {
    anthropic: 'Anthropic',
    openai: 'OpenAI',
    google: 'Google',
    deepseek: 'DeepSeek',
    qwen: 'Qwen',
    'x-ai': 'xAI',
    'meta-llama': 'Meta',
    mistralai: 'Mistral',
    cohere: 'Cohere',
    moonshotai: 'Moonshot AI',
  };
  return map[prefix] || prefix;
}

function cleanDisplayName(rawName) {
  return String(rawName || '')
    .replace(/^[A-Za-z0-9\s.-]+:\s*/, '')
    .trim();
}

function formatContextWindow(ctxLen) {
  const num = Number(ctxLen);
  if (!num || Number.isNaN(num)) return '128K';
  if (num >= 1_000_000) {
    const m = num / 1_000_000;
    return Number.isInteger(m) ? `${m}M` : `${m.toFixed(1)}M`;
  }
  return `${Math.round(num / 1000)}K`;
}

function extractKnownCatalogKeys(catalogSource) {
  const keys = new Set();
  const slugMatches = catalogSource.matchAll(/slug:\s*['"]([^'"]+)['"]/g);
  for (const m of slugMatches) {
    keys.add(normalizeKey(m[1]));
  }
  const idMatches = catalogSource.matchAll(/id:\s*['"]([^'"]+)['"]/g);
  for (const m of idMatches) {
    keys.add(normalizeKey(m[1]));
  }
  const nameMatches = catalogSource.matchAll(/name:\s*['"]([^'"]+)['"]/g);
  for (const m of nameMatches) {
    keys.add(normalizeKey(m[1]));
  }
  return keys;
}

async function run() {
  const localModels = JSON.parse(fs.readFileSync(LOCAL_MODELS_PATH, 'utf8'));
  const catalogSource = fs.existsSync(CATALOG_TS_PATH) ? fs.readFileSync(CATALOG_TS_PATH, 'utf8') : '';
  const catalogKeys = extractKnownCatalogKeys(catalogSource);

  const res = await fetch('https://openrouter.ai/api/v1/models');
  if (!res.ok) {
    throw new Error(`Failed to fetch OpenRouter models: HTTP ${res.status}`);
  }

  const payload = await res.json();
  const remoteModels = Array.isArray(payload.data) ? payload.data : [];

  const remoteByNormKey = new Map();
  for (const rm of remoteModels) {
    if (!rm || !rm.id) continue;
    const lowerId = rm.id.toLowerCase();
    if (IGNORED_VARIANT_SUFFIXES.some((sfx) => lowerId.endsWith(sfx))) continue;

    const normId = normalizeKey(rm.id);
    const normName = normalizeKey(cleanDisplayName(rm.name));
    if (normId && !remoteByNormKey.has(normId)) remoteByNormKey.set(normId, rm);
    if (normName && !remoteByNormKey.has(normName)) remoteByNormKey.set(normName, rm);
  }

  const todayIso = new Date().toISOString().slice(0, 10);
  const priceUpdates = [];
  let modelsJsonChanged = false;

  for (const model of localModels) {
    const match =
      remoteByNormKey.get(normalizeKey(model.id)) ||
      remoteByNormKey.get(normalizeKey(model.slug)) ||
      remoteByNormKey.get(normalizeKey(model.name));
    if (!match || !match.pricing) continue;

    const remoteIn = Number((Number(match.pricing.prompt) * 1_000_000).toFixed(2));
    const remoteOut = Number((Number(match.pricing.completion) * 1_000_000).toFixed(2));
    if (Number.isNaN(remoteIn) || Number.isNaN(remoteOut) || remoteIn < 0 || remoteOut < 0) continue;

    if (Math.abs(remoteIn - model.inputPer1M) > 0.02 || Math.abs(remoteOut - model.outputPer1M) > 0.02) {
      const oldIn = model.inputPer1M;
      const oldOut = model.outputPer1M;
      model.inputPer1M = remoteIn;
      model.outputPer1M = remoteOut;
      model.cachedInputPer1M = Number((remoteIn * 0.1).toFixed(4));
      modelsJsonChanged = true;

      if (Array.isArray(model.priceHistory)) {
        model.priceHistory.unshift({
          date: todayIso,
          inputPer1M: remoteIn,
          outputPer1M: remoteOut,
          note: `Auto-synced from OpenRouter (${match.id}; prev $${oldIn.toFixed(2)}/$${oldOut.toFixed(2)})`,
        });
      }

      priceUpdates.push(
        `- **${model.name}** (\`${model.id}\`): Input $${oldIn.toFixed(2)} -> **$${remoteIn.toFixed(2)}**, Output $${oldOut.toFixed(2)} -> **$${remoteOut.toFixed(2)}** per 1M tokens`
      );
    }
  }

  if (modelsJsonChanged) {
    fs.writeFileSync(LOCAL_MODELS_PATH, JSON.stringify(localModels, null, 2) + '\n', 'utf8');
  }

  const knownKeys = new Set(catalogKeys);
  for (const m of localModels) {
    knownKeys.add(normalizeKey(m.id));
    knownKeys.add(normalizeKey(m.slug));
    knownKeys.add(normalizeKey(m.name));
  }

  const seenNewNormKeys = new Set();
  const newlyDetected = [];

  for (const rm of remoteModels) {
    if (!rm || !rm.id || !rm.name) continue;
    const lowerId = rm.id.toLowerCase();
    if (!MAJOR_PREFIXES.some((prefix) => lowerId.startsWith(prefix))) continue;
    if (IGNORED_VARIANT_SUFFIXES.some((sfx) => lowerId.endsWith(sfx))) continue;

    const normId = normalizeKey(rm.id);
    const cleanName = cleanDisplayName(rm.name);
    const normName = normalizeKey(cleanName);

    if (knownKeys.has(normId) || knownKeys.has(normName)) continue;
    if (seenNewNormKeys.has(normId)) continue;

    seenNewNormKeys.add(normId);
    newlyDetected.push(rm);
    if (newlyDetected.length >= 12) break;
  }

  const nextRankStart = localModels.length + 1;
  const draftEntries = newlyDetected.map((rm, idx) => {
    const cleanName = cleanDisplayName(rm.name);
    const slug = normalizeKey(rm.id);
    const provider = inferProviderDisplay(rm.id);
    const pIn = rm.pricing?.prompt ? Number((Number(rm.pricing.prompt) * 1_000_000).toFixed(2)) : 1.0;
    const pOut = rm.pricing?.completion ? Number((Number(rm.pricing.completion) * 1_000_000).toFixed(2)) : 5.0;
    const cachedIn = Number((pIn * 0.1).toFixed(3));
    const ctxStr = formatContextWindow(rm.context_length);

    return {
      id: slug,
      slug,
      rank: nextRankStart + idx,
      name: cleanName,
      provider,
      providerSlug: normalizeKey(provider),
      family: cleanName.split(' ')[0] || provider,
      license: ['deepseek', 'qwen', 'meta-llama', 'mistralai'].some((p) => rm.id.startsWith(p))
        ? 'Open'
        : 'Closed',
      evidence: 'Estimated',
      score: 82.0,
      interval: '±1.2',
      elo: 1320.0,
      inputPer1M: pIn,
      cachedInputPer1M: cachedIn,
      outputPer1M: pOut,
      contextWindow: ctxStr,
      maxOutputTokens: '32K',
      tokPerSec: 120,
      ag: 80,
      co: 82,
      re: 82,
      mm: 78,
      kn: 81,
      ml: 80,
      if: 83,
      ma: 81,
      rpmLimit: '4,000 RPM',
      tpmLimit: '2,000,000 TPM',
      tpdLimit: '50,000,000 TPD',
      batchDiscount: 0.5,
      bestFor: `${provider} model newly detected via OpenRouter (${rm.id})`,
      notes: 'Initial Estimated listing auto-drafted from OpenRouter pricing & context metadata.',
      priceHistory: [
        {
          date: todayIso,
          inputPer1M: pIn,
          outputPer1M: pOut,
          note: `Initial Estimated listing (${rm.id})`,
        },
      ],
    };
  });

  const reportLines = [
    `## Automated LLM Registry Sync Report (${todayIso})`,
    '',
    `### 1. Pricing Updates Applied to Single Source of Truth \`src/data/models.json\` (${priceUpdates.length})`,
    ...(priceUpdates.length > 0
      ? priceUpdates
      : ['- No pricing drifts exceeding $0.02/1M detected among tracked models.']),
    '',
    `### 2. Totally New Models Detected (${newlyDetected.length})`,
    ...(newlyDetected.length > 0
      ? [
          ...newlyDetected.map((rm) => {
            const pIn = rm.pricing?.prompt ? (Number(rm.pricing.prompt) * 1_000_000).toFixed(2) : 'N/A';
            const pOut = rm.pricing?.completion ? (Number(rm.pricing.completion) * 1_000_000).toFixed(2) : 'N/A';
            const ctx = formatContextWindow(rm.context_length);
            return `- **${cleanDisplayName(rm.name)}** (\`${rm.id}\`) — In: $${pIn}/1M, Out: $${pOut}/1M, Context: ${ctx}`;
          }),
          '',
          '### 3. Ready-to-Paste JSON Starter Entries (`"evidence": "Estimated"`)',
          '```json',
          JSON.stringify(draftEntries, null, 2),
          '```',
        ]
      : ['- No totally new major provider models found in this run.']),
  ];

  fs.writeFileSync(REPORT_PATH, reportLines.join('\n') + '\n', 'utf8');
  fs.writeFileSync(NEW_MODELS_FLAG_PATH, newlyDetected.length > 0 ? 'true' : 'false', 'utf8');
  console.log(reportLines.join('\n'));
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
