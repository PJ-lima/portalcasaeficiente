import { isLegalIdentityComplete } from '@/lib/legal';

/**
 * Aviso visível enquanto a identificação legal em src/lib/legal.ts estiver por
 * preencher. Existe para o site não ir para produção com um documento legal
 * incompleto sem ninguém dar por isso.
 */
export function LegalPlaceholderNotice() {
  if (isLegalIdentityComplete()) return null;

  return (
    <div className="rounded-xl border border-sun-300 bg-sun-100 p-4">
      <p className="text-sm font-semibold text-sun-foreground">
        Documento por finalizar
      </p>
      <p className="mt-1 text-sm text-sun-foreground">
        A identificação do responsável pelo tratamento de dados ainda não foi
        preenchida (<code>src/lib/legal.ts</code>). Este documento não está
        pronto para produção.
      </p>
    </div>
  );
}
