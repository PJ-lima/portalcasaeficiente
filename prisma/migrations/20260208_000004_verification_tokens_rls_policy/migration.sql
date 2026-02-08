BEGIN;

DO $$
BEGIN
  IF to_regclass('public.verification_tokens') IS NOT NULL THEN
    ALTER TABLE public.verification_tokens ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS verification_tokens_deny_anon ON public.verification_tokens;
    DROP POLICY IF EXISTS verification_tokens_deny_authenticated ON public.verification_tokens;

    IF to_regrole('anon') IS NOT NULL THEN
      CREATE POLICY verification_tokens_deny_anon
      ON public.verification_tokens
      FOR ALL
      TO anon
      USING (false)
      WITH CHECK (false);
    END IF;

    IF to_regrole('authenticated') IS NOT NULL THEN
      CREATE POLICY verification_tokens_deny_authenticated
      ON public.verification_tokens
      FOR ALL
      TO authenticated
      USING (false)
      WITH CHECK (false);
    END IF;
  END IF;
END $$;

COMMIT;
