import type { Metadata } from 'next';
import { SiteShell } from '../../components/SiteShell';
import { LeaderboardTableClient } from '../../components/LeaderboardTableClient';

export const metadata: Metadata = {
  title: 'LLM Leaderboard — Benchmark Scores, API Pricing & Speed',
  description:
    'Compare LLM benchmark scores, Elo ratings, input/output API pricing per 1M tokens, context windows, and tokens per second on promptbill.online.',
  alternates: {
    canonical: '/leaderboard',
  },
};

export default function LeaderboardPage() {
  return (
    <SiteShell
      title="LLM Leaderboard Rankings, API Pricing & Speed"
      subtitle="promptbill.online/leaderboard · Benchmark Scores, Score/$ Value & Throughput"
    >
      <LeaderboardTableClient />
    </SiteShell>
  );
}
