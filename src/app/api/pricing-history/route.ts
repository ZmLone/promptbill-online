import { NextResponse } from 'next/server';
import { ALL_MODELS } from '../../../lib/catalog';
import {
  fetchOpenRouterLiveModels,
  mergeLiveWithStoredHistory,
  REDIS_HISTORY_KEY,
  REDIS_META_KEY,
  toModelHistoryRecords,
  type StoredModelHistory,
} from '../../../lib/openrouterHistory';

export const revalidate = 3600;

async function redisGet<T>(key: string): Promise<T | null> {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;

  try {
    const res = await fetch(`${url}/get/${encodeURIComponent(key)}`, {
      headers: { Authorization: `Bearer ${token}` },
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { result?: string | null };
    if (!data.result) return null;
    return JSON.parse(data.result) as T;
  } catch {
    return null;
  }
}

async function redisSet(key: string, value: unknown): Promise<void> {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return;

  try {
    await fetch(`${url}/set/${encodeURIComponent(key)}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(JSON.stringify(value)),
    });
  } catch {
    // Non-blocking fallback
  }
}

export async function GET() {
  const todayIso = new Date().toISOString().slice(0, 10);
  const stored = (await redisGet<Record<string, StoredModelHistory>>(REDIS_HISTORY_KEY)) ?? {};

  try {
    const liveModels = await fetchOpenRouterLiveModels();
    const { updatedMap, changesDetected, newModelsAdded } = mergeLiveWithStoredHistory(
      stored,
      liveModels,
      todayIso
    );

    if (changesDetected > 0 || newModelsAdded > 0) {
      await redisSet(REDIS_HISTORY_KEY, updatedMap);
      await redisSet(REDIS_META_KEY, {
        lastSyncedAt: new Date().toISOString(),
        trackedModels: Object.keys(updatedMap).length,
      });
    }

    const series = toModelHistoryRecords(updatedMap, ALL_MODELS);
    return NextResponse.json({
      source: 'openrouter+redis',
      lastSyncedAt: new Date().toISOString(),
      modelsCount: series.length,
      changesDetected,
      series,
    });
  } catch {
    const series = toModelHistoryRecords(stored, ALL_MODELS);
    return NextResponse.json({
      source: Object.keys(stored).length > 0 ? 'redis-cache' : 'catalog-fallback',
      lastSyncedAt: new Date().toISOString(),
      modelsCount: series.length,
      changesDetected: 0,
      series,
    });
  }
}
