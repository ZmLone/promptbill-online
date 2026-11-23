import fs from 'node:fs';
import path from 'node:path';

const modelsJson = JSON.parse(fs.readFileSync('src/data/models.json', 'utf8'));
const catalogPath = 'src/lib/catalog.ts';
const catalogExists = fs.existsSync(catalogPath);
const catalogContent = catalogExists ? fs.readFileSync(catalogPath, 'utf8') : '';

console.log(`Loaded ${modelsJson.length} records from src/data/models.json (single source of truth).`);

if (catalogExists) {
  const usesBridge = catalogContent.includes('applyLiveRegistryPricing') || catalogContent.includes('liveRegistryBridge');
  console.log(`src/lib/catalog.ts uses liveRegistryBridge: ${usesBridge ? 'YES' : 'NO (wire applyLiveRegistryPricing in catalog.ts)'}`);
}

const candidateRoutes = [
  'src/app/llms.txt/route.ts',
  'src/app/sitemap.ts',
  'src/app/sitemap.xml/route.ts',
  'src/app/page.tsx',
  'src/app/models/[slug]/page.tsx',
  'src/app/providers/[slug]/page.tsx',
  'src/app/compare/page.tsx',
];

for (const routeFile of candidateRoutes) {
  if (fs.existsSync(routeFile)) {
    const txt = fs.readFileSync(routeFile, 'utf8');
    const readsJson = txt.includes('models.json') || txt.includes('catalog') || txt.includes('liveRegistryBridge');
    console.log(`Checked ${routeFile}: dynamic data reference = ${readsJson ? 'YES' : 'CHECK'}`);
  }
}
