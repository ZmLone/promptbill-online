import type { Metadata } from 'next';
import { LeaderboardClient } from '../components/LeaderboardClient';

export const metadata: Metadata = {
  alternates: {
    canonical: '/',
  },
};

export default function LeaderboardPage() {
  return <LeaderboardClient />;
}
