import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { withRlsContext } from '@/lib/prisma-rls';

/**
 * POST /api/programs/[slug]/save
 * Guardar programa nos favoritos do utilizador autenticado
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      );
    }

    const { slug } = await params;
    const body = await request.json().catch(() => ({}));
    const { notes } = body;

    // Verificar se o programa existe e obter o ID
    const program = await prisma.program.findUnique({
      where: { slug },
    });

    if (!program) {
      return NextResponse.json(
        { error: 'Programa não encontrado' },
        { status: 404 }
      );
    }

    // Guardar programa (upsert para evitar duplicados)
    const savedProgram = await withRlsContext(session.user.id, async (tx) =>
      tx.userSavedProgram.upsert({
        where: {
          userId_programId: {
            userId: session.user.id,
            programId: program.id,
          },
        },
        create: {
          userId: session.user.id,
          programId: program.id,
          notes: notes || null,
        },
        update: {
          notes: notes || null,
          savedAt: new Date(), // Atualizar data se já existir
        },
        include: {
          program: {
            select: {
              id: true,
              slug: true,
              title: true,
              entity: true,
              programType: true,
              status: true,
              summary: true,
            },
          },
        },
      })
    );

    return NextResponse.json({
      success: true,
      saved: savedProgram,
    });
  } catch (error) {
    console.error('Erro ao guardar programa:', error);
    return NextResponse.json(
      { error: 'Erro ao guardar programa' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/programs/[slug]/save
 * Remover programa dos favoritos do utilizador autenticado
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      );
    }

    const { slug } = await params;

    // Buscar programa para obter o ID
    const program = await prisma.program.findUnique({
      where: { slug },
      select: { id: true },
    });

    if (!program) {
      return NextResponse.json(
        { error: 'Programa não encontrado' },
        { status: 404 }
      );
    }

    // Tentar remover
    const deleted = await withRlsContext(session.user.id, async (tx) =>
      tx.userSavedProgram.deleteMany({
        where: {
          userId: session.user.id,
          programId: program.id,
        },
      })
    );

    if (deleted.count === 0) {
      return NextResponse.json(
        { error: 'Programa não estava guardado' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Programa removido dos favoritos',
    });
  } catch (error) {
    console.error('Erro ao remover programa:', error);
    return NextResponse.json(
      { error: 'Erro ao remover programa' },
      { status: 500 }
    );
  }
}
