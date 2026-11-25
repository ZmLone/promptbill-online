import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://promptbill.online'),
  title: {
    default: 'PromptBill — LLM API Pricing & Token Calculator',
    template: '%s · PromptBill',
  },
  description:
    'LLM API pricing comparison, token cost calculator, and model benchmark table with transparent provenance on PromptBill.',
  openGraph: {
    title: 'PromptBill — LLM API Pricing & Token Calculator',
    description:
      'LLM API pricing comparison, token cost calculator, and model benchmark table with transparent provenance on PromptBill.',
    url: 'https://promptbill.online',
    siteName: 'PromptBill',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PromptBill — LLM API Pricing & Token Calculator',
    description:
      'LLM API pricing comparison, token cost calculator, and model benchmark table with transparent provenance on PromptBill.',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
