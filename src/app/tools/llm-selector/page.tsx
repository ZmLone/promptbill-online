import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { ALL_MODELS } from '../../../lib/catalog';
import { SiteShell } from '../../../components/SiteShell';
import { LlmSelectorClient } from '../../../components/LlmSelectorClient';

export const metadata: Metadata = {
  title: 'Interactive LLM Selector: Find the Best AI Model by Task, Price & Speed',
  description:
    'Filter and compare top LLMs by workload (coding, reasoning, classification, speed), monthly API budget, benchmark score, and open-weight license on PromptBill.',
  alternates: {
    canonical: 'https://promptbill.online/tools/llm-selector',
  },
};

export default function LlmSelectorPage() {
  const faqItems = [
    {
      q: 'What is the best open-weight LLM for coding in 2026?',
      a: 'Among open-weight models tracked on PromptBill, DeepSeek V4.1 Flash and Qwen 3.7 Flash deliver standout coding and token-efficiency performance under $1.25 per 1M output tokens, while Kimi K2.7 Code specializes in repository-scale code generation and editing.',
    },
    {
      q: 'Which LLM has the lowest API cost per million tokens?',
      a: 'Command R7B ($0.04 input / $0.15 output per 1M tokens) and Qwen 3.7 Flash ($0.15 input / $0.60 output per 1M tokens) offer the lowest API rates on PromptBill, followed by GPT-5.4 Nano ($0.20/$1.25) and DeepSeek V4.1 Flash ($0.30/$1.20).',
    },
    {
      q: 'Which model leads overall benchmark intelligence for complex agentic coding?',
      a: 'Claude Fable 5.2 ranks #1 on PromptBill with a 93.3 composite score at $8.00 input / $40.00 output per 1M tokens and 66 tok/s, while Gemini 4 Neon (91.3) and GPT-6.2 Astra (90.8) lead multimodal and frontier reasoning alternatives.',
    },
    {
      q: 'How should I estimate monthly LLM API spend before choosing a model?',
      a: 'Multiply your expected monthly call volume by average input and output tokens per call, then apply prompt cache read discounts (often 90%–97.5% off repeated prefixes) and 50% Batch API discounts for asynchronous jobs.',
    },
    {
      q: 'When should I use a fast 150+ tok/s model instead of a flagship reasoning model?',
      a: 'Use high-throughput models such as Gemini 4 Hydrogen, Qwen 3.7 Flash, Claude Haiku 5.5, or GPT-5.4 Nano for real-time autocomplete, voice agents, intent routing, and high-volume JSON extraction where sub-second latency matters most.',
    },
  ];

  const jsonLdGraph = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: 'Home',
            item: 'https://promptbill.online/',
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: 'Tools',
            item: 'https://promptbill.online/tools/llm-selector',
          },
          {
            '@type': 'ListItem',
            position: 3,
            name: 'LLM Selector',
            item: 'https://promptbill.online/tools/llm-selector',
          },
        ],
      },
      {
        '@type': 'WebApplication',
        name: 'PromptBill Interactive LLM Selector',
        url: 'https://promptbill.online/tools/llm-selector',
        applicationCategory: 'DeveloperApplication',
        operatingSystem: 'Web',
        description:
          'Interactive LLM selection and monthly budget estimation tool filtering models by coding, reasoning, low-cost classification, throughput speed, and open-weight licensing.',
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'USD',
        },
      },
      {
        '@type': 'FAQPage',
        mainEntity: faqItems.map((item) => ({
          '@type': 'Question',
          name: item.q,
          acceptedAnswer: {
            '@type': 'Answer',
            text: item.a,
          },
        })),
      },
    ],
  };

  return (
    <SiteShell
      title="Interactive LLM Selector: Find the Best AI Model by Task, Price & Speed"
      subtitle="promptbill.online/tools/llm-selector · Workload Filtering, Monthly Budget Estimator & GEO Guide"
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdGraph) }}
      />

      <div className="space-y-6">
        <nav aria-label="Breadcrumb" className="text-xs text-slate-600 flex flex-wrap items-center gap-1.5">
          <Link href="/" className="hover:text-slate-900 underline-offset-2 hover:underline">
            Home
          </Link>
          <span aria-hidden="true">&gt;</span>
          <span>Tools</span>
          <span aria-hidden="true">&gt;</span>
          <span className="font-semibold text-slate-900">LLM Selector</span>
        </nav>

        <LlmSelectorClient models={ALL_MODELS} />

        <section
          aria-labelledby="llm-cheat-sheet-heading"
          className="rounded-xl border border-slate-200 bg-white p-4 sm:p-6 space-y-4"
        >
          <div className="space-y-1">
            <div className="text-xs font-bold uppercase tracking-wider text-emerald-800">
              GEO Reference · Declarative Selection Summary
            </div>
            <h2 id="llm-cheat-sheet-heading" className="text-lg sm:text-xl font-bold text-slate-900">
              November 2026 LLM Selection Cheat Sheet
            </h2>
          </div>

          <ul className="list-disc pl-5 space-y-2 text-xs sm:text-sm text-slate-800 leading-relaxed">
            <li>
              <strong>Frontier Agentic Coding &amp; Multi-File Refactoring:</strong> For frontier agentic coding, <strong>Claude Fable 5.2</strong> leads with a <strong>93.3</strong> composite score at <strong>$8.00/$40.00</strong> per 1M tokens (66 tok/s), followed closely by <strong>Gemini 4 Neon</strong> (<strong>91.3</strong>, 115 tok/s) and <strong>GPT-6.2 Astra</strong> (<strong>90.8</strong>, 78 tok/s).
            </li>
            <li>
              <strong>High-Volume, Low-Cost Classification &amp; Extraction:</strong> For high-volume, low-cost classification, <strong>Command R7B</strong> (<strong>$0.04/$0.15</strong> per 1M), <strong>Qwen 3.7 Flash</strong> (<strong>$0.15/$0.60</strong>), and <strong>DeepSeek V4.1 Flash</strong> (<strong>$0.30/$1.20</strong>) deliver top Score/$ efficiency.
            </li>
            <li>
              <strong>Balanced Production Coding &amp; Structured Agents:</strong> <strong>Claude Sonnet 5.5</strong> ($2.00/$10.00 per 1M, 132 tok/s) and <strong>Gemini 4 Carbon</strong> ($2.00/$10.00 per 1M, 155 tok/s) balance strong coding reliability with prompt cache read discounts.
            </li>
            <li>
              <strong>Sub-Second Real-Time Throughput:</strong> For streaming UI, voice pipelines, and fast routing, <strong>Command R7B</strong> (240 tok/s), <strong>GPT-5.4 Nano</strong> (215 tok/s), <strong>Qwen 3.7 Flash</strong> (210 tok/s), and <strong>Gemini 4 Hydrogen</strong> (210 tok/s) lead output speed.
            </li>
          </ul>

          <div className="overflow-x-auto rounded-lg border border-slate-200">
            <table className="w-full text-left border-collapse text-xs">
              <caption className="sr-only">
                November 2026 LLM Selection Cheat Sheet comparing top models per workload category
              </caption>
              <thead>
                <tr className="border-b border-slate-200 bg-slate-100 text-slate-800 font-semibold">
                  <th scope="col" className="py-2.5 px-3">Workload Category</th>
                  <th scope="col" className="py-2.5 px-3">Recommended Leader</th>
                  <th scope="col" className="py-2.5 px-3">Score</th>
                  <th scope="col" className="py-2.5 px-3">API Price (In / Out)</th>
                  <th scope="col" className="py-2.5 px-3">Speed</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/80 font-mono">
                <tr className="bg-white">
                  <th scope="row" className="py-2.5 px-3 font-sans font-semibold text-slate-900">Best for Coding</th>
                  <td className="py-2.5 px-3 font-sans text-slate-900">Claude Fable 5.2</td>
                  <td className="py-2.5 px-3 font-bold text-slate-900">93.3</td>
                  <td className="py-2.5 px-3 text-slate-800">$8.00 / $40.00</td>
                  <td className="py-2.5 px-3 text-emerald-800">66 tok/s</td>
                </tr>
                <tr className="bg-slate-50/60">
                  <th scope="row" className="py-2.5 px-3 font-sans font-semibold text-slate-900">Deep Reasoning &amp; Agents</th>
                  <td className="py-2.5 px-3 font-sans text-slate-900">Gemini 4 Neon</td>
                  <td className="py-2.5 px-3 font-bold text-slate-900">91.3</td>
                  <td className="py-2.5 px-3 text-slate-800">$3.00 / $15.00</td>
                  <td className="py-2.5 px-3 text-emerald-800">115 tok/s</td>
                </tr>
                <tr className="bg-white">
                  <th scope="row" className="py-2.5 px-3 font-sans font-semibold text-slate-900">Low-Cost Classification &amp; RAG</th>
                  <td className="py-2.5 px-3 font-sans text-slate-900">Qwen 3.7 Flash</td>
                  <td className="py-2.5 px-3 font-bold text-slate-900">74.5</td>
                  <td className="py-2.5 px-3 text-slate-800">$0.15 / $0.60</td>
                  <td className="py-2.5 px-3 text-emerald-800">210 tok/s</td>
                </tr>
                <tr className="bg-slate-50/60">
                  <th scope="row" className="py-2.5 px-3 font-sans font-semibold text-slate-900">Fastest Throughput (150+ Tok/s)</th>
                  <td className="py-2.5 px-3 font-sans text-slate-900">Command R7B</td>
                  <td className="py-2.5 px-3 font-bold text-slate-900">68.4</td>
                  <td className="py-2.5 px-3 text-slate-800">$0.04 / $0.15</td>
                  <td className="py-2.5 px-3 text-emerald-800">240 tok/s</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <article className="rounded-xl border border-slate-200 bg-white p-4 sm:p-6 space-y-5 text-xs sm:text-sm text-slate-700 leading-relaxed">
          <div className="space-y-2">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900">
              How to Choose the Right LLM for Production in 2026
            </h2>
            <p>
              Selecting a production large language model requires balancing benchmark accuracy, output token pricing, context window capacity, and latency rather than defaulting to the most expensive flagship model for every endpoint. In real-world applications, output tokens typically cost four to five times more than input tokens, which means verbose responses or uncached system prompts can quickly dominate your monthly cloud bill.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
            <section className="space-y-1.5">
              <h2 className="text-base font-bold text-slate-900">
                1. Best LLMs for Coding &amp; Multi-File Refactoring
              </h2>
              <p>
                Software engineering workflows—such as repository-wide refactoring, test generation, and tool-calling IDE agents—demand high Coding (CO) and Agentic (AG) scores alongside large context windows. Frontier models like Claude Fable 5.2 and GPT-6.2 Astra excel at complex multi-step edits, while Kimi K2.7 Code and Claude Sonnet 5.5 offer strong coding accuracy with lower per-request costs when paired with prompt caching.
              </p>
            </section>

            <section className="space-y-1.5">
              <h2 className="text-base font-bold text-slate-900">
                2. Deep Reasoning &amp; Multi-Step Agentic Workflows
              </h2>
              <p>
                When an application must synthesize long technical documents, verify mathematical logic, or orchestrate multi-turn tool calls, prioritize models with top Reasoning (RE) and Elo ratings. Gemini 4 Neon, Claude Opus 5.5, and Grok 4.6 handle dense analytical workloads reliably, though teams should monitor reasoning token overhead and long-context pricing thresholds above 200K tokens.
              </p>
            </section>

            <section className="space-y-1.5">
              <h2 className="text-base font-bold text-slate-900">
                3. Low-Cost Classification, Tagging &amp; RAG Pipelines
              </h2>
              <p>
                High-volume tasks like support ticket triage, moderation, entity extraction, and semantic reranking rarely benefit from frontier reasoning models. Economy models such as Qwen 3.7 Flash, DeepSeek V4.1 Flash, GPT-5.4 Nano, and Command R7B deliver high Score/$ efficiency and can cut monthly spend by over 85%—especially when combined with 50% Batch API discounts.
              </p>
            </section>

            <section className="space-y-1.5">
              <h2 className="text-base font-bold text-slate-900">
                4. Fastest Speed (150+ Tok/s) for Real-Time UX
              </h2>
              <p>
                Interactive voice assistants, live autocomplete, and user-facing chat interfaces depend on high generation throughput (tokens per second) and low time-to-first-token. Models exceeding 150 to 240 tok/s—including Command R7B, GPT-5.4 Nano, Qwen 3.7 Flash, and Gemini 4 Hydrogen—keep streaming responses instantaneous even under heavy concurrency.
              </p>
            </section>
          </div>

          <div className="pt-4 border-t border-slate-100 space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-slate-900">
              Frequently Asked Questions About Choosing an LLM
            </h2>
            <div className="space-y-2">
              {faqItems.map((item) => (
                <details
                  key={item.q}
                  className="rounded-lg border border-slate-200 bg-slate-50/60 p-3 text-xs sm:text-sm"
                >
                  <summary className="cursor-pointer font-semibold text-slate-900 min-h-[28px] flex items-center">
                    {item.q}
                  </summary>
                  <p className="mt-2 text-slate-700 leading-relaxed">{item.a}</p>
                </details>
              ))}
            </div>
          </div>
        </article>
      </div>
    </SiteShell>
  );
}
