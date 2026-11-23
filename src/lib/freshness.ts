import modelsJson from '../data/models.json';
import { LLMModel } from './pricingEngine';

export const LIVE_REVALIDATE_SECONDS = 60;

export function getLiveModelsData(): LLMModel[] {
  return modelsJson as LLMModel[];
}
