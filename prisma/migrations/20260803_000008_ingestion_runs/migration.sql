BEGIN;

-- A tabela ingestion_runs existe no schema.prisma desde o início, mas nunca teve
-- migration: em dev foi criada por `prisma db push`, pelo que o baseline
-- 20260208_000001 (gerado a partir do schema, não da DB) não a incluiu. Numa base
-- nova (staging) o `migrate deploy` corria os 7 passos sem erro e a tabela ficava
-- em falta — a 000006 só lhe mexe dentro de um guard `to_regclass(...) IS NOT NULL`.
-- IF NOT EXISTS por todo o lado para ser no-op onde a tabela já existe.

CREATE TABLE IF NOT EXISTS "ingestion_runs" (
    "id" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finished_at" TIMESTAMP(3),
    "items_found" INTEGER NOT NULL DEFAULT 0,
    "items_inserted" INTEGER NOT NULL DEFAULT 0,
    "items_updated" INTEGER NOT NULL DEFAULT 0,
    "items_skipped" INTEGER NOT NULL DEFAULT 0,
    "errors" JSONB,
    "duration_ms" INTEGER,

    CONSTRAINT "ingestion_runs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "ingestion_runs_source_idx" ON "ingestion_runs"("source");
CREATE INDEX IF NOT EXISTS "ingestion_runs_status_idx" ON "ingestion_runs"("status");
CREATE INDEX IF NOT EXISTS "ingestion_runs_started_at_idx" ON "ingestion_runs"("started_at");

-- Mesmas políticas de negação que a 000006 já tentava aplicar: tabela server-only.
DO $$
BEGIN
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
END $$;

COMMIT;
