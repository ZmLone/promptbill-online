import { NextResponse } from 'next/server';
import {
  fetchOpenRouterLiveModels,
  mergeLiveWithStoredHistory,
  REDIS_HISTORY_KEY,
  REDIS_META_KEY,
  type StoredModelHistory,
} from '../../../../lib/openrouterHistory';

export const dynamic = 'force-dynamic';

function getRedisWriteConfig() {
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
  return { url, token };
}

function getRedisReadConfig() {
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const token =
    process.env.UPSTASH_REDIS_REST_TOKEN ||
    process.env.KV_REST_API_TOKEN ||
    process.env.KV_REST_API_READ_ONLY_TOKEN;
  return { url, token };
}

async function redisGet<T>(key: string): Promise<T | null> {
  const { url, token } = getRedisReadConfig();
  if (!url || !token) return null;

  const res = await fetch(`${url}/get/${encodeURIComponent(key)}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });
  if (!res.ok) return null;
  const data = (await res.json()) as { result?: string | null };
  if (!data.result) return null;
  return JSON.parse(data.result) as T;
}

async function redisSet(key: string, value: unknown): Promise<boolean> {
  const { url, token } = getRedisWriteConfig();
  if (!url || !token) return false;

  const res = await fetch(`${url}/set/${encodeURIComponent(key)}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(JSON.stringify(value)),
  });
  return res.ok;
}

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const authHeader = request.headers.get('authorization');
    const url = new URL(request.url);
    const isManualUiSync = url.searchParams.get('source') === 'ui';
    if (!isManualUiSync && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  try {
    const todayIso = new Date().toISOString().slice(0, 10);
    const [stored, liveModels] = await Promise.all([
      redisGet<Record<string, StoredModelHistory>>(REDIS_HISTORY_KEY),
      fetchOpenRouterLiveModels(),
    ]);

    const { updatedMap, changesDetected, newModelsAdded } = mergeLiveWithStoredHistory(
      stored ?? {},
      liveModels,
      todayIso
    );

    const persisted = await redisSet(REDIS_HISTORY_KEY, updatedMap);
    const meta = {
      lastSyncedAt: new Date().toISOString(),
      trackedModels: Object.keys(updatedMap).length,
      changesDetected,
      newModelsAdded,
      persistedToRedis: persisted,
    };
    if (persisted) {
      await redisSet(REDIS_META_KEY, meta);
    }

    return NextResponse.json({ ok: true, ...meta });
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        error: err instanceof Error ? err.message : 'Failed to sync OpenRouter pricing',
      },
      { status: 500 }
    );
  }
}
