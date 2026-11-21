import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const jetbrainsMono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono' });

export const metadata: Metadata = {
  metadataBase: new URL('https://promptbill.online'),
  title: 'PromptBill — AI API Token & LLM Cost Calculator (Nov 2026)',
  description:
    'Calculate exact monthly AI API costs across 18+ models from OpenAI, Anthropic Claude, Google Gemini, xAI Grok, Kimi, DeepSeek, and Qwen. Includes live prompt tokenizer, Score/$, caching, batch discounts, and routing savings.',
  verification: {
    google: 'i9trpcokzTtM4Y2evn9hZYidXlKhAEyrPraQWuj3FA8',
  },
  openGraph: {
    title: 'PromptBill — AI API Token & LLM Cost Calculator',
    description:
      'Compare LLM API token rates, paste raw prompts to count tokens, model routing savings, and check SaaS gross margins in real time.',
    url: 'https://promptbill.online',
    siteName: 'PromptBill',
    type: 'website',
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'PromptBill',
  applicationCategory: 'DeveloperApplication',
  operatingSystem: 'Web',
  url: 'https://promptbill.online',
  description:
    'Interactive LLM API cost calculator, live prompt tokenizer, multi-model comparison matrix, and model routing simulator.',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'USD',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable} dark`}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="bg-[#080b12] text-slate-100 font-sans antialiased">{children}</body>
    </html>
  );
}
