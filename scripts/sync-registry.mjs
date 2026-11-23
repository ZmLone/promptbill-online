import fs from 'node:fs';

const LOCAL_MODELS_PATH = 'src/data/models.json';
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

async function run() {
  const localModels = JSON.parse(fs.readFileSync(LOCAL_MODELS_PATH, 'utf8'));
  const res = await fetch('https://openrouter.ai/api/v1/models');
  if (!res.ok) {
    throw new Error(`Failed to fetch OpenRouter models: HTTP ${res.status}`);
  }

  const payload = await res.json();
  const remoteModels = Array.isArray(payload.data) ? payload.data : [];

  const remoteById = new Map();
  const remoteByTail = new Map();
  for (const rm of remoteModels) {
    if (!rm || !rm.id) continue;
    remoteById.set(rm.id, rm);
    const tail = rm.id.includes('/') ? rm.id.split('/').pop() : rm.id;
    if (tail && !remoteByTail.has(tail)) {
      remoteByTail.set(tail, rm);
    }
  }

  const todayIso = new Date().toISOString().slice(0, 10);
  const priceUpdates = [];

  for (const model of localModels) {
    const match = remoteById.get(model.id) || remoteByTail.get(model.id);
    if (!match || !match.pricing) continue;

    const remoteIn = Number((Number(match.pricing.prompt) * 1_000_000).toFixed(2));
    const remoteOut = Number((Number(match.pricing.completion) * 1_000_000).toFixed(2));

    if (Number.isNaN(remoteIn) || Number.isNaN(remoteOut) || remoteIn < 0 || remoteOut < 0) {
      continue;
    }

    const driftIn = Math.abs(remoteIn - model.inputPer1M);
    const driftOut = Math.abs(remoteOut - model.outputPer1M);

    if (driftIn > 0.02 || driftOut > 0.02) {
      const oldIn = model.inputPer1M;
      const oldOut = model.outputPer1M;
      model.inputPer1M = remoteIn;
      model.outputPer1M = remoteOut;

      if (Array.isArray(model.priceHistory)) {
        model.priceHistory.unshift({
          date: todayIso,
          inputPer1M: remoteIn,
          outputPer1M: remoteOut,
          note: `Auto-synced from OpenRouter registry (prev $${oldIn.toFixed(2)}/$${oldOut.toFixed(2)})`,
        });
      }

      priceUpdates.push(
        `- **${model.name}** (\`${model.id}\`): Input $${oldIn.toFixed(2)} -> **$${remoteIn.toFixed(2)}**, Output $${oldOut.toFixed(2)} -> **$${remoteOut.toFixed(2)}** per 1M tokens`
      );
    }
  }

  if (priceUpdates.length > 0) {
    fs.writeFileSync(LOCAL_MODELS_PATH, JSON.stringify(localModels, null, 2) + '\n', 'utf8');
  }

  const trackedIds = new Set(localModels.map((m) => m.id));
  const trackedNames = new Set(localModels.map((m) => m.name.toLowerCase()));

  const newlyDetected = remoteModels
    .filter((rm) => {
      if (!rm || !rm.id || !rm.name) return false;
      if (!MAJOR_PREFIXES.some((prefix) => rm.id.startsWith(prefix))) return false;
      const tail = rm.id.split('/').pop() || rm.id;
      if (trackedIds.has(rm.id) || trackedIds.has(tail)) return false;
      if (trackedNames.has(String(rm.name).toLowerCase())) return false;
      return true;
    })
    .slice(0, 15);

  const reportLines = [
    `## Automated LLM Registry Sync Report (${todayIso})`,
    '',
    `### 1. Pricing Updates Applied (${priceUpdates.length})`,
    ...(priceUpdates.length > 0
      ? priceUpdates
      : ['- No pricing drifts exceeding $0.02/1M detected among tracked models.']),
    '',
    `### 2. Newly Detected Provider Models on OpenRouter (${newlyDetected.length})`,
    ...(newlyDetected.length > 0
      ? newlyDetected.map((rm) => {
          const pIn = rm.pricing?.prompt ? (Number(rm.pricing.prompt) * 1_000_000).toFixed(2) : 'N/A';
          const pOut = rm.pricing?.completion ? (Number(rm.pricing.completion) * 1_000_000).toFixed(2) : 'N/A';
          const ctx = rm.context_length ? `${Math.round(rm.context_length / 1000)}K` : 'N/A';
          return `- **${rm.name}** (\`${rm.id}\`) — In: $${pIn}/1M, Out: $${pOut}/1M, Context: ${ctx}`;
        })
      : ['- No untracked major provider models found in this run.']),
  ];

  fs.writeFileSync(REPORT_PATH, reportLines.join('\n') + '\n', 'utf8');
  fs.writeFileSync(NEW_MODELS_FLAG_PATH, newlyDetected.length > 0 ? 'true' : 'false', 'utf8');

  console.log(reportLines.join('\n'));
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
