import Link from 'next/link';
import CostSimulator from '@/components/CostSimulator';
import { getActiveModels } from '@/lib/openrouterSync';

export default async function HomePage() {
  const models = await getActiveModels();

  return (
    <main className="mx-auto max-w-6xl px-4 py-12 text-slate-100">
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

      {/* High-CPM Sponsor / Ad Slot */}
      <div className="mb-8 rounded-xl border border-dashed border-slate-700 bg-slate-900/40 px-4 py-3 text-center text-xs text-slate-400">
        Sponsor Slot — Replace with EthicalAds, Carbon Ads, or Google AdSense snippet
      </div>

      <CostSimulator models={models} />

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
