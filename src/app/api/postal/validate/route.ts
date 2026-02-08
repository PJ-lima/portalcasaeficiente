import { NextRequest, NextResponse } from 'next/server';
import {
  concelhoNamesMatch,
  findConcelhoSuggestionByName,
  isValidPostalCodeFormat,
  resolvePostalCode,
} from '@/lib/postal';

// POST /api/postal/validate
export async function POST(req: NextRequest) {
  try {
    const { postalCode, concelho } = await req.json();

    // 1) Validar formato PT (CP7)
    if (!isValidPostalCodeFormat(postalCode)) {
      return NextResponse.json({
        ok: false,
        reason: 'Formato inválido (use NNNN-NNN)',
      }, { status: 400 });
    }

    // 2) Resolver código postal (cache + TTL + provider)
    const resolved = await resolvePostalCode(postalCode);

    if (resolved.status === 'not_found') {
      return NextResponse.json({
        ok: false,
        reason: 'Código postal não encontrado',
      }, { status: 404 });
    }

    if (resolved.status === 'unavailable') {
      return NextResponse.json({
        ok: false,
        reason: 'Serviço de validação temporariamente indisponível',
      }, { status: 503 });
    }

    // 3) Resolver concelho interno e validar match opcional
    const concelhoResolved = resolved.cache.concelho;
    const suggestion = await findConcelhoSuggestionByName(concelhoResolved);

    let match = true;
    if (concelho) {
      match = concelhoResolved ? concelhoNamesMatch(concelhoResolved, concelho) : false;
    }

    const valid = Boolean(suggestion);

    return NextResponse.json({
      ok: true,
      valid,
      match,
      postalCode,
      concelhoInput: concelho || null,
      concelhoResolved,
      distrito: resolved.cache.distrito,
      localidade: resolved.cache.localidade,
      validationSource: resolved.providerStatus,
      stale: resolved.stale,
      fromCache: resolved.fromCache,
      expiresAt: resolved.cache.expiresAt,
      reason: valid ? null : 'Código postal resolvido, mas concelho não encontrado na base interna',
      suggestion,
    });
  } catch (error) {
    console.error('Erro ao validar código postal:', error);
    return NextResponse.json({
      ok: false,
      reason: 'Erro interno do servidor'
    }, { status: 500 });
  }
}
