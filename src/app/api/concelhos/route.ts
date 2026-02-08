import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const concelhos = await prisma.concelho.findMany({
      include: {
        distrito: true,
      },
      orderBy: [
        { distrito: { name: 'asc' } },
        { name: 'asc' },
      ],
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
    console.error('Erro ao buscar concelhos:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao buscar concelhos' },
      { status: 500 }
    );
  }
}
