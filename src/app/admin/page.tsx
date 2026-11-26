import type { Metadata } from 'next';
import { SiteShell } from '../../components/SiteShell';
import { AdminAuthGate } from '../../components/AdminAuthGate';
import { RegistryApprovalDashboard } from '../../components/RegistryApprovalDashboard';
import { isAdminPasswordConfigured, isRequestAdminAuthenticated } from '../../lib/adminAuth';
import { ALL_MODELS } from '../../lib/catalog';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Registry Approval Admin | PromptBill',
  description: 'Restricted admin workspace for reviewing and approving PromptBill registry updates.',
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
    },
  },
};

export default async function AdminPage() {
  const authenticated = await isRequestAdminAuthenticated();
  const passwordConfigured = isAdminPasswordConfigured();

  return (
    <SiteShell
      title="PromptBill Admin — Approve Models, Prices & Benchmarks"
      subtitle="promptbill.online/admin · Restricted Registry Approval Workspace"
    >
      <div className="py-2 pb-16">
        <AdminAuthGate
          initialAuthenticated={authenticated}
          passwordConfigured={passwordConfigured}
        >
          <RegistryApprovalDashboard initialModels={ALL_MODELS} />
        </AdminAuthGate>
      </div>
    </SiteShell>
  );
}
