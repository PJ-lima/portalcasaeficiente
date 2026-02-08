import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/concelhos/search?q=Lisboa
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q') || '';

    if (query.length < 2) {
      return NextResponse.json({
        success: true,
        data: [],
      });
    }

    const concelhos = await prisma.concelho.findMany({
      where: {
        name: {
          contains: query,
          mode: 'insensitive',
        },
      },
      include: {
        distrito: true,
      },
      take: 20,
      orderBy: {
        name: 'asc',
      },
    });

    return NextResponse.json({
      success: true,
      data: concelhos.map(c => ({
        id: c.id,
        name: c.name,
        distrito: c.distrito.name,
        label: `${c.name} (${c.distrito.name})`,
      })),
    });
  } catch (error) {
    console.error('Erro ao pesquisar concelhos:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao pesquisar concelhos' },
      { status: 500 }
    );
  }
}
