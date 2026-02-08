import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { withRlsContext } from '@/lib/prisma-rls';
import {
  concelhoNamesMatch,
  isValidPostalCodeFormat,
  resolvePostalCode,
} from '@/lib/postal';

// GET /api/dossier - Obter dossiê do utilizador autenticado
export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      );
    }

    const dossier = await withRlsContext(session.user.id, async (tx) =>
      tx.userDossier.findUnique({
        where: { userId: session.user.id },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              nif: true,
            },
          },
        },
      })
    );

    if (!dossier) {
      return NextResponse.json(
        { error: 'Dossiê não encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      dossier,
    });
  } catch (error) {
    console.error('Erro ao buscar dossiê:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar dossiê' },
      { status: 500 }
    );
  }
}

// POST /api/dossier - Criar ou atualizar dossiê do utilizador autenticado
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      address,
      postalCode,
      concelhoId,
      isMainResidence,
      buildingYear,
      propertyType,
      householdSize,
      annualIncome,
      hasSocialTariff,
      isDisabledPerson,
      hasElderly,
      energyCertificate,
    } = body;

    const hasPostalCode = Boolean(postalCode);
    const hasConcelhoId = Boolean(concelhoId);

    if (hasPostalCode !== hasConcelhoId) {
      return NextResponse.json(
        { error: 'Código postal e concelho devem ser fornecidos em conjunto' },
        { status: 400 }
      );
    }

    let postalValidation: {
      match: boolean;
      concelhoExpected: string;
      concelhoResolved: string | null;
      district: string | null;
      locality: string | null;
      source: string;
      stale: boolean;
      postalCacheId: string;
    } | null = null;

    if (hasPostalCode && hasConcelhoId) {
      if (!isValidPostalCodeFormat(postalCode)) {
        return NextResponse.json(
          { error: 'Código postal inválido. Use o formato NNNN-NNN' },
          { status: 400 }
        );
      }

      const concelho = await prisma.concelho.findUnique({
        where: { id: concelhoId },
      });

      if (!concelho) {
        return NextResponse.json(
          { error: 'Concelho inválido' },
          { status: 400 }
        );
      }

      const resolved = await resolvePostalCode(postalCode);

      if (resolved.status === 'not_found') {
        return NextResponse.json(
          { error: 'Código postal não encontrado' },
          { status: 400 }
        );
      }

      if (resolved.status === 'unavailable') {
        return NextResponse.json(
          { error: 'Serviço de validação de código postal indisponível' },
          { status: 503 }
        );
      }

      const concelhoResolved = resolved.cache.concelho;
      const match = Boolean(
        concelhoResolved && concelhoNamesMatch(concelhoResolved, concelho.name)
      );

      postalValidation = {
        match,
        concelhoExpected: concelho.name,
        concelhoResolved,
        district: resolved.cache.distrito,
        locality: resolved.cache.localidade,
        source: resolved.providerStatus,
        stale: resolved.stale,
        postalCacheId: resolved.cache.id,
      };
    }

    const baseCreateData = {
      userId: session.user.id,
      address,
      postalCode,
      concelhoId,
      isMainResidence,
      buildingYear,
      propertyType,
      householdSize,
      annualIncome,
      hasSocialTariff,
      isDisabledPerson,
      hasElderly,
      energyCertificate,
    };

    const baseUpdateData = {
      address,
      postalCode,
      concelhoId,
      isMainResidence,
      buildingYear,
      propertyType,
      householdSize,
      annualIncome,
      hasSocialTariff,
      isDisabledPerson,
      hasElderly,
      energyCertificate,
    };

    // Criar/atualizar dossiê no contexto RLS do utilizador autenticado.
    const dossier = await withRlsContext(session.user.id, async (tx) => {
      const result = await tx.userDossier.upsert({
        where: { userId: session.user.id },
        create: baseCreateData,
        update: baseUpdateData,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      if (postalValidation) {
        await tx.$executeRaw`
          UPDATE "user_dossiers"
          SET
            "postal_cache_id" = ${postalValidation.postalCacheId},
            "postal_validated" = ${postalValidation.match},
            "postal_validated_at" = ${postalValidation.match ? new Date() : null}
          WHERE "id" = ${result.id}
        `;
      }

      return result;
    });

    return NextResponse.json({
      success: true,
      dossier,
      postalValidation,
    });
  } catch (error) {
    console.error('Erro ao salvar dossiê:', error);
    return NextResponse.json(
      { error: 'Erro ao salvar dossiê' },
      { status: 500 }
    );
  }
}
