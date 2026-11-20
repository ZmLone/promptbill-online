import { SeverityNumber } from '@opentelemetry/api-logs';
import { after, NextResponse } from 'next/server';
import { pricingSyncLogger, loggerProvider } from '../../../../instrumentation';
import { syncLivePricingFromOpenRouter } from '@/lib/openrouterSync';

export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization');
  if (
    process.env.CRON_SECRET &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  pricingSyncLogger.emit({
    body: 'pricing_sync_started',
    severityNumber: SeverityNumber.INFO,
    attributes: { endpoint: '/api/sync-pricing', method: 'GET' },
  });

  try {
    const count = await syncLivePricingFromOpenRouter();
    pricingSyncLogger.emit({
      body: 'pricing_sync_completed',
      severityNumber: SeverityNumber.INFO,
      attributes: { synced_model_count: count },
    });

    after(async () => {
      await loggerProvider.forceFlush().catch(() => {});
    });

    return NextResponse.json({
      synced: count,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    pricingSyncLogger.emit({
      body: 'pricing_sync_failed',
      severityNumber: SeverityNumber.ERROR,
      attributes: {
        error_type: err instanceof Error ? err.name : 'unknown_error',
      },
    });

    after(async () => {
      await loggerProvider.forceFlush().catch(() => {});
    });

    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Sync failed' },
      { status: 500 }
    );
  }
}
