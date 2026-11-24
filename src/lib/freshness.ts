import modelsJson from '../data/models.json';
import { type LiveModelRecord } from './liveRegistryBridge';

export const LIVE_REVALIDATE_SECONDS = 60;

export interface FreshnessSummary {
  totalModels: number;
  verifiedPricingCount: number;
  estimatedPricingCount: number;
  latestVerifiedDate: string | null;
}

export function getLiveModelsData(): LiveModelRecord[] {
  return Array.isArray(modelsJson) ? (modelsJson as LiveModelRecord[]) : [];
}

export function getRegistryFreshnessSummary(): FreshnessSummary {
  const records = getLiveModelsData();
  let verifiedPricingCount = 0;
  let estimatedPricingCount = 0;
  let latestVerifiedDate: string | null = null;

  for (const r of records) {
    const status = r.pricingProvenance?.status;
    if (status === 'Verified') verifiedPricingCount += 1;
    else estimatedPricingCount += 1;

    const checked = r.pricingProvenance?.lastVerified;
    if (typeof checked === 'string' && checked.length > 0) {
      if (!latestVerifiedDate || checked > latestVerifiedDate) {
        latestVerifiedDate = checked;
      }
    }
  }

  return {
    totalModels: records.length,
    verifiedPricingCount,
    estimatedPricingCount,
    latestVerifiedDate,
  };
}
