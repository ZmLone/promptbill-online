import { NextResponse } from 'next/server';
import { ALL_MODELS } from '../../../lib/catalog';
import {
  buildAllProviderHistory,
  type HistoricalPricePoint,
} from '../../../lib/priceHistoryArchive';

export const revalidate = 3600;

const REDIS_KEY = 'promptbill:pricing-history:snapshots:v1';

async function readRedisSnapshots(): Promise<Record<string, HistoricalPricePoint[]>> {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return {};

  try {
    const res = await fetch(`${url}/get/${encodeURIComponent(REDIS_KEY)}`, {
      headers: { Authorization: `Bearer ${token}` },
      next: { revalidate: 3600 },
    });
    if (!res.ok) return {};
    const data = (await res.json()) as { result?: string | null };
    if (!data.result) return {};
    const parsed = JSON.parse(data.result);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

async function writeTodaySnapshotIfNeeded(
  existing: Record<string, HistoricalPricePoint[]>
): Promise<Record<string, HistoricalPricePoint[]>> {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  const today = new Date().toISOString().slice(0, 10);

  const next: Record<string, HistoricalPricePoint[]> = { ...existing };
  let changed = false;

  for (const m of ALL_MODELS) {
    const inRate =
      typeof m.inputPer1M === 'number' && Number.isFinite(m.inputPer1M)
        ? m.inputPer1M
        : null;
    const outRate =
      typeof m.outputPer1M === 'number' && Number.isFinite(m.outputPer1M)
        ? m.outputPer1M
        : null;
    if (inRate === null && outRate === null) continue;

    const list = Array.isArray(next[m.slug]) ? [...next[m.slug]] : [];
    const alreadyHasToday = list.some((pt) => pt.date === today);
    if (!alreadyHasToday) {
      list.push({
        date: today,
        inputPer1M: inRate ?? 0,
        outputPer1M: outRate ?? 0,
        source: 'live-snapshot',
      });
      next[m.slug] = list.slice(-180);
      changed = true;
    }
  }

  if (changed && url && token) {
    try {
      await fetch(`${url}/set/${encodeURIComponent(REDIS_KEY)}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(JSON.stringify(next)),
      });
    } catch {
      // Non-blocking fallback
    }
  }

  return next;
}

export async function GET() {
  const existing = await readRedisSnapshots();
  const mergedSnapshots = await writeTodaySnapshotIfNeeded(existing);
  const series = buildAllProviderHistory(ALL_MODELS, mergedSnapshots);

  return NextResponse.json({
    updatedAt: new Date().toISOString(),
    modelsCount: series.length,
    series,
  });
}
