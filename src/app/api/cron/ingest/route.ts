import { NextRequest, NextResponse } from 'next/server';
import { runIngestion } from '@/workers/registry';

/**
 * GET /api/cron/ingest
 * Endpoint triggered by Vercel Cron
 * Secured by CRON_SECRET header
 */
export async function GET(request: NextRequest) {
  // Verify Vercel Cron Secret
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  const { searchParams } = new URL(request.url);
  const source = searchParams.get('source') || 'all';

  try {
    const results = await runIngestion(source as any);
    
    // Calculate stats
    const stats = results.reduce((acc, r) => {
      if (r.stats) {
        acc.found += r.stats.found || 0;
        acc.new += r.stats.new || 0;
        acc.errors += r.stats.errors || 0;
      }
      return acc;
    }, { found: 0, new: 0, errors: 0 });

    return NextResponse.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Cron job failed:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
