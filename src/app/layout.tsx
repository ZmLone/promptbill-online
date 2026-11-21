import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const jetbrainsMono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono' });

export const metadata: Metadata = {
  metadataBase: new URL('https://promptbill.online'),
  title: 'PromptBill — AI API Token & LLM Cost Calculator (Nov 2026)',
  description:
    'Calculate exact monthly AI API costs across OpenAI, Anthropic Claude, Google Gemini, DeepSeek, and OpenRouter. Includes prompt caching, batch discounts, reasoning tokens, retries, and routing savings.',
  verification: {
    google: 'i9trpcokzTtM4Y2evn9hZYidXlKhAEyrPraQWuj3FA8',
  },
  openGraph: {
    title: 'PromptBill — AI API Token & LLM Cost Calculator',
    description:
      'Compare LLM API token rates, model routing savings, prompt caching, batch pricing, and monthly unit economics in real time.',
    url: 'https://promptbill.online',
    siteName: 'PromptBill',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable} dark`}>
      <body className="bg-[#080b12] text-slate-100 font-sans antialiased">{children}</body>
    </html>
  );
}
