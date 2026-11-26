import React from 'react';
import type { Metadata } from 'next';
import modelsJson from '../../data/models.json';
import pendingJson from '../../data/pending-registry.json';
import { SiteShell } from '../../components/SiteShell';
import { AdminRegistryClient, type PendingQueuePayload } from '../../components/AdminRegistryClient';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Registry Approval Admin · PromptBill',
  description: 'Review and approve staged LLM models, pricing updates, and benchmark changes.',
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
};

export default function AdminRegistryPage() {
  const initialModels = Array.isArray(modelsJson) ? modelsJson : [];
  const initialPending: PendingQueuePayload =
    pendingJson && Array.isArray((pendingJson as PendingQueuePayload).items)
      ? (pendingJson as PendingQueuePayload)
      : { updatedAt: null, items: [] };

  return (
    <SiteShell
      title="PromptBill Admin — Approve Models, Prices & Benchmarks"
      subtitle="Review GitHub-staged updates, edit scores/prices if needed, and publish to promptbill.online"
    >
      <AdminRegistryClient initialModels={initialModels} initialPending={initialPending} />
    </SiteShell>
  );
}
