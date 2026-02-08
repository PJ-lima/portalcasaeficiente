BEGIN;

-- Internal Prisma metadata table: server-only access.
DO $$
BEGIN
  IF to_regclass('public._prisma_migrations') IS NOT NULL THEN
    ALTER TABLE public._prisma_migrations ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS prisma_migrations_deny_anon ON public._prisma_migrations;
    DROP POLICY IF EXISTS prisma_migrations_deny_authenticated ON public._prisma_migrations;

    IF to_regrole('anon') IS NOT NULL THEN
      CREATE POLICY prisma_migrations_deny_anon
      ON public._prisma_migrations
      FOR ALL
      TO anon
      USING (false)
      WITH CHECK (false);
    END IF;

    IF to_regrole('authenticated') IS NOT NULL THEN
      CREATE POLICY prisma_migrations_deny_authenticated
      ON public._prisma_migrations
      FOR ALL
      TO authenticated
      USING (false)
      WITH CHECK (false);
    END IF;
  END IF;
END $$;

-- Password reset tokens are server-only and must not be accessible to client roles.
DO $$
BEGIN
  IF to_regclass('public.password_reset_tokens') IS NOT NULL THEN
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
  END IF;
END $$;

COMMIT;
