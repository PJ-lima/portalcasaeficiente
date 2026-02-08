BEGIN;

-- Public read-only table: concelhos
DO $$
DECLARE
  pol RECORD;
BEGIN
  IF to_regclass('public.concelhos') IS NOT NULL THEN
    EXECUTE 'ALTER TABLE public.concelhos ENABLE ROW LEVEL SECURITY';

    FOR pol IN
      SELECT policyname
      FROM pg_policies
      WHERE schemaname = 'public' AND tablename = 'concelhos'
    LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.concelhos', pol.policyname);
    END LOOP;

    EXECUTE 'CREATE POLICY concelhos_public_read ON public.concelhos FOR SELECT TO anon, authenticated USING (true)';
  END IF;
END $$;

-- Public read-only table: distritos
DO $$
DECLARE
  pol RECORD;
BEGIN
  IF to_regclass('public.distritos') IS NOT NULL THEN
    EXECUTE 'ALTER TABLE public.distritos ENABLE ROW LEVEL SECURITY';

    FOR pol IN
      SELECT policyname
      FROM pg_policies
      WHERE schemaname = 'public' AND tablename = 'distritos'
    LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.distritos', pol.policyname);
    END LOOP;

    EXECUTE 'CREATE POLICY distritos_public_read ON public.distritos FOR SELECT TO anon, authenticated USING (true)';
  END IF;
END $$;

-- Public read-only table: postal_code_cache
DO $$
DECLARE
  pol RECORD;
BEGIN
  IF to_regclass('public.postal_code_cache') IS NOT NULL THEN
    EXECUTE 'ALTER TABLE public.postal_code_cache ENABLE ROW LEVEL SECURITY';

    FOR pol IN
      SELECT policyname
      FROM pg_policies
      WHERE schemaname = 'public' AND tablename = 'postal_code_cache'
    LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.postal_code_cache', pol.policyname);
    END LOOP;

    EXECUTE 'CREATE POLICY postal_code_cache_public_read ON public.postal_code_cache FOR SELECT TO anon, authenticated USING (true)';
  END IF;
END $$;

-- Public read-only table: program_geographies (fallback: program_geography)
DO $$
DECLARE
  pol RECORD;
BEGIN
  IF to_regclass('public.program_geographies') IS NOT NULL THEN
    EXECUTE 'ALTER TABLE public.program_geographies ENABLE ROW LEVEL SECURITY';

    FOR pol IN
      SELECT policyname
      FROM pg_policies
      WHERE schemaname = 'public' AND tablename = 'program_geographies'
    LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.program_geographies', pol.policyname);
    END LOOP;

    EXECUTE 'CREATE POLICY program_geographies_public_read ON public.program_geographies FOR SELECT TO anon, authenticated USING (true)';
  ELSIF to_regclass('public.program_geography') IS NOT NULL THEN
    EXECUTE 'ALTER TABLE public.program_geography ENABLE ROW LEVEL SECURITY';

    FOR pol IN
      SELECT policyname
      FROM pg_policies
      WHERE schemaname = 'public' AND tablename = 'program_geography'
    LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.program_geography', pol.policyname);
    END LOOP;

    EXECUTE 'CREATE POLICY program_geography_public_read ON public.program_geography FOR SELECT TO anon, authenticated USING (true)';
  END IF;
END $$;

-- Public read-only table: program_versions
DO $$
DECLARE
  pol RECORD;
BEGIN
  IF to_regclass('public.program_versions') IS NOT NULL THEN
    EXECUTE 'ALTER TABLE public.program_versions ENABLE ROW LEVEL SECURITY';

    FOR pol IN
      SELECT policyname
      FROM pg_policies
      WHERE schemaname = 'public' AND tablename = 'program_versions'
    LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.program_versions', pol.policyname);
    END LOOP;

    EXECUTE 'CREATE POLICY program_versions_public_read ON public.program_versions FOR SELECT TO anon, authenticated USING (true)';
  END IF;
END $$;

-- Public read-only table: programs
DO $$
DECLARE
  pol RECORD;
BEGIN
  IF to_regclass('public.programs') IS NOT NULL THEN
    EXECUTE 'ALTER TABLE public.programs ENABLE ROW LEVEL SECURITY';

    FOR pol IN
      SELECT policyname
      FROM pg_policies
      WHERE schemaname = 'public' AND tablename = 'programs'
    LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.programs', pol.policyname);
    END LOOP;

    EXECUTE 'CREATE POLICY programs_public_read ON public.programs FOR SELECT TO anon, authenticated USING (true)';
  END IF;
END $$;

-- Public read-only table: sources
DO $$
DECLARE
  pol RECORD;
