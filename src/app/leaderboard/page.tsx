import type { Metadata } from 'next';
import { SiteShell } from '../../components/SiteShell';
import { LeaderboardTableClient } from '../../components/LeaderboardTableClient';

export const metadata: Metadata = {
  title: 'LLM Leaderboard — Benchmark Scores, API Pricing & Speed',
  description:
    'Evidence-aware LLM rankings showing benchmark scores, API token pricing per 1M tokens, throughput, and provenance status on promptbill.online.',
  alternates: {
    canonical: '/leaderboard',
  },
};

export default function LeaderboardPage() {
  return (
    <SiteShell
      title="LLM Leaderboard Rankings, API Pricing & Speed"
      subtitle="promptbill.online/leaderboard · Evidence-Aware Rankings, Pricing & Throughput"
    >
      <LeaderboardTableClient />
    </SiteShell>
  );
}
