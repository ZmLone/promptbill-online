import type { CatalogModel } from './catalog';

export type PriceEventType = 'price-cut' | 'launch-snapshot' | 'verification-audit';

export interface PriceHistoryEvent {
  id: string;
  date: string;
  modelSlug: string;
  modelName: string;
  provider: string;
  eventType: PriceEventType;
  previousInputPer1M: number | null;
  currentInputPer1M: number | null;
  previousOutputPer1M: number | null;
  currentOutputPer1M: number | null;
  inputDeltaPct: number | null;
  outputDeltaPct: number | null;
  blendedDeltaPct: number | null;
  provenance: string;
  sourceUrl: string | null;
  note: string;
}

/**
 * Curated chronological price events and launch-rate snapshots anchored to the catalog.
 * Only verified/recorded rate snapshots in the catalog are used; unrecorded prior rates remain null (N/A).
 */
interface CuratedSeed {
  slug: string;
  date: string;
  eventType: PriceEventType;
  previousInputPer1M: number | null;
  previousOutputPer1M: number | null;
  note: string;
}

const CURATED_SEEDS: CuratedSeed[] = [
  {
    slug: 'gpt-6-1-terra',
    date: '2026-11-27',
    eventType: 'launch-snapshot',
    previousInputPer1M: null,
    previousOutputPer1M: null,
    note: 'Initial flagship tier rate verified at $1.00 / $5.00 per 1M tokens.',
  },
  {
    slug: 'gpt-5-4-nano',
    date: '2026-11-27',
    eventType: 'launch-snapshot',
    previousInputPer1M: null,
    previousOutputPer1M: null,
    note: 'Economy nano tier rate verified at $0.20 / $1.25 per 1M tokens.',
  },
  {
    slug: 'claude-fable-5-2',
    date: '2026-11-27',
    eventType: 'launch-snapshot',
    previousInputPer1M: null,
    previousOutputPer1M: null,
    note: 'Frontier reasoning tier rate verified at $8.00 / $40.00 per 1M tokens.',
  },
  {
    slug: 'claude-opus-5-5',
    date: '2026-11-27',
    eventType: 'launch-snapshot',
    previousInputPer1M: null,
    previousOutputPer1M: null,
    note: 'Opus 5.5 official API schedule verified at $4.00 / $20.00 per 1M tokens.',
  },
  {
    slug: 'claude-sonnet-5-5',
    date: '2026-11-27',
    eventType: 'launch-snapshot',
    previousInputPer1M: null,
    previousOutputPer1M: null,
    note: 'Sonnet 5.5 workhorse API rate verified in November 2026 catalog audit.',
  },
];

function computePctDelta(prev: number | null, curr: number | null): number | null {
  if (
    typeof prev !== 'number' ||
    typeof curr !== 'number' ||
    !Number.isFinite(prev) ||
    !Number.isFinite(curr) ||
    prev <= 0
  ) {
    return null;
  }
  return ((curr - prev) / prev) * 100;
}

export function buildPriceHistoryEvents(models: CatalogModel[]): PriceHistoryEvent[] {
  const bySlug = new Map<string, CatalogModel>();
  for (const m of models) {
    bySlug.set(m.slug, m);
  }

  const events: PriceHistoryEvent[] = [];
  const seededSlugs = new Set<string>();

  for (const seed of CURATED_SEEDS) {
    const m = bySlug.get(seed.slug);
    if (!m) continue;
    seededSlugs.add(m.slug);

    const currIn = typeof m.inputPer1M === 'number' && Number.isFinite(m.inputPer1M) ? m.inputPer1M : null;
    const currOut = typeof m.outputPer1M === 'number' && Number.isFinite(m.outputPer1M) ? m.outputPer1M : null;

    const inDelta = computePctDelta(seed.previousInputPer1M, currIn);
    const outDelta = computePctDelta(seed.previousOutputPer1M, currOut);

    const prevBlended =
      seed.previousInputPer1M !== null && seed.previousOutputPer1M !== null
        ? seed.previousInputPer1M * 0.8 + seed.previousOutputPer1M * 0.2
        : null;
    const currBlended =
      currIn !== null && currOut !== null ? currIn * 0.8 + currOut * 0.2 : null;
    const blendedDelta = computePctDelta(prevBlended, currBlended);

    events.push({
      id: `${m.slug}-${seed.date}`,
      date: seed.date,
      modelSlug: m.slug,
      modelName: m.name,
      provider: m.provider,
      eventType: seed.eventType,
      previousInputPer1M: seed.previousInputPer1M,
      currentInputPer1M: currIn,
      previousOutputPer1M: seed.previousOutputPer1M,
      currentOutputPer1M: currOut,
      inputDeltaPct: inDelta,
      outputDeltaPct: outDelta,
      blendedDeltaPct: blendedDelta,
      provenance: m.pricingProvenance?.status ?? 'Verified',
      sourceUrl: m.pricingProvenance?.sourceUrl ?? null,
      note: seed.note,
    });
  }

  for (const m of models) {
    if (seededSlugs.has(m.slug)) continue;
    const dateStr = m.pricingProvenance?.lastVerified
      ? m.pricingProvenance.lastVerified.slice(0, 10)
      : '2026-11-27';
    const currIn = typeof m.inputPer1M === 'number' && Number.isFinite(m.inputPer1M) ? m.inputPer1M : null;
    const currOut = typeof m.outputPer1M === 'number' && Number.isFinite(m.outputPer1M) ? m.outputPer1M : null;
    const status = m.pricingProvenance?.status ?? 'Estimated';

    events.push({
      id: `${m.slug}-audit`,
      date: dateStr,
      modelSlug: m.slug,
      modelName: m.name,
      provider: m.provider,
      eventType: 'verification-audit',
      previousInputPer1M: null,
      currentInputPer1M: currIn,
      previousOutputPer1M: null,
      currentOutputPer1M: currOut,
      inputDeltaPct: null,
      outputDeltaPct: null,
      blendedDeltaPct: null,
      provenance: status,
      sourceUrl: m.pricingProvenance?.sourceUrl ?? null,
      note:
        status === 'Verified'
          ? 'Official provider rate schedule verified against primary pricing documentation.'
          : 'Catalog rate snapshot pending primary source timestamp verification.',
    });
  }

  return events.sort((a, b) => {
    const d = b.date.localeCompare(a.date);
    if (d !== 0) return d;
    if (a.eventType !== b.eventType) {
      if (a.eventType === 'price-cut') return -1;
      if (b.eventType === 'price-cut') return 1;
      if (a.eventType === 'launch-snapshot') return -1;
      if (b.eventType === 'launch-snapshot') return 1;
    }
    return a.modelName.localeCompare(b.modelName);
  });
}
