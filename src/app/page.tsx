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
          Updated Live via OpenRouter &amp; Official Provider Feeds
        </span>
        <h1 className="mt-4 text-4xl font-extrabold tracking-tight sm:text-5xl">
          AI API Token &amp; Cloud Cost Simulator
        </h1>
        <p className="mt-3 max-w-2xl text-lg text-slate-400">
          Paste your prompt, dial in daily request volume and prompt caching hit rates, and compare real monthly bills across OpenAI, Anthropic, and Google models.
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
          Popular Model Cost Comparisons
        </h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 md:grid-cols-3">
          {models.slice(0, 6).map((a, i) =>
            models.slice(i + 1, 7).map((b) => (
              <Link
                key={`${a.slug}-${b.slug}`}
                href={`/compare/${a.slug}-vs-${b.slug}`}
                className="rounded-lg border border-slate-800 bg-slate-900/40 px-4 py-2.5 text-sm text-slate-300 hover:border-emerald-500/50 hover:text-white"
              >
                {a.name} vs {b.name} Cost →
              </Link>
            ))
          )}
        </div>
      </section>
    </main>
  );
}
