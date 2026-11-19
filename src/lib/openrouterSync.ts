import { AIModel, FALLBACK_MODELS } from '@/data/fallbackModels';
import { redis } from './redis';

const CACHE_KEY = 'tokenledger:models:v1';

export async function getActiveModels(): Promise<AIModel[]> {
  if (!redis) return FALLBACK_MODELS;
  try {
    const cached = await redis.get<AIModel[]>(CACHE_KEY);
    if (cached && cached.length > 0) return cached;
  } catch {
    // Gracefully fall back if Redis is unreachable
  }
  return FALLBACK_MODELS;
}

export async function syncLivePricingFromOpenRouter(): Promise<number> {
  const res = await fetch('https://openrouter.ai/api/v1/models', {
    next: { revalidate: 0 },
  });
  if (!res.ok) throw new Error(`OpenRouter sync failed: ${res.status}`);

  const json = await res.json();
  const liveMap = new Map<string, { prompt: number; completion: number }>();

  for (const item of json.data ?? []) {
    const promptPer1M = Number(item.pricing?.prompt ?? 0) * 1_000_000;
    const completionPer1M = Number(item.pricing?.completion ?? 0) * 1_000_000;
    if (promptPer1M > 0 && completionPer1M > 0) {
      liveMap.set(item.id, { prompt: promptPer1M, completion: completionPer1M });
    }
  }

  const updatedModels = FALLBACK_MODELS.map((m) => {
    const live = liveMap.get(m.id);
    if (!live) return m;
    return {
      ...m,
      inputPer1M: Number(live.prompt.toFixed(4)),
      outputPer1M: Number(live.completion.toFixed(4)),
    };
  });

  if (redis) {
    await redis.set(CACHE_KEY, updatedModels, { ex: 86400 });
  }
  return updatedModels.length;
}
