-- CreateEnum
CREATE TYPE "ProgramDomain" AS ENUM ('ENERGY_EFFICIENCY', 'RENOVATION', 'HOUSING_ACCESS', 'TAX_BENEFIT', 'SOCIAL', 'OTHER');

-- CreateEnum
CREATE TYPE "SupportType" AS ENUM ('VOUCHER', 'REIMBURSEMENT', 'SUBSIDY', 'LOAN', 'TAX_BENEFIT', 'MIXED');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('NEW_PROGRAM', 'STATUS_CHANGE', 'DEADLINE');

-- CreateEnum
CREATE TYPE "NotificationStatus" AS ENUM ('pending', 'sent', 'failed');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "ProgramStatus" ADD VALUE 'EXHAUSTED';
ALTER TYPE "ProgramStatus" ADD VALUE 'SUSPENDED';
ALTER TYPE "ProgramStatus" ADD VALUE 'CANCELLED';
ALTER TYPE "ProgramStatus" ADD VALUE 'PAYMENTS_DELAYED';

-- AlterTable
ALTER TABLE "programs" ADD COLUMN     "budget_committed" DECIMAL(14,2),
ADD COLUMN     "budget_total" DECIMAL(14,2),
ADD COLUMN     "domain" "ProgramDomain" NOT NULL DEFAULT 'ENERGY_EFFICIENCY',
ADD COLUMN     "last_verified_at" TIMESTAMP(3),
ADD COLUMN     "status_note" TEXT,
ADD COLUMN     "status_source_url" TEXT,
ADD COLUMN     "support_type" "SupportType";

