export interface SchemaModelInput {
  name: string;
  slug: string;
  provider: string;
  inputPer1M: number | null;
  outputPer1M: number | null;
  cachedInputPer1M: number | null;
  contextWindow: string | null;
  score: number | null;
  tokPerSec: number | null;
  license?: string | null;
}

export function buildHomeSchema() {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        '@id': 'https://promptbill.online/#website',
        url: 'https://promptbill.online',
        name: 'PromptBill',
        description:
          'Live LLM API token pricing reference, evidence-aware benchmark leaderboard, token counter, and hybrid model routing simulator.',
        potentialAction: {
          '@type': 'SearchAction',
          target: 'https://promptbill.online/models?q={search_term_string}',
          'query-input': 'required name=search_term_string',
        },
      },
      {
        '@type': 'Organization',
        '@id': 'https://promptbill.online/#organization',
        name: 'PromptBill',
        url: 'https://promptbill.online',
        sameAs: [
          'https://github.com/ZmLone/tokenledger',
          'https://dev.to/zmlone',
        ],
      },
    ],
  };
}

export function buildModelSchema(m: SchemaModelInput) {
  const url = `https://promptbill.online/models/${m.slug}`;
  const hasPrice =
    typeof m.inputPer1M === 'number' &&
    Number.isFinite(m.inputPer1M) &&
    typeof m.outputPer1M === 'number' &&
    Number.isFinite(m.outputPer1M);

  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://promptbill.online' },
          { '@type': 'ListItem', position: 2, name: 'Models', item: 'https://promptbill.online/models' },
          { '@type': 'ListItem', position: 3, name: m.name, item: url },
        ],
      },
      {
        '@type': 'SoftwareApplication',
        name: m.name,
        applicationCategory: 'DeveloperApplication',
        operatingSystem: 'Cloud API',
        author: { '@type': 'Organization', name: m.provider },
        url,
        ...(hasPrice
          ? {
              offers: {
                '@type': 'Offer',
                priceCurrency: 'USD',
                price: m.inputPer1M!.toFixed(2),
                description: `$${m.inputPer1M!.toFixed(2)} per 1M input tokens, $${m.outputPer1M!.toFixed(2)} per 1M output tokens`,
                url,
              },
            }
          : {}),
      },
      {
        '@type': 'FAQPage',
        mainEntity: [
          {
            '@type': 'Question',
            name: `How much does ${m.name} API cost per 1 million tokens?`,
            acceptedAnswer: {
              '@type': 'Answer',
              text: hasPrice
                ? `${m.name} by ${m.provider} costs $${m.inputPer1M!.toFixed(2)} per 1M input tokens and $${m.outputPer1M!.toFixed(2)} per 1M output tokens${typeof m.cachedInputPer1M === 'number' && Number.isFinite(m.cachedInputPer1M) ? `, with cached input reads at $${m.cachedInputPer1M.toFixed(2)} per 1M tokens` : ''}.`
                : `Pricing for ${m.name} by ${m.provider} is tracked on PromptBill with provenance status updates.`,
            },
          },
          {
            '@type': 'Question',
            name: `What is ${m.name}'s context window and throughput?`,
            acceptedAnswer: {
              '@type': 'Answer',
              text: `${m.name} supports a ${m.contextWindow ?? 'tracked'} context window${typeof m.tokPerSec === 'number' && Number.isFinite(m.tokPerSec) ? ` and averages ${m.tokPerSec} tokens per second` : ''}${typeof m.score === 'number' && Number.isFinite(m.score) ? `, with a PromptBill composite benchmark score of ${m.score.toFixed(1)}` : ''}.`,
            },
          },
        ],
      },
    ],
  };
}

export function buildCompareSchema(a: SchemaModelInput, b: SchemaModelInput) {
  const url = `https://promptbill.online/compare/${a.slug}-vs-${b.slug}`;
  const aCost =
    typeof a.inputPer1M === 'number' && typeof a.outputPer1M === 'number'
      ? `$${a.inputPer1M.toFixed(2)}/$${a.outputPer1M.toFixed(2)} per 1M input/output tokens`
      : 'tracked pricing';
  const bCost =
    typeof b.inputPer1M === 'number' && typeof b.outputPer1M === 'number'
      ? `$${b.inputPer1M.toFixed(2)}/$${b.outputPer1M.toFixed(2)} per 1M input/output tokens`
      : 'tracked pricing';

  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://promptbill.online' },
          { '@type': 'ListItem', position: 2, name: 'Compare', item: 'https://promptbill.online/compare' },
          { '@type': 'ListItem', position: 3, name: `${a.name} vs ${b.name}`, item: url },
        ],
      },
      {
        '@type': 'FAQPage',
        mainEntity: [
          {
            '@type': 'Question',
            name: `How do ${a.name} and ${b.name} compare on API pricing?`,
            acceptedAnswer: {
              '@type': 'Answer',
              text: `${a.name} (${a.provider}) is priced at ${aCost}, while ${b.name} (${b.provider}) is priced at ${bCost} on PromptBill.`,
            },
          },
          {
            '@type': 'Question',
            name: `What is the difference in context window and benchmark score between ${a.name} and ${b.name}?`,
            acceptedAnswer: {
              '@type': 'Answer',
              text: `${a.name} offers a ${a.contextWindow ?? 'tracked'} context window (score ${typeof a.score === 'number' ? a.score.toFixed(1) : 'N/A'}), compared to ${b.name} with a ${b.contextWindow ?? 'tracked'} context window (score ${typeof b.score === 'number' ? b.score.toFixed(1) : 'N/A'}).`,
            },
          },
        ],
      },
    ],
  };
}
