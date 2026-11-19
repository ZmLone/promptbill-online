export interface AIModel {
  id: string;
  slug: string;
  name: string;
  provider: 'OpenAI' | 'Anthropic' | 'Google' | 'DeepSeek';
  tier: 'Budget' | 'Workhorse' | 'Frontier';
  inputPer1M: number;       // USD per 1M input tokens
  outputPer1M: number;      // USD per 1M output tokens
  cachedInputPer1M: number; // USD per 1M cached input tokens
  batchDiscount: number;    // e.g. 0.5 = 50% off
  contextWindow: number;
  affiliateLabel: string;
  affiliateUrl: string;
}

export const FALLBACK_MODELS: AIModel[] = [
  {
    id: 'openai/gpt-6-luna',
    slug: 'gpt-6-luna',
    name: 'GPT-6 Luna',
    provider: 'OpenAI',
    tier: 'Budget',
    inputPer1M: 0.10,
    outputPer1M: 0.50,
    cachedInputPer1M: 0.01,
    batchDiscount: 0.5,
    contextWindow: 400000,
    affiliateLabel: 'Deploy via OpenRouter',
    affiliateUrl: 'https://openrouter.ai/',
  },
  {
    id: 'anthropic/claude-haiku-5.5',
    slug: 'claude-haiku-5-5',
    name: 'Claude Haiku 5.5',
    provider: 'Anthropic',
    tier: 'Budget',
    inputPer1M: 0.10,
    outputPer1M: 0.50,
    cachedInputPer1M: 0.01,
    batchDiscount: 0.5,
    contextWindow: 200000,
    affiliateLabel: 'Claim Cloud Credits',
    affiliateUrl: 'https://aws.amazon.com/bedrock/',
  },
  {
    id: 'google/gemini-3.1-flash-lite',
    slug: 'gemini-3-1-flash-lite',
    name: 'Gemini 3.1 Flash-Lite',
    provider: 'Google',
    tier: 'Budget',
    inputPer1M: 0.25,
    outputPer1M: 1.50,
    cachedInputPer1M: 0.025,
    batchDiscount: 0.5,
    contextWindow: 1000000,
    affiliateLabel: 'Claim $300 GCP Credits',
    affiliateUrl: 'https://cloud.google.com/',
  },
  {
    id: 'google/gemini-3.8-flash',
    slug: 'gemini-3-8-flash',
    name: 'Gemini 3.8 Flash',
    provider: 'Google',
    tier: 'Workhorse',
    inputPer1M: 0.75,
    outputPer1M: 3.75,
    cachedInputPer1M: 0.075,
    batchDiscount: 0.5,
    contextWindow: 1000000,
    affiliateLabel: 'Claim $300 GCP Credits',
    affiliateUrl: 'https://cloud.google.com/',
  },
  {
    id: 'openai/gpt-6.1-sol',
    slug: 'gpt-6-1-sol',
    name: 'GPT-6.1 Sol',
    provider: 'OpenAI',
    tier: 'Workhorse',
    inputPer1M: 2.00,
    outputPer1M: 10.00,
    cachedInputPer1M: 0.10,
    batchDiscount: 0.5,
    contextWindow: 400000,
    affiliateLabel: 'Route via OpenRouter',
    affiliateUrl: 'https://openrouter.ai/',
  },
  {
    id: 'anthropic/claude-sonnet-5.5',
    slug: 'claude-sonnet-5-5',
    name: 'Claude Sonnet 5.5',
    provider: 'Anthropic',
    tier: 'Workhorse',
    inputPer1M: 2.00,
    outputPer1M: 10.00,
    cachedInputPer1M: 0.10,
    batchDiscount: 0.5,
    contextWindow: 1000000,
    affiliateLabel: 'Deploy on Cloud',
    affiliateUrl: 'https://aws.amazon.com/bedrock/',
  },
  {
    id: 'google/gemini-4-argon',
    slug: 'gemini-4-argon',
    name: 'Gemini 4 Argon',
    provider: 'Google',
    tier: 'Frontier',
    inputPer1M: 2.00,
    outputPer1M: 10.00,
    cachedInputPer1M: 0.10,
    batchDiscount: 0.5,
    contextWindow: 1000000,
    affiliateLabel: 'Claim $300 GCP Credits',
    affiliateUrl: 'https://cloud.google.com/',
  },
  {
    id: 'openai/gpt-6-astra',
    slug: 'gpt-6-astra',
    name: 'GPT-6 Astra',
    provider: 'OpenAI',
    tier: 'Frontier',
    inputPer1M: 10.00,
    outputPer1M: 50.00,
    cachedInputPer1M: 1.00,
    batchDiscount: 0.5,
    contextWindow: 400000,
    affiliateLabel: 'Route via OpenRouter',
    affiliateUrl: 'https://openrouter.ai/',
  },
];