BEGIN
  IF to_regclass('public.sources') IS NOT NULL THEN
    EXECUTE 'ALTER TABLE public.sources ENABLE ROW LEVEL SECURITY';

    FOR pol IN
      SELECT policyname
      FROM pg_policies
      WHERE schemaname = 'public' AND tablename = 'sources'
    LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.sources', pol.policyname);
    END LOOP;

    EXECUTE 'CREATE POLICY sources_public_read ON public.sources FOR SELECT TO anon, authenticated USING (true)';
  END IF;
END $$;

-- User-owned table: users
DO $$
DECLARE
  pol RECORD;
  owner_expr TEXT;
BEGIN
  IF to_regclass('public.users') IS NOT NULL THEN
    EXECUTE 'ALTER TABLE public.users ENABLE ROW LEVEL SECURITY';

    FOR pol IN
      SELECT policyname
      FROM pg_policies
      WHERE schemaname = 'public' AND tablename = 'users'
    LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.users', pol.policyname);
    END LOOP;

    IF EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'users'
        AND column_name = 'id'
    ) THEN
      owner_expr := 'current_setting(''request.jwt.claim.sub'', true) IS NOT NULL AND id = current_setting(''request.jwt.claim.sub'', true)';
    END IF;

    IF owner_expr IS NOT NULL THEN
      EXECUTE format('CREATE POLICY users_select_own ON public.users FOR SELECT TO authenticated USING (%s)', owner_expr);
      EXECUTE format('CREATE POLICY users_insert_own ON public.users FOR INSERT TO authenticated WITH CHECK (%s)', owner_expr);
      EXECUTE format('CREATE POLICY users_update_own ON public.users FOR UPDATE TO authenticated USING (%s) WITH CHECK (%s)', owner_expr, owner_expr);
      EXECUTE format('CREATE POLICY users_delete_own ON public.users FOR DELETE TO authenticated USING (%s)', owner_expr);
    END IF;
  END IF;
END $$;

-- User-owned table: user_dossiers
DO $$
DECLARE
  pol RECORD;
  owner_expr TEXT;
BEGIN
  IF to_regclass('public.user_dossiers') IS NOT NULL THEN
    EXECUTE 'ALTER TABLE public.user_dossiers ENABLE ROW LEVEL SECURITY';

    FOR pol IN
      SELECT policyname
      FROM pg_policies
      WHERE schemaname = 'public' AND tablename = 'user_dossiers'
    LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.user_dossiers', pol.policyname);
    END LOOP;

    IF EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'user_dossiers'
        AND column_name = 'user_id'
    ) THEN
      owner_expr := 'current_setting(''request.jwt.claim.sub'', true) IS NOT NULL AND user_id = current_setting(''request.jwt.claim.sub'', true)';
    ELSIF EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'user_dossiers'
        AND column_name = 'userId'
    ) THEN
      owner_expr := 'current_setting(''request.jwt.claim.sub'', true) IS NOT NULL AND "userId" = current_setting(''request.jwt.claim.sub'', true)';
    END IF;

    IF owner_expr IS NOT NULL THEN
      EXECUTE format('CREATE POLICY user_dossiers_select_own ON public.user_dossiers FOR SELECT TO authenticated USING (%s)', owner_expr);
      EXECUTE format('CREATE POLICY user_dossiers_insert_own ON public.user_dossiers FOR INSERT TO authenticated WITH CHECK (%s)', owner_expr);
      EXECUTE format('CREATE POLICY user_dossiers_update_own ON public.user_dossiers FOR UPDATE TO authenticated USING (%s) WITH CHECK (%s)', owner_expr, owner_expr);
      EXECUTE format('CREATE POLICY user_dossiers_delete_own ON public.user_dossiers FOR DELETE TO authenticated USING (%s)', owner_expr);
    END IF;
  END IF;
END $$;

-- User-owned table: user_saved_programs
DO $$
DECLARE
  pol RECORD;
  owner_expr TEXT;
BEGIN
  IF to_regclass('public.user_saved_programs') IS NOT NULL THEN
    EXECUTE 'ALTER TABLE public.user_saved_programs ENABLE ROW LEVEL SECURITY';

    FOR pol IN
      SELECT policyname
      FROM pg_policies
      WHERE schemaname = 'public' AND tablename = 'user_saved_programs'
    LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.user_saved_programs', pol.policyname);
    END LOOP;

    IF EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'user_saved_programs'
        AND column_name = 'user_id'
    ) THEN
      owner_expr := 'current_setting(''request.jwt.claim.sub'', true) IS NOT NULL AND user_id = current_setting(''request.jwt.claim.sub'', true)';
    ELSIF EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'user_saved_programs'
        AND column_name = 'userId'
    ) THEN
      owner_expr := 'current_setting(''request.jwt.claim.sub'', true) IS NOT NULL AND "userId" = current_setting(''request.jwt.claim.sub'', true)';
    END IF;

    IF owner_expr IS NOT NULL THEN
      EXECUTE format('CREATE POLICY user_saved_programs_select_own ON public.user_saved_programs FOR SELECT TO authenticated USING (%s)', owner_expr);
      EXECUTE format('CREATE POLICY user_saved_programs_insert_own ON public.user_saved_programs FOR INSERT TO authenticated WITH CHECK (%s)', owner_expr);
      EXECUTE format('CREATE POLICY user_saved_programs_update_own ON public.user_saved_programs FOR UPDATE TO authenticated USING (%s) WITH CHECK (%s)', owner_expr, owner_expr);
      EXECUTE format('CREATE POLICY user_saved_programs_delete_own ON public.user_saved_programs FOR DELETE TO authenticated USING (%s)', owner_expr);
    END IF;
  END IF;
