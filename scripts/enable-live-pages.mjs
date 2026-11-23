import fs from 'node:fs';
import path from 'node:path';

const APP_DIR = path.resolve('src/app');

function walkPageFiles(dir, acc = []) {
  if (!fs.existsSync(dir)) return acc;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkPageFiles(fullPath, acc);
    } else if (entry.isFile() && (entry.name === 'page.tsx' || entry.name === 'page.ts')) {
      acc.push(fullPath);
    }
  }
  return acc;
}

const pageFiles = walkPageFiles(APP_DIR);
let updatedCount = 0;

for (const file of pageFiles) {
  let content = fs.readFileSync(file, 'utf8');
  if (/export\s+const\s+(revalidate|dynamic)\s*=/.test(content)) {
    continue;
  }
  // Insert `export const revalidate = 60;` after imports (or at top if client component)
  const lines = content.split('\n');
  let insertIdx = 0;
  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    if (trimmed === "'use client';" || trimmed === '"use client";' || trimmed.startsWith('import ') || trimmed === '') {
      insertIdx = i + 1;
    } else {
      break;
    }
  }
  lines.splice(insertIdx, 0, '', 'export const revalidate = 60;');
  fs.writeFileSync(file, lines.join('\n'), 'utf8');
  updatedCount++;
  console.log('Enabled live ISR (60s):', path.relative(process.cwd(), file));
}

console.log(`Done. Updated ${updatedCount} page files out of ${pageFiles.length}.`);
