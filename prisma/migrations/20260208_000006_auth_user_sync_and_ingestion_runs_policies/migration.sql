BEGIN;

-- Keep public.users in sync with users created/updated in Supabase Auth.
CREATE OR REPLACE FUNCTION public.sync_auth_user_to_public_users()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  derived_name TEXT;
  derived_image TEXT;
BEGIN
  derived_name := COALESCE(
    NULLIF(TRIM(NEW.raw_user_meta_data ->> 'name'), ''),
    CASE
      WHEN NEW.email IS NOT NULL THEN split_part(NEW.email, '@', 1)
      ELSE NULL
    END
  );

  derived_image := NULLIF(TRIM(NEW.raw_user_meta_data ->> 'avatar_url'), '');

  -- Upsert by id; if email conflicts with an existing legacy user row, preserve it.
  BEGIN
    INSERT INTO public.users (
      id,
      email,
      name,
      image,
      email_verified,
      role
    )
    VALUES (
      NEW.id::text,
      NEW.email,
      derived_name,
      derived_image,
      NEW.email_confirmed_at,
      'user'
    )
    ON CONFLICT (id) DO UPDATE
    SET email = EXCLUDED.email,
        name = COALESCE(public.users.name, EXCLUDED.name),
        image = COALESCE(public.users.image, EXCLUDED.image),
        email_verified = COALESCE(public.users.email_verified, EXCLUDED.email_verified);
  EXCEPTION
    WHEN unique_violation THEN
      -- Legacy account with same email but different id: update safe fields only.
      IF NEW.email IS NOT NULL THEN
        UPDATE public.users
        SET name = COALESCE(public.users.name, derived_name),
            image = COALESCE(public.users.image, derived_image),
            email_verified = COALESCE(public.users.email_verified, NEW.email_confirmed_at)
        WHERE LOWER(public.users.email) = LOWER(NEW.email);
      END IF;
  END;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_synced ON auth.users;

CREATE TRIGGER on_auth_user_synced
AFTER INSERT OR UPDATE OF email, raw_user_meta_data, email_confirmed_at ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.sync_auth_user_to_public_users();

-- Backfill for Auth users that already exist.
INSERT INTO public.users (
  id,
  email,
  name,
  image,
  email_verified,
  role
)
SELECT
  au.id::text,
  au.email,
  COALESCE(
    NULLIF(TRIM(au.raw_user_meta_data ->> 'name'), ''),
    CASE
      WHEN au.email IS NOT NULL THEN split_part(au.email, '@', 1)
      ELSE NULL
    END
  ) AS name,
  NULLIF(TRIM(au.raw_user_meta_data ->> 'avatar_url'), '') AS image,
  au.email_confirmed_at,
  'user'
FROM auth.users au
LEFT JOIN public.users pu_id
  ON pu_id.id = au.id::text
LEFT JOIN public.users pu_email
  ON au.email IS NOT NULL
 AND pu_email.email IS NOT NULL
 AND LOWER(pu_email.email) = LOWER(au.email)
WHERE pu_id.id IS NULL
  AND pu_email.id IS NULL;

-- ingestion_runs is server-only: keep RLS enabled with explicit deny policies.
DO $$
BEGIN
  IF to_regclass('public.ingestion_runs') IS NOT NULL THEN
    ALTER TABLE public.ingestion_runs ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS ingestion_runs_deny_anon ON public.ingestion_runs;
    DROP POLICY IF EXISTS ingestion_runs_deny_authenticated ON public.ingestion_runs;

    IF to_regrole('anon') IS NOT NULL THEN
      CREATE POLICY ingestion_runs_deny_anon
      ON public.ingestion_runs
      FOR ALL
      TO anon
      USING (false)
      WITH CHECK (false);
    END IF;

    IF to_regrole('authenticated') IS NOT NULL THEN
      CREATE POLICY ingestion_runs_deny_authenticated
      ON public.ingestion_runs
      FOR ALL
      TO authenticated
      USING (false)
      WITH CHECK (false);
    END IF;
  END IF;
END $$;

COMMIT;
