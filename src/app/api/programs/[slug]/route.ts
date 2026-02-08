import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/programs/[slug] - Detalhes de um programa
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    const program = await prisma.program.findUnique({
      where: { slug },
      include: {
        geographies: true,
        sources: true,
        versions: {
          orderBy: { versionDate: 'desc' },
          take: 5,
        },
      },
    });

    if (!program) {
      return NextResponse.json(
        { success: false, error: 'Programa não encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: program,
    });
  } catch (error) {
    console.error('Erro ao buscar programa:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao buscar programa' },
      { status: 500 }
    );
  }
}
