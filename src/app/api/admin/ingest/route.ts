import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import {
  getAvailableSources,
  isValidIngestSource,
  runIngestion,
  type IngestSourceId,
} from '@/workers/registry';

/**
 * POST /api/admin/ingest
 * Executa ingestão manual de programas
 * Requer role ADMIN
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    // Verificar autenticação e role admin
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      );
    }

    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Acesso negado - requer role ADMIN' },
        { status: 403 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const source = typeof body?.source === 'string' ? body.source : '';

    if (!source || !isValidIngestSource(source)) {
      const availableSources = getAvailableSources();
      return NextResponse.json(
        {
          error: 'Source inválido',
          validSources: availableSources.map((entry) => entry.id),
        },
        { status: 400 }
      );
    }

    const startTime = Date.now();
    const results = await runIngestion(source as IngestSourceId);

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    // Calcular estatísticas agregadas
    const totalStats = results.reduce((acc, r) => {
      if (r.stats) {
        acc.found += r.stats.found || 0;
        acc.new += r.stats.new || 0;
        acc.updated += r.stats.updated || 0;
        acc.skipped += r.stats.skipped || 0;
        acc.errors += r.stats.errors || 0;
      }
      return acc;
    }, { found: 0, new: 0, updated: 0, skipped: 0, errors: 0 });

    return NextResponse.json({
      success: true,
      requestedSource: source,
      duration: `${duration}s`,
      sources: results.map(r => r.source),
      totalStats,
      results,
    });

  } catch (error) {
    console.error('Erro na ingestão:', error);
    return NextResponse.json(
      { 
        error: 'Erro ao executar ingestão',
        details: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/admin/ingest
 * Status e informações sobre ingestão
 */
export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Acesso negado' },
        { status: 403 }
      );
    }

    const availableSources = getAvailableSources();

    return NextResponse.json({
      success: true,
      availableSources,
      usage: {
        endpoint: 'POST /api/admin/ingest',
        body: {
          source: availableSources.map((entry) => entry.id).join(' | '),
        },
        example: {
          source: 'core-nacional',
        },
      },
    });

  } catch {
    return NextResponse.json(
      { error: 'Erro ao obter informações' },
      { status: 500 }
    );
  }
}
