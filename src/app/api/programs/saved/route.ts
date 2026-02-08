import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { withRlsContext } from '@/lib/prisma-rls';

/**
 * GET /api/programs/saved
 * Listar programas guardados pelo utilizador autenticado
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

    // Buscar programas guardados
    const savedPrograms = await withRlsContext(session.user.id, async (tx) =>
      tx.userSavedProgram.findMany({
        where: {
          userId: session.user.id,
        },
        include: {
          program: {
            include: {
              geographies: true,
              versions: {
                orderBy: { versionDate: 'desc' },
                take: 1,
              },
            },
          },
        },
        orderBy: {
          savedAt: 'desc',
        },
      })
    );

    // Formatar resposta
    const formattedPrograms = savedPrograms.map((saved) => ({
      savedId: saved.id,
      savedAt: saved.savedAt,
      notes: saved.notes,
      program: {
        id: saved.program.id,
        slug: saved.program.slug,
        title: saved.program.title,
        entity: saved.program.entity,
        programType: saved.program.programType,
        status: saved.program.status,
        summary: saved.program.summary,
        officialUrl: saved.program.officialUrl,
        geographies: saved.program.geographies,
        latestVersion: saved.program.versions[0] || null,
      },
    }));

    return NextResponse.json({
      success: true,
      programs: formattedPrograms,
      total: formattedPrograms.length,
    });
  } catch (error) {
    console.error('Erro ao buscar programas guardados:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar programas guardados' },
      { status: 500 }
    );
  }
}
