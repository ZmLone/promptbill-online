import Link from 'next/link';
import { buildCanonicalMetadata } from '../lib/canonical';

export const metadata = buildCanonicalMetadata({
  title: 'Pricing & Benchmark Methodology | PromptBill',
  description:
    'How PromptBill normalizes LLM API token prices per 1M tokens, separates official vs. router endpoints, and scores benchmark evidence.',
  path: '/methodology',
});

export default function MethodologyPage() {
  return (
    <main className="mx-auto max-w-4xl space-y-6 px-4 py-10">
      <h1>PromptBill Pricing &amp; Benchmark Methodology</h1>
      <p>
        <strong>Direct Answer:</strong> PromptBill normalizes all LLM API token prices to USD per 1,000,000 (1M) input, cached-read, and output tokens while explicitly separating first-party official rate cards, third-party hosting/router endpoints, and estimated entries.
      </p>

      <h2>How does PromptBill normalize API token pricing?</h2>
      <p>
        Every tracked endpoint is converted to a standard 1M-token basis so developers can compare providers on equal footing across high-volume prompts, cached context reads, and long completions.
      </p>

      <h2>What is the difference between Official, Router, and Estimated provenance?</h2>
      <ul>
        <li><strong>Official:</strong> Sourced directly from the model creator&apos;s published API pricing documentation.</li>
        <li><strong>Router / Third-Party Endpoint:</strong> Sourced from aggregators or hosting endpoints (such as OpenRouter) where rates or throughput can differ from direct provider endpoints.</li>
        <li><strong>Estimated:</strong> Modeled or provisional figures awaiting direct verification before final confirmation.</li>
      </ul>

      <p>
        Explore live rates on the <Link href="/pricing">API Pricing</Link> page or inspect individual models in the <Link href="/models">Models Directory</Link>.
      </p>
    </main>
  );
}
