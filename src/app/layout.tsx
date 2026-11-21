import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const jetbrainsMono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono' });

export const metadata: Metadata = {
  metadataBase: new URL('https://promptbill.online'),
  title: 'PromptBill — LLM Leaderboard, Model Comparisons & API Cost Calculator',
  description:
    'Dedicated model pages, head-to-head comparisons, provider hubs, coding LLM rankings, and 30-day API cost calculators on promptbill.online.',
  alternates: {
    canonical: 'https://promptbill.online/',
  },
  verification: {
    google: 'i9trpcokzTtM4Y2evn9hZYidXlKhAEyrPraQWuj3FA8',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body className="bg-[#f8fafc] text-slate-900 font-sans antialiased">{children}</body>
    </html>
  );
}
