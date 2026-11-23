import fs from 'node:fs';

const MODELS_PATH = 'src/data/models.json';
const data = JSON.parse(fs.readFileSync(MODELS_PATH, 'utf8'));

const overrides = {
  'claude-haiku-5-5': { inputPer1M: 0.10, outputPer1M: 0.50 },
  'kimi-k2-7-code': { inputPer1M: 0.60, outputPer1M: 3.00 },
  'deepseek-v4-1-flash': { inputPer1M: 0.05, outputPer1M: 0.20 },
};

let updated = 0;
for (const m of data) {
  if (overrides[m.id]) {
    m.inputPer1M = overrides[m.id].inputPer1M;
    m.outputPer1M = overrides[m.id].outputPer1M;
    updated++;
  }
}

fs.writeFileSync(MODELS_PATH, JSON.stringify(data, null, 2) + '\n', 'utf8');
console.log(`Updated ${updated} models in src/data/models.json`);
