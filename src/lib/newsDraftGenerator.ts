import type { NewsArticle, NewsPriceDelta } from '@/lib/news';

export interface PriceDropCandidate {
  slug: string;
  name: string;
  provider: string;
  endpointHost?: string;
  oldInputPer1M: number | null;
  newInputPer1M: number | null;
  oldOutputPer1M: number | null;
  newOutputPer1M: number | null;
  sourceUrl?: string;
}

export function hasMaterialPriceDrop(candidate: PriceDropCandidate): boolean {
  const inputDropped =
    candidate.oldInputPer1M != null &&
    candidate.newInputPer1M != null &&
    candidate.newInputPer1M < candidate.oldInputPer1M;

  const outputDropped =
    candidate.oldOutputPer1M != null &&
    candidate.newOutputPer1M != null &&
    candidate.newOutputPer1M < candidate.oldOutputPer1M;

  return inputDropped || outputDropped;
}

function pctDrop(oldVal: number | null, newVal: number | null): number | null {
  if (oldVal == null || newVal == null || oldVal <= 0 || newVal >= oldVal) return null;
  return Math.round(((oldVal - newVal) / oldVal) * 100);
}

export function buildPriceDropNewsDraft(candidate: PriceDropCandidate): NewsArticle {
  const now = new Date();
  const dateTag = now.toISOString().slice(0, 10);
  const inDrop = pctDrop(candidate.oldInputPer1M, candidate.newInputPer1M);
  const outDrop = pctDrop(candidate.oldOutputPer1M, candidate.newOutputPer1M);
  const maxDrop = Math.max(inDrop ?? 0, outDrop ?? 0);

  const venue = candidate.endpointHost || candidate.provider;
  const slug = `${candidate.slug}-price-drop-${dateTag}`
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/^-+|-+$/g, '');

  const delta: NewsPriceDelta = {
    modelSlug: candidate.slug,
    modelName: candidate.name,
    provider: candidate.provider,
    ...(candidate.endpointHost ? { endpointHost: candidate.endpointHost } : {}),
    oldInputPer1M: candidate.oldInputPer1M,
    newInputPer1M: candidate.newInputPer1M,
    oldOutputPer1M: candidate.oldOutputPer1M,
    newOutputPer1M: candidate.newOutputPer1M,
  };

  const headlineSuffix = maxDrop > 0 ? ` by up to ${maxDrop}%` : '';
  const title = `${candidate.name} API Pricing Cut on ${venue}${headlineSuffix}`;

  const summary = `Verified rate reduction logged for ${candidate.name} via ${venue}: input tokens moved from ${
    candidate.oldInputPer1M != null ? `$${candidate.oldInputPer1M}` : 'N/A'
  } to ${
    candidate.newInputPer1M != null ? `$${candidate.newInputPer1M}` : 'N/A'
  } per 1M, and output tokens moved from ${
    candidate.oldOutputPer1M != null ? `$${candidate.oldOutputPer1M}` : 'N/A'
  } to ${
    candidate.newOutputPer1M != null ? `$${candidate.newOutputPer1M}` : 'N/A'
  } per 1M.`;

  const takeaways: string[] = [
    `${candidate.name} (${venue}) updated input pricing to ${
      candidate.newInputPer1M != null ? `$${candidate.newInputPer1M}/1M` : 'N/A'
    } and output pricing to ${
      candidate.newOutputPer1M != null ? `$${candidate.newOutputPer1M}/1M` : 'N/A'
    }.`,
    `Updated per-token economics are live on the PromptBill model page and multi-provider cost calculator.`,
  ];

  return {
    slug,
    title,
    summary,
    category: 'Price Drop',
    publishedAt: now.toISOString(),
    updatedAt: now.toISOString(),
    authorName: 'Zeeshan Mushtaq Lone',
    authorUrl: 'https://promptbill.online/about',
    featured: false,
    relatedModelSlugs: [candidate.slug],
    priceDeltas: [delta],
    keyTakeaways: takeaways,
    sections: [
      {
        heading: 'Updated Per-1M Token Economics',
        body: `${venue} lowered inference rates for ${candidate.name}. Workloads heavy on prompt context or long completions can immediately benchmark monthly spend changes using PromptBill's calculator and compare competing endpoints side by side.`,
      },
    ],
    sourceUrls: candidate.sourceUrl
      ? [
          { label: `${venue} Official Pricing`, url: candidate.sourceUrl },
          {
            label: `${candidate.name} on PromptBill`,
            url: `https://promptbill.online/models/${candidate.slug}`,
          },
        ]
      : [
          {
            label: `${candidate.name} on PromptBill`,
            url: `https://promptbill.online/models/${candidate.slug}`,
          },
        ],
  };
}
