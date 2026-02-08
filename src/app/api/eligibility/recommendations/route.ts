import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { withRlsContext } from '@/lib/prisma-rls';

/**
 * GET /api/eligibility/recommendations
 * Retorna programas recomendados para o utilizador autenticado com base no seu dossiê
 */
export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      );
    }

    // Buscar dossiê do utilizador autenticado
    const userDossier = await withRlsContext(session.user.id, async (tx) =>
      tx.userDossier.findUnique({
        where: { userId: session.user.id },
      })
    );

    if (!userDossier) {
      return NextResponse.json(
        { error: 'Utilizador não tem dossiê criado' },
        { status: 404 }
      );
    }

    // Buscar concelho
    const concelho = userDossier.concelhoId 
      ? await prisma.concelho.findUnique({
          where: { id: userDossier.concelhoId },
        })
      : null;

    // Buscar programas NACIONAIS + do concelho do utilizador (via ProgramGeography)
    const programs = await prisma.program.findMany({
      where: {
        status: 'OPEN',
        OR: [
          { programType: 'NATIONAL' },
          {
            programType: 'MUNICIPAL',
            geographies: {
              some: {
                // Comparação normalizada - resolver depois com FK
                municipality: concelho?.name,
              },
            },
          },
        ],
      },
      include: {
        versions: {
          orderBy: { versionDate: 'desc' },
          take: 1,
        },
        geographies: true,
      },
    });

    type RecommendationResult = 'ELIGIBLE' | 'MAYBE' | 'NOT_ELIGIBLE';
    type RecommendationItem = {
      program: {
        id: string;
        slug: string;
        title: string;
        entity: string | null;
        programType: string;
        status: string;
        summary: string | null;
        officialUrl: string | null;
        geographies: typeof programs[number]['geographies'];
      };
      evaluation: {
        result: RecommendationResult;
        score: number;
        summary: string;
        evaluations: unknown[];
      };
    };

    // Mock evaluation - TODO: implementar avaliação real com eligibility-engine.ts
    const evaluations: RecommendationItem[] = programs.map((program) => {
      // Score simplificado baseado em tipo de programa
      let score = 50;
      let result: RecommendationResult = 'MAYBE';
      
      if (program.programType === 'NATIONAL') {
        score = 75;
        result = 'ELIGIBLE';
      } else if (program.programType === 'MUNICIPAL') {
        score = 60;
        result = 'MAYBE';
      }

      return {
        program: {
          id: program.id,
          slug: program.slug,
          title: program.title,
          entity: program.entity,
          programType: program.programType,
          status: program.status,
          summary: program.summary,
          officialUrl: program.officialUrl,
          geographies: program.geographies,
        },
        evaluation: {
          result,
          score,
          summary: `Programa ${result === 'ELIGIBLE' ? 'recomendado' : 'possível'} com base no seu perfil.`,
          evaluations: [],
        },
      };
    });

    // Ordenar por score (maior para menor) e depois por resultado
    const resultOrder: Record<string, number> = { ELIGIBLE: 0, MAYBE: 1, NOT_ELIGIBLE: 2 };
    evaluations.sort((a, b) => {
      if (a.evaluation.result !== b.evaluation.result) {
        return resultOrder[a.evaluation.result] - resultOrder[b.evaluation.result];
      }
      return b.evaluation.score - a.evaluation.score;
    });

    return NextResponse.json({
      user: {
        concelho: concelho?.name || 'Não especificado',
        hasMainResidence: userDossier.isMainResidence,
      },
      recommendations: evaluations,
      total: evaluations.length,
      eligible: evaluations.filter((evaluation) => evaluation.evaluation.result === 'ELIGIBLE').length,
      maybe: evaluations.filter((evaluation) => evaluation.evaluation.result === 'MAYBE').length,
      notEligible: evaluations.filter((evaluation) => evaluation.evaluation.result === 'NOT_ELIGIBLE').length,
    });
  } catch (error) {
    console.error('Erro ao calcular recomendações:', error);
    return NextResponse.json(
      { error: 'Erro ao calcular recomendações' },
      { status: 500 }
    );
  }
}