-- CreateTable
CREATE TABLE "program_status_events" (
    "id" TEXT NOT NULL,
    "program_id" TEXT NOT NULL,
    "status" "ProgramStatus" NOT NULL,
    "note" TEXT,
    "source_url" TEXT,
    "detected_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "detected_by" TEXT NOT NULL DEFAULT 'worker',

    CONSTRAINT "program_status_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_notification_settings" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "email_enabled" BOOLEAN NOT NULL DEFAULT true,
    "domains" "ProgramDomain"[],
    "concelho_ids" TEXT[],
    "saved_program_updates" BOOLEAN NOT NULL DEFAULT true,
    "deadline_reminders" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_notification_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_queue" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "program_id" TEXT,
    "type" "NotificationType" NOT NULL,
    "payload" JSONB NOT NULL,
    "status" "NotificationStatus" NOT NULL DEFAULT 'pending',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "last_error" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sent_at" TIMESTAMP(3),

    CONSTRAINT "notification_queue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "application_status_snapshots" (
    "id" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "program_id" TEXT,
    "table_hash" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "captured_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "application_status_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "program_status_events_program_id_idx" ON "program_status_events"("program_id");

-- CreateIndex
CREATE INDEX "program_status_events_detected_at_idx" ON "program_status_events"("detected_at");

-- CreateIndex
CREATE UNIQUE INDEX "user_notification_settings_user_id_key" ON "user_notification_settings"("user_id");

-- CreateIndex
CREATE INDEX "notification_queue_status_idx" ON "notification_queue"("status");

-- CreateIndex
CREATE INDEX "notification_queue_created_at_idx" ON "notification_queue"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "notification_queue_user_id_program_id_type_key" ON "notification_queue"("user_id", "program_id", "type");

-- CreateIndex
CREATE INDEX "application_status_snapshots_source_idx" ON "application_status_snapshots"("source");

-- CreateIndex
CREATE INDEX "application_status_snapshots_program_id_idx" ON "application_status_snapshots"("program_id");

-- CreateIndex
CREATE INDEX "application_status_snapshots_captured_at_idx" ON "application_status_snapshots"("captured_at");

-- CreateIndex
CREATE UNIQUE INDEX "application_status_snapshots_url_table_hash_key" ON "application_status_snapshots"("url", "table_hash");

-- CreateIndex
CREATE INDEX "programs_domain_idx" ON "programs"("domain");

-- AddForeignKey
ALTER TABLE "program_status_events" ADD CONSTRAINT "program_status_events_program_id_fkey" FOREIGN KEY ("program_id") REFERENCES "programs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_notification_settings" ADD CONSTRAINT "user_notification_settings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_queue" ADD CONSTRAINT "notification_queue_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ---------------------------------------------------------------------------
-- Backfill: um evento inicial por programa, a partir do estado atual.
-- Sem isto o histórico começaria vazio e a timeline não teria ponto de partida.
-- Nota: só usa valores de enum pré-existentes (os novos não podem ser usados
-- na mesma transação em que foram criados).
-- ---------------------------------------------------------------------------
INSERT INTO "program_status_events" ("id", "program_id", "status", "note", "source_url", "detected_at", "detected_by")
SELECT
  md5(random()::text || clock_timestamp()::text),
  p."id",
  p."status",
  'Estado inicial registado na migração para histórico de estado.',
  p."official_url",
  COALESCE(p."updated_at", p."created_at"),
  'migration'
FROM "programs" p;

-- ---------------------------------------------------------------------------
-- RLS — mesma convenção das migrações 000003 / 000006.
-- program_status_events: leitura pública (alimenta a timeline visível ao cidadão).
-- application_status_snapshots: server-only (dados brutos de scraping, só /admin).
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  pol RECORD;
BEGIN
  IF to_regclass('public.program_status_events') IS NOT NULL THEN
    EXECUTE 'ALTER TABLE public.program_status_events ENABLE ROW LEVEL SECURITY';

    FOR pol IN
      SELECT policyname
      FROM pg_policies
      WHERE schemaname = 'public' AND tablename = 'program_status_events'
    LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.program_status_events', pol.policyname);
    END LOOP;

    EXECUTE 'CREATE POLICY program_status_events_public_read ON public.program_status_events FOR SELECT TO anon, authenticated USING (true)';
  END IF;
END $$;

DO $$
BEGIN
  IF to_regclass('public.application_status_snapshots') IS NOT NULL THEN
    ALTER TABLE public.application_status_snapshots ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS application_status_snapshots_deny_anon ON public.application_status_snapshots;
    DROP POLICY IF EXISTS application_status_snapshots_deny_authenticated ON public.application_status_snapshots;

    IF to_regrole('anon') IS NOT NULL THEN
      CREATE POLICY application_status_snapshots_deny_anon
      ON public.application_status_snapshots
      FOR ALL
      TO anon
      USING (false)
      WITH CHECK (false);
    END IF;

    IF to_regrole('authenticated') IS NOT NULL THEN
      CREATE POLICY application_status_snapshots_deny_authenticated
      ON public.application_status_snapshots
      FOR ALL
      TO authenticated
      USING (false)
      WITH CHECK (false);
    END IF;
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- RLS das tabelas de notificação: dados do utilizador, mesma convenção
-- user-owned da migração 000003 (owner via request.jwt.claim.sub).
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  pol RECORD;
  target TEXT;
  owner_expr TEXT;
BEGIN
  FOREACH target IN ARRAY ARRAY['user_notification_settings', 'notification_queue']
  LOOP
    IF to_regclass('public.' || target) IS NOT NULL THEN
      EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', target);

      FOR pol IN
        SELECT policyname
        FROM pg_policies
        WHERE schemaname = 'public' AND tablename = target
      LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol.policyname, target);
      END LOOP;

      owner_expr := 'current_setting(''request.jwt.claim.sub'', true) IS NOT NULL AND user_id = current_setting(''request.jwt.claim.sub'', true)';

      EXECUTE format('CREATE POLICY %I ON public.%I FOR SELECT TO authenticated USING (%s)', target || '_select_own', target, owner_expr);
      EXECUTE format('CREATE POLICY %I ON public.%I FOR INSERT TO authenticated WITH CHECK (%s)', target || '_insert_own', target, owner_expr);
      EXECUTE format('CREATE POLICY %I ON public.%I FOR UPDATE TO authenticated USING (%s) WITH CHECK (%s)', target || '_update_own', target, owner_expr, owner_expr);
      EXECUTE format('CREATE POLICY %I ON public.%I FOR DELETE TO authenticated USING (%s)', target || '_delete_own', target, owner_expr);
    END IF;
  END LOOP;
END $$;
