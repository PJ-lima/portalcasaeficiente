-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";

-- CreateEnum
CREATE TYPE "ProgramStatus" AS ENUM ('OPEN', 'CLOSED', 'PLANNED', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "ProgramType" AS ENUM ('NATIONAL', 'MUNICIPAL');

-- CreateEnum
CREATE TYPE "SourceType" AS ENUM ('DR', 'FA', 'MUNICIPAL_SITE', 'OTHER');

-- CreateEnum
CREATE TYPE "GeoLevel" AS ENUM ('NATIONAL', 'DISTRICT', 'MUNICIPALITY', 'PARISH');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT,
    "email_verified" TIMESTAMP(3),
    "image" TEXT,
    "nif" TEXT,
    "password_hash" TEXT,
    "role" TEXT NOT NULL DEFAULT 'user',

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accounts" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "provider_account_id" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "session_token" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification_tokens" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "verification_tokens_pkey" PRIMARY KEY ("identifier","token")
);

-- CreateTable
CREATE TABLE "programs" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "entity" TEXT,
    "program_type" "ProgramType" NOT NULL,
    "status" "ProgramStatus" NOT NULL,
    "summary" TEXT,
    "official_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "programs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "program_versions" (
    "id" TEXT NOT NULL,
    "program_id" TEXT NOT NULL,
    "version_date" TIMESTAMP(3) NOT NULL,
    "raw_text" TEXT NOT NULL,
    "rules_json" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "program_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sources" (
    "id" TEXT NOT NULL,
    "program_id" TEXT,
    "source_type" "SourceType" NOT NULL,
    "source_url" TEXT,
    "fetched_at" TIMESTAMP(3),
    "content_hash" TEXT,
    "raw_payload" JSONB,

    CONSTRAINT "sources_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "program_geographies" (
    "id" TEXT NOT NULL,
    "program_id" TEXT NOT NULL,
    "level" "GeoLevel" NOT NULL,
    "district" TEXT,
    "municipality" TEXT,
    "parish" TEXT,

    CONSTRAINT "program_geographies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "distritos" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "distritos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "concelhos" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "distrito_id" TEXT NOT NULL,

    CONSTRAINT "concelhos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_dossiers" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "address" TEXT,
    "postal_code" TEXT,
    "concelho_id" TEXT,
    "is_main_residence" BOOLEAN,
    "building_year" INTEGER,
    "property_type" TEXT,
    "household_size" INTEGER,
    "annual_income" DECIMAL(12,2),
    "has_social_tariff" BOOLEAN,
    "is_disabled_person" BOOLEAN,
    "has_elderly" BOOLEAN,
    "energy_certificate" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "postal_cache_id" TEXT,
    "postal_validated" BOOLEAN NOT NULL DEFAULT false,
    "postal_validated_at" TIMESTAMP(3),

    CONSTRAINT "user_dossiers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_saved_programs" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "program_id" TEXT NOT NULL,
    "notes" TEXT,
    "saved_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_saved_programs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "postal_code_cache" (
    "id" TEXT NOT NULL,
    "postal_code" VARCHAR(8) NOT NULL,
    "distrito" VARCHAR(80),
    "concelho" VARCHAR(120),
    "localidade" VARCHAR(120),
    "source" VARCHAR(32) NOT NULL DEFAULT 'geoapi',
    "raw" JSONB,
    "fetched_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "hit_count" INTEGER NOT NULL DEFAULT 0,
    "last_hit_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "postal_code_cache_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_nif_idx" ON "users"("nif");

-- CreateIndex
CREATE UNIQUE INDEX "accounts_provider_provider_account_id_key" ON "accounts"("provider", "provider_account_id");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_session_token_key" ON "sessions"("session_token");

-- CreateIndex
CREATE UNIQUE INDEX "programs_slug_key" ON "programs"("slug");

-- CreateIndex
CREATE INDEX "programs_slug_idx" ON "programs"("slug");

-- CreateIndex
CREATE INDEX "programs_status_idx" ON "programs"("status");

-- CreateIndex
CREATE INDEX "programs_program_type_idx" ON "programs"("program_type");

-- CreateIndex
CREATE INDEX "program_versions_program_id_idx" ON "program_versions"("program_id");

-- CreateIndex
CREATE INDEX "sources_fetched_at_idx" ON "sources"("fetched_at");

-- CreateIndex
CREATE INDEX "sources_program_id_idx" ON "sources"("program_id");

-- CreateIndex
CREATE INDEX "program_geographies_municipality_idx" ON "program_geographies"("municipality");

-- CreateIndex
CREATE INDEX "program_geographies_program_id_idx" ON "program_geographies"("program_id");

-- CreateIndex
CREATE INDEX "program_geographies_level_idx" ON "program_geographies"("level");

-- CreateIndex
CREATE UNIQUE INDEX "distritos_name_key" ON "distritos"("name");

-- CreateIndex
CREATE UNIQUE INDEX "concelhos_name_key" ON "concelhos"("name");

-- CreateIndex
CREATE INDEX "concelhos_distrito_id_idx" ON "concelhos"("distrito_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_dossiers_user_id_key" ON "user_dossiers"("user_id");

-- CreateIndex
CREATE INDEX "user_dossiers_concelho_id_idx" ON "user_dossiers"("concelho_id");

-- CreateIndex
CREATE INDEX "user_dossiers_postal_cache_id_idx" ON "user_dossiers"("postal_cache_id");

-- CreateIndex
CREATE INDEX "user_saved_programs_user_id_idx" ON "user_saved_programs"("user_id");

-- CreateIndex
CREATE INDEX "user_saved_programs_program_id_idx" ON "user_saved_programs"("program_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_saved_programs_user_id_program_id_key" ON "user_saved_programs"("user_id", "program_id");

-- CreateIndex
CREATE UNIQUE INDEX "postal_code_cache_postal_code_key" ON "postal_code_cache"("postal_code");

-- CreateIndex
CREATE INDEX "postal_code_cache_expires_at_idx" ON "postal_code_cache"("expires_at");

-- CreateIndex
CREATE INDEX "postal_code_cache_concelho_idx" ON "postal_code_cache"("concelho");

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "program_versions" ADD CONSTRAINT "program_versions_program_id_fkey" FOREIGN KEY ("program_id") REFERENCES "programs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sources" ADD CONSTRAINT "sources_program_id_fkey" FOREIGN KEY ("program_id") REFERENCES "programs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "program_geographies" ADD CONSTRAINT "program_geographies_program_id_fkey" FOREIGN KEY ("program_id") REFERENCES "programs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "concelhos" ADD CONSTRAINT "concelhos_distrito_id_fkey" FOREIGN KEY ("distrito_id") REFERENCES "distritos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_dossiers" ADD CONSTRAINT "user_dossiers_postal_cache_id_fkey" FOREIGN KEY ("postal_cache_id") REFERENCES "postal_code_cache"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_dossiers" ADD CONSTRAINT "user_dossiers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_saved_programs" ADD CONSTRAINT "user_saved_programs_program_id_fkey" FOREIGN KEY ("program_id") REFERENCES "programs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_saved_programs" ADD CONSTRAINT "user_saved_programs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

