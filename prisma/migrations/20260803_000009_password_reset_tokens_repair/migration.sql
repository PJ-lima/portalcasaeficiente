BEGIN;

-- A 20260208_000002 está registada como aplicada em _prisma_migrations na base
-- principal, mas a tabela password_reset_tokens não existe lá (to_regclass devolve
-- NULL, pg_tables zero em qualquer schema): foi dropada depois de aplicada. Como o
-- Prisma já a considera aplicada, o `migrate deploy` nunca a repõe — daí esta
-- migration de reparação. Sem ela, /api/auth/forgot-password e
-- /api/auth/reset-password (SQL cru, sem model Prisma) rebentam em runtime.
-- IF NOT EXISTS por todo o lado: no-op onde a tabela já existe (staging).

CREATE TABLE IF NOT EXISTS "password_reset_tokens" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "token_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "used_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "password_reset_tokens_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "password_reset_tokens_token_hash_key" ON "password_reset_tokens"("token_hash");
CREATE INDEX IF NOT EXISTS "password_reset_tokens_user_id_idx" ON "password_reset_tokens"("user_id");
CREATE INDEX IF NOT EXISTS "password_reset_tokens_expires_at_idx" ON "password_reset_tokens"("expires_at");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'password_reset_tokens_user_id_fkey'
  ) THEN
    ALTER TABLE "password_reset_tokens"
      ADD CONSTRAINT "password_reset_tokens_user_id_fkey"
      FOREIGN KEY ("user_id") REFERENCES "users"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- Mesmas políticas de negação que a 000005 aplica: tabela server-only.
DO $$
BEGIN
  ALTER TABLE public.password_reset_tokens ENABLE ROW LEVEL SECURITY;

  DROP POLICY IF EXISTS password_reset_tokens_deny_anon ON public.password_reset_tokens;
  DROP POLICY IF EXISTS password_reset_tokens_deny_authenticated ON public.password_reset_tokens;

  IF to_regrole('anon') IS NOT NULL THEN
    CREATE POLICY password_reset_tokens_deny_anon
    ON public.password_reset_tokens
    FOR ALL
    TO anon
    USING (false)
    WITH CHECK (false);
  END IF;

  IF to_regrole('authenticated') IS NOT NULL THEN
    CREATE POLICY password_reset_tokens_deny_authenticated
    ON public.password_reset_tokens
    FOR ALL
    TO authenticated
    USING (false)
    WITH CHECK (false);
  END IF;
END $$;

COMMIT;
