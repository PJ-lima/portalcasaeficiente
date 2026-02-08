import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import {
  evaluateEligibility,
  generateExplanation,
  EligibilityCheck,
  normalizeProgramRules,
} from '@/lib/eligibility-engine';
import { eligibilityCheckSchema } from '@/lib/validations';

// POST /api/eligibility/check - Verificar elegibilidade
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validar dados de entrada
    const validationResult = eligibilityCheckSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Dados inválidos', 
          details: validationResult.error.errors 
        },
        { status: 400 }
      );
    }

    const userData: EligibilityCheck = validationResult.data;

    // 1) Buscar nome do concelho
    const concelho = await prisma.concelho.findUnique({
      where: { id: userData.concelhoId },
      select: { name: true },
    });
    const municipalityName = concelho?.name ?? null;

    // 2) Construir OR geográfico
    const geoOR: Prisma.ProgramWhereInput[] = [
      // Programas nacionais
      {
        geographies: {
          some: { level: 'NATIONAL' },
        },
      },
    ];

    if (municipalityName) {
      // Programas do concelho
      geoOR.push({
        geographies: {
          some: {
            level: 'MUNICIPALITY',
            municipality: municipalityName,
          },
        },
      });
    }

    // 3) Buscar programas disponíveis (nacionais + do concelho)
    const programs = await prisma.program.findMany({
      where: {
        status: { in: ['OPEN', 'PLANNED'] },
        OR: geoOR,
      },
      include: {
        geographies: true,
        versions: { orderBy: { versionDate: 'desc' }, take: 1 },
        sources: true,
      },
    });

    // Para cada programa, extrair regras da versão mais recente e avaliar elegibilidade
    const evaluations = programs.map(program => {
      // Extrair rulesJson da versão mais recente (se existir)
      const latestVersion = program.versions[0];
      const rules = normalizeProgramRules(latestVersion?.rulesJson);
      
      const evaluation = evaluateEligibility(
        program.id,
        program.title,
        rules,
        userData
      );
      
      return {
        program: {
          id: program.id,
          slug: program.slug,
          name: program.title,
          entity: program.entity,
          programType: program.programType,
          status: program.status,
        },
        evaluation,
        explanation: generateExplanation(evaluation),
      };
    });

    // Ordenar por resultado (ELIGIBLE primeiro, depois MAYBE, depois NOT_ELIGIBLE)
    const sortOrder = { ELIGIBLE: 0, MAYBE: 1, NOT_ELIGIBLE: 2 };
    evaluations.sort((a, b) => 
      sortOrder[a.evaluation.result] - sortOrder[b.evaluation.result]
    );

    // Agrupar por resultado
    const grouped = {
      eligible: evaluations.filter(e => e.evaluation.result === 'ELIGIBLE'),
      maybe: evaluations.filter(e => e.evaluation.result === 'MAYBE'),
      notEligible: evaluations.filter(e => e.evaluation.result === 'NOT_ELIGIBLE'),
    };

    return NextResponse.json({
      success: true,
      data: {
        total: evaluations.length,
        summary: {
          eligible: grouped.eligible.length,
          maybe: grouped.maybe.length,
          notEligible: grouped.notEligible.length,
        },
        evaluations,
        grouped,
      },
    });
  } catch (error) {
    console.error('Erro ao verificar elegibilidade:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao verificar elegibilidade' },
      { status: 500 }
    );
  }
}
