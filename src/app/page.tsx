import Link from 'next/link';
import CostSimulator from '@/components/CostSimulator';
import { getActiveModels } from '@/lib/openrouterSync';

const FAQS = [
  {
    q: 'How are LLM API tokens calculated?',
    a: 'For English text and code, 1,000 tokens is roughly 750 words or 4,000 characters. Providers bill input tokens (your prompt and context) and output tokens (the generated reply) separately per 1 million tokens.',
  },
  {
    q: 'How much does Prompt Caching save on AI API bills?',
    a: 'Prompt caching discounts repeated system instructions, tools, or RAG context by up to 90% on input tokens across OpenAI, Anthropic, and Google models.',
  },
  {
    q: 'When should I use the Async Batch API?',
    a: 'If your workload does not require instant real-time responses (such as overnight data extraction, classification, or bulk summarization), Batch APIs cut token costs by 50%.',
  },
];

const FEATURED_COMPARISONS = [
  ['gpt-6-luna', 'deepseek-v4-1-flash', 'GPT-6 Luna vs DeepSeek V4.1 Flash'],
  ['gpt-6-1-sol', 'claude-sonnet-5-5', 'GPT-6.1 Sol vs Claude Sonnet 5.5'],
  ['claude-sonnet-5-5', 'gemini-4-argon', 'Claude Sonnet 5.5 vs Gemini 4 Argon'],
  ['gpt-6-1-sol', 'grok-4-5', 'GPT-6.1 Sol vs Grok 4.5'],
  ['deepseek-v4-1-flash', 'qwen-3-6-flash', 'DeepSeek V4.1 Flash vs Qwen 3.6 Flash'],
  ['deepseek-v4-pro', 'mistral-large-3', 'DeepSeek V4 Pro vs Mistral Large 3'],
  ['gpt-6-astra', 'claude-opus-5-5', 'GPT-6 Astra vs Claude Opus 5.5'],
  ['gpt-6-1-terra', 'gemini-3-8-flash', 'GPT-6.1 Terra vs Gemini 3.8 Flash'],
  ['claude-haiku-5-5', 'deepseek-v4-1-flash', 'Claude Haiku 5.5 vs DeepSeek V4.1 Flash'],
  ['grok-4-20', 'mistral-large-4', 'Grok 4.20 vs Mistral Large 4'],
  ['gemini-3-8-flash', 'qwen-3-7-plus', 'Gemini 3.8 Flash vs Qwen 3.7 Plus'],
  ['gpt-6-luna', 'gpt-oss-120b-groq', 'GPT-6 Luna vs GPT-OSS 120B (Groq)'],
  ['claude-opus-5-5', 'gemini-4-argon', 'Claude Opus 5.5 vs Gemini 4 Argon'],
  ['claude-sonnet-5-5', 'qwen-3-7-max', 'Claude Sonnet 5.5 vs Qwen 3.7 Max'],
  ['gpt-6-1-sol', 'deepseek-v4-pro', 'GPT-6.1 Sol vs DeepSeek V4 Pro'],
];

export default async function HomePage() {
  const models = await getActiveModels();

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQS.map((item) => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.a,
      },
    })),
  };

  return (
    <main className="mx-auto max-w-6xl px-4 py-12 text-slate-100">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      <div className="mb-8">
        <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-300">
          22 Models · OpenAI, Anthropic, Google, DeepSeek, xAI, Qwen &amp; Mistral
        </span>
        <h1 className="mt-4 text-4xl font-extrabold tracking-tight sm:text-5xl">
          AI API Token &amp; Cloud Cost Simulator
        </h1>
        <p className="mt-3 max-w-2xl text-lg text-slate-400">
          Pick a workload preset or paste your prompt, dial in prompt caching hit rates, and compare real monthly bills across 22 leading AI models.
        </p>
      </div>

      <CostSimulator models={models} />

      {/* SEO & AI Search FAQ Section */}
      <section className="mt-16 border-t border-slate-800 pt-10">
        <h2 className="text-xl font-bold text-white">
          AI API Pricing &amp; Prompt Caching FAQ
        </h2>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          {FAQS.map((item) => (
            <div
              key={item.q}
              className="rounded-xl border border-slate-800 bg-slate-900/50 p-5"
            >
              <h3 className="text-sm font-semibold text-white">{item.q}</h3>
              <p className="mt-2 text-xs leading-relaxed text-slate-400">
                {item.a}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Internal SEO Link Grid */}
      <section className="mt-16 border-t border-slate-800 pt-10">
        <h2 className="text-lg font-semibold text-white">
          Popular Model Cost Comparisons (231 Total Pairs)
        </h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 md:grid-cols-3">
          {FEATURED_COMPARISONS.map(([a, b, label]) => (
            <Link
              key={`${a}-${b}`}
              href={`/compare/${a}-vs-${b}`}
              className="rounded-lg border border-slate-800 bg-slate-900/40 px-4 py-2.5 text-sm text-slate-300 hover:border-emerald-500/50 hover:text-white"
            >
              {label} →
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
