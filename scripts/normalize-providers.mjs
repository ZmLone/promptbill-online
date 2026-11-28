import fs from 'node:fs';
import path from 'node:path';

const modelsPath = path.resolve('src/data/models.json');
const raw = fs.readFileSync(modelsPath, 'utf-8');
const models = JSON.parse(raw);

let changed = 0;
const updated = models.map((m) => {
  const orig = String(m.provider || '').trim();
  let nextProvider = orig;
  if (/^mistral/i.test(orig)) nextProvider = 'Mistral';
  if (/^qwen/i.test(orig)) nextProvider = 'Qwen';

  if (nextProvider !== orig) {
    changed += 1;
    return {
      ...m,
      provider: nextProvider,
      providerSlug: nextProvider.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    };
  }
  return m;
});

fs.writeFileSync(modelsPath, JSON.stringify(updated, null, 2) + '\n', 'utf-8');
console.log(`Normalized provider names on ${changed} model(s) in src/data/models.json`);
