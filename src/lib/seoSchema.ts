export interface DatasetSchemaOptions {
  modelCount: number;
  dateModified?: string;
}

export function buildCatalogDatasetJsonLd({ modelCount, dateModified }: DatasetSchemaOptions) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Dataset',
    name: `PromptBill LLM API Pricing & Benchmark Dataset (${modelCount} Models)`,
    description:
      'Verified per-1M token input, output, cached input, and batch API pricing alongside throughput (tokens/sec) and capability benchmarks across official APIs and inference providers.',
    url: 'https://promptbill.online/models',
    inLanguage: 'en-US',
    license: 'https://creativecommons.org/licenses/by/4.0/',
    dateModified: dateModified || new Date().toISOString().slice(0, 10),
    creator: {
      '@type': 'Organization',
      name: 'PromptBill Research',
      url: 'https://promptbill.online/methodology',
    },
    publisher: {
      '@type': 'Organization',
      name: 'PromptBill',
      url: 'https://promptbill.online',
    },
    variableMeasured: [
      'Input token price per 1M tokens (USD)',
      'Output token price per 1M tokens (USD)',
      'Cached input token price per 1M tokens (USD)',
      'Output throughput (tokens per second)',
      'Context window length (tokens)',
      'Composite capability benchmark score',
    ],
  };
}

export function buildWebToolJsonLd(params: {
  name: string;
  description: string;
  url: string;
  featureList: string[];
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: params.name,
    description: params.description,
    url: params.url,
    applicationCategory: 'DeveloperApplication',
    operatingSystem: 'Web',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    provider: {
      '@type': 'Organization',
      name: 'PromptBill',
      url: 'https://promptbill.online',
    },
    featureList: params.featureList,
  };
}

export function normalizeProviderDisplayName(raw: string | null | undefined): string {
  const val = (raw || '').trim();
  if (!val) return 'Unknown';
  if (/^mistral/i.test(val)) return 'Mistral';
  if (/^qwen/i.test(val)) return 'Qwen';
  return val;
}
