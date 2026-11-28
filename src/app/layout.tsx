import type { Metadata, Viewport } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-inter',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-jetbrains-mono',
  display: 'swap',
});

const BASE_URL = 'https://promptbill.online';

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: 'PromptBill — LLM API Pricing, Token Cost Calculator & Benchmark Catalog',
    template: '%s | PromptBill',
  },
  description:
    'Compare LLM API token pricing per 1M tokens, benchmark scores, inference endpoints, and 30-day API spend across providers on PromptBill.',
  alternates: {
    canonical: BASE_URL,
  },
  openGraph: {
    type: 'website',
    url: BASE_URL,
    siteName: 'PromptBill',
    title: 'PromptBill — LLM API Pricing, Token Cost Calculator & Benchmark Catalog',
    description:
      'Compare LLM API token pricing per 1M tokens, benchmark scores, inference endpoints, and 30-day API spend across providers on PromptBill.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PromptBill — LLM API Pricing, Token Cost Calculator & Benchmark Catalog',
    description:
      'Compare LLM API token pricing per 1M tokens, benchmark scores, inference endpoints, and 30-day API spend across providers on PromptBill.',
  },
};

export const viewport: Viewport = {
  themeColor: '#ffffff',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body className="min-h-screen bg-white text-slate-950 font-sans antialiased selection:bg-slate-900 selection:text-white">
        {children}
      </body>
    </html>
  );
}