END $$;

-- Optional auth table: sessions
-- If no user reference column exists, keep RLS enabled with no client policies (server/service-role only).
DO $$
DECLARE
  pol RECORD;
  owner_expr TEXT;
BEGIN
  IF to_regclass('public.sessions') IS NOT NULL THEN
    EXECUTE 'ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY';

    FOR pol IN
      SELECT policyname
      FROM pg_policies
      WHERE schemaname = 'public' AND tablename = 'sessions'
    LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.sessions', pol.policyname);
    END LOOP;

    IF EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'sessions'
        AND column_name = 'user_id'
    ) THEN
      owner_expr := 'current_setting(''request.jwt.claim.sub'', true) IS NOT NULL AND user_id = current_setting(''request.jwt.claim.sub'', true)';
    ELSIF EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'sessions'
        AND column_name = 'userId'
    ) THEN
      owner_expr := 'current_setting(''request.jwt.claim.sub'', true) IS NOT NULL AND "userId" = current_setting(''request.jwt.claim.sub'', true)';
    END IF;

    IF owner_expr IS NOT NULL THEN
      EXECUTE format('CREATE POLICY sessions_select_own ON public.sessions FOR SELECT TO authenticated USING (%s)', owner_expr);
      EXECUTE format('CREATE POLICY sessions_insert_own ON public.sessions FOR INSERT TO authenticated WITH CHECK (%s)', owner_expr);
      EXECUTE format('CREATE POLICY sessions_update_own ON public.sessions FOR UPDATE TO authenticated USING (%s) WITH CHECK (%s)', owner_expr, owner_expr);
      EXECUTE format('CREATE POLICY sessions_delete_own ON public.sessions FOR DELETE TO authenticated USING (%s)', owner_expr);
    END IF;
  END IF;
END $$;

-- Optional auth table: accounts
-- If no user reference column exists, keep RLS enabled with no client policies (server/service-role only).
DO $$
DECLARE
  pol RECORD;
  owner_expr TEXT;
BEGIN
  IF to_regclass('public.accounts') IS NOT NULL THEN
    EXECUTE 'ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY';

    FOR pol IN
      SELECT policyname
      FROM pg_policies
      WHERE schemaname = 'public' AND tablename = 'accounts'
    LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.accounts', pol.policyname);
    END LOOP;

    IF EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'accounts'
        AND column_name = 'user_id'
    ) THEN
      owner_expr := 'current_setting(''request.jwt.claim.sub'', true) IS NOT NULL AND user_id = current_setting(''request.jwt.claim.sub'', true)';
    ELSIF EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'accounts'
        AND column_name = 'userId'
    ) THEN
      owner_expr := 'current_setting(''request.jwt.claim.sub'', true) IS NOT NULL AND "userId" = current_setting(''request.jwt.claim.sub'', true)';
    END IF;

    IF owner_expr IS NOT NULL THEN
      EXECUTE format('CREATE POLICY accounts_select_own ON public.accounts FOR SELECT TO authenticated USING (%s)', owner_expr);
      EXECUTE format('CREATE POLICY accounts_insert_own ON public.accounts FOR INSERT TO authenticated WITH CHECK (%s)', owner_expr);
      EXECUTE format('CREATE POLICY accounts_update_own ON public.accounts FOR UPDATE TO authenticated USING (%s) WITH CHECK (%s)', owner_expr, owner_expr);
      EXECUTE format('CREATE POLICY accounts_delete_own ON public.accounts FOR DELETE TO authenticated USING (%s)', owner_expr);
    END IF;
  END IF;
END $$;

-- Optional auth table: verification_tokens
-- Server/service-role only. No client policies.
DO $$
DECLARE
  pol RECORD;
BEGIN
  IF to_regclass('public.verification_tokens') IS NOT NULL THEN
    EXECUTE 'ALTER TABLE public.verification_tokens ENABLE ROW LEVEL SECURITY';

    FOR pol IN
      SELECT policyname
      FROM pg_policies
      WHERE schemaname = 'public' AND tablename = 'verification_tokens'
    LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.verification_tokens', pol.policyname);
    END LOOP;
  END IF;
END $$;

COMMIT;
