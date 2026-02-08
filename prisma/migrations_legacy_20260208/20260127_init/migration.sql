-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('CITIZEN', 'ADMIN', 'SUPER_ADMIN');

-- CreateEnum
CREATE TYPE "EntityType" AS ENUM ('NATIONAL', 'MUNICIPAL', 'REGIONAL', 'PRR', 'FUNDO_AMBIENTAL', 'EU', 'OTHER');

-- CreateEnum
CREATE TYPE "SupportType" AS ENUM ('VOUCHER', 'REIMBURSEMENT', 'SUBSIDY', 'LOAN', 'TAX_BENEFIT', 'MIXED');

-- CreateEnum
CREATE TYPE "ProgramStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'OPEN', 'CLOSED', 'SUSPENDED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "GeographyScope" AS ENUM ('NATIONAL', 'DISTRICT', 'CONCELHO', 'FREGUESIA');

-- CreateEnum
CREATE TYPE "MeasureType" AS ENUM ('WINDOWS', 'INSULATION', 'ROOF', 'HEAT_PUMP', 'SOLAR_PV', 'SOLAR_THERMAL', 'HVAC', 'LIGHTING', 'APPLIANCES', 'WATER_HEATING', 'ENERGY_AUDIT', 'OTHER');

-- CreateEnum
CREATE TYPE "RuleType" AS ENUM ('ELIGIBILITY', 'INCOME', 'PROPERTY', 'GEOGRAPHIC', 'TEMPORAL', 'DOCUMENT');

-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM ('ID_CARD', 'TAX_DECLARATION', 'PROPERTY_CERT', 'ENERGY_CERT', 'QUOTE', 'INVOICE', 'PROOF_RESIDENCE', 'PROOF_INCOME', 'BANK_STATEMENT', 'CONTRACT', 'PHOTO', 'OTHER');

-- CreateEnum
CREATE TYPE "SourceType" AS ENUM ('DIARIO_REPUBLICA', 'FUNDO_AMBIENTAL', 'MUNICIPAL_WEBSITE', 'PRR_PORTAL', 'MANUAL');

-- CreateEnum
CREATE TYPE "SourceStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'ERROR');

-- CreateEnum
CREATE TYPE "IngestionStatus" AS ENUM ('RUNNING', 'SUCCESS', 'PARTIAL', 'FAILED');

-- CreateEnum
CREATE TYPE "PropertyType" AS ENUM ('APARTMENT', 'HOUSE', 'VILLA', 'TOWNHOUSE', 'OTHER');

-- CreateEnum
CREATE TYPE "OwnershipType" AS ENUM ('OWNER', 'TENANT', 'USUFRUCT', 'OTHER');

-- CreateEnum
CREATE TYPE "EnergyClass" AS ENUM ('A_PLUS', 'A', 'B', 'B_MINUS', 'C', 'D', 'E', 'F', 'G');

-- CreateEnum
CREATE TYPE "ApplicationStatus" AS ENUM ('DRAFT', 'CHECKING_ELIGIBILITY', 'ELIGIBLE', 'NOT_ELIGIBLE', 'PREPARING_DOCS', 'READY_TO_SUBMIT', 'SUBMITTED', 'APPROVED', 'REJECTED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "EligibilityResult" AS ENUM ('ELIGIBLE', 'MAYBE', 'NOT_ELIGIBLE');

-- CreateEnum
CREATE TYPE "DocumentStatus" AS ENUM ('PENDING', 'UPLOADED', 'VERIFIED', 'REJECTED');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT,
    "name" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'CITIZEN',
    "emailVerified" TIMESTAMP(3),
    "image" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accounts" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
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
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification_tokens" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "programs" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "shortDescription" TEXT,
    "entity" TEXT NOT NULL,
    "entityType" "EntityType" NOT NULL,
    "supportType" "SupportType" NOT NULL,
    "status" "ProgramStatus" NOT NULL DEFAULT 'DRAFT',
    "maxAmount" DECIMAL(12,2),
    "minAmount" DECIMAL(12,2),
    "percentageCap" INTEGER,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "applicationStart" TIMESTAMP(3),
    "applicationEnd" TIMESTAMP(3),
    "officialUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "publishedAt" TIMESTAMP(3),
    "currentVersionId" TEXT,

    CONSTRAINT "programs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "program_versions" (
    "id" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "content" JSONB NOT NULL,
    "changeLog" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT,

    CONSTRAINT "program_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "program_geography" (
    "id" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "scope" "GeographyScope" NOT NULL,
    "districtId" TEXT,
    "concelhoId" TEXT,
    "freguesiaId" TEXT,

    CONSTRAINT "program_geography_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "program_measures" (
    "id" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "measureType" "MeasureType" NOT NULL,
    "description" TEXT,
    "maxAmount" DECIMAL(12,2),
    "conditions" JSONB,

    CONSTRAINT "program_measures_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "program_rules" (
    "id" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "ruleType" "RuleType" NOT NULL,
    "ruleKey" TEXT NOT NULL,
    "operator" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "description" TEXT,
    "priority" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "program_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "program_documents" (
    "id" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "documentType" "DocumentType" NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "required" BOOLEAN NOT NULL DEFAULT true,
    "templateUrl" TEXT,

    CONSTRAINT "program_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sources" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "SourceType" NOT NULL,
    "url" TEXT NOT NULL,
    "lastScraped" TIMESTAMP(3),
    "status" "SourceStatus" NOT NULL DEFAULT 'ACTIVE',
    "config" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sources_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "program_sources" (
    "id" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "sourceUrl" TEXT NOT NULL,
    "sourceRef" TEXT,
    "fetchedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "program_sources_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ingestion_logs" (
    "id" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "status" "IngestionStatus" NOT NULL,
    "itemsFound" INTEGER NOT NULL DEFAULT 0,
    "itemsNew" INTEGER NOT NULL DEFAULT 0,
    "itemsUpdated" INTEGER NOT NULL DEFAULT 0,
    "errors" JSONB,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),

    CONSTRAINT "ingestion_logs_pkey" PRIMARY KEY ("id")
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
    "distritoId" TEXT NOT NULL,

    CONSTRAINT "concelhos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "freguesias" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "concelhoId" TEXT NOT NULL,

    CONSTRAINT "freguesias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "houses" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT,
    "concelhoId" TEXT NOT NULL,
    "freguesiaId" TEXT,
    "address" TEXT,
    "postalCode" TEXT,
    "propertyType" "PropertyType" NOT NULL,
    "ownershipType" "OwnershipType" NOT NULL,
    "buildingYear" INTEGER,
    "area" DECIMAL(8,2),
    "energyClass" "EnergyClass",
    "householdSize" INTEGER,
    "annualIncome" DECIMAL(12,2),
    "socialTariff" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "houses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "applications" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "houseId" TEXT NOT NULL,
    "status" "ApplicationStatus" NOT NULL DEFAULT 'DRAFT',
    "eligibility" "EligibilityResult",
    "eligibilityData" JSONB,
    "submittedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "applications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "checklist_items" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "documentType" "DocumentType" NOT NULL,
    "name" TEXT NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,

    CONSTRAINT "checklist_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_documents" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "DocumentType" NOT NULL,
    "fileKey" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "mimeType" TEXT NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "application_documents" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "status" "DocumentStatus" NOT NULL DEFAULT 'PENDING',

    CONSTRAINT "application_documents_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "accounts_provider_providerAccountId_key" ON "accounts"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_sessionToken_key" ON "sessions"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "verification_tokens_token_key" ON "verification_tokens"("token");

-- CreateIndex
CREATE UNIQUE INDEX "verification_tokens_identifier_token_key" ON "verification_tokens"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "programs_slug_key" ON "programs"("slug");

-- CreateIndex
CREATE INDEX "programs_status_idx" ON "programs"("status");

-- CreateIndex
CREATE INDEX "programs_entityType_idx" ON "programs"("entityType");

-- CreateIndex
CREATE INDEX "programs_supportType_idx" ON "programs"("supportType");

-- CreateIndex
CREATE UNIQUE INDEX "program_versions_programId_version_key" ON "program_versions"("programId", "version");

-- CreateIndex
CREATE INDEX "program_geography_programId_idx" ON "program_geography"("programId");

-- CreateIndex
CREATE INDEX "program_geography_concelhoId_idx" ON "program_geography"("concelhoId");

-- CreateIndex
CREATE INDEX "program_measures_programId_idx" ON "program_measures"("programId");

-- CreateIndex
CREATE INDEX "program_measures_measureType_idx" ON "program_measures"("measureType");

-- CreateIndex
CREATE INDEX "program_rules_programId_idx" ON "program_rules"("programId");

-- CreateIndex
CREATE INDEX "program_rules_ruleType_idx" ON "program_rules"("ruleType");

-- CreateIndex
CREATE INDEX "program_documents_programId_idx" ON "program_documents"("programId");

-- CreateIndex
CREATE UNIQUE INDEX "program_sources_programId_sourceId_key" ON "program_sources"("programId", "sourceId");

-- CreateIndex
CREATE INDEX "ingestion_logs_sourceId_idx" ON "ingestion_logs"("sourceId");

-- CreateIndex
CREATE INDEX "ingestion_logs_startedAt_idx" ON "ingestion_logs"("startedAt");

-- CreateIndex
CREATE INDEX "concelhos_distritoId_idx" ON "concelhos"("distritoId");

-- CreateIndex
CREATE INDEX "freguesias_concelhoId_idx" ON "freguesias"("concelhoId");

-- CreateIndex
CREATE INDEX "houses_userId_idx" ON "houses"("userId");

-- CreateIndex
CREATE INDEX "houses_concelhoId_idx" ON "houses"("concelhoId");

-- CreateIndex
CREATE UNIQUE INDEX "applications_userId_programId_houseId_key" ON "applications"("userId", "programId", "houseId");

-- CreateIndex
CREATE INDEX "applications_userId_idx" ON "applications"("userId");

-- CreateIndex
CREATE INDEX "applications_programId_idx" ON "applications"("programId");

-- CreateIndex
CREATE INDEX "checklist_items_applicationId_idx" ON "checklist_items"("applicationId");

-- CreateIndex
CREATE INDEX "user_documents_userId_idx" ON "user_documents"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "application_documents_applicationId_documentId_key" ON "application_documents"("applicationId", "documentId");

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "program_versions" ADD CONSTRAINT "program_versions_programId_fkey" FOREIGN KEY ("programId") REFERENCES "programs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "program_geography" ADD CONSTRAINT "program_geography_programId_fkey" FOREIGN KEY ("programId") REFERENCES "programs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "program_geography" ADD CONSTRAINT "program_geography_districtId_fkey" FOREIGN KEY ("districtId") REFERENCES "distritos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "program_geography" ADD CONSTRAINT "program_geography_concelhoId_fkey" FOREIGN KEY ("concelhoId") REFERENCES "concelhos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "program_geography" ADD CONSTRAINT "program_geography_freguesiaId_fkey" FOREIGN KEY ("freguesiaId") REFERENCES "freguesias"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "program_measures" ADD CONSTRAINT "program_measures_programId_fkey" FOREIGN KEY ("programId") REFERENCES "programs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "program_rules" ADD CONSTRAINT "program_rules_programId_fkey" FOREIGN KEY ("programId") REFERENCES "programs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "program_documents" ADD CONSTRAINT "program_documents_programId_fkey" FOREIGN KEY ("programId") REFERENCES "programs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "program_sources" ADD CONSTRAINT "program_sources_programId_fkey" FOREIGN KEY ("programId") REFERENCES "programs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "program_sources" ADD CONSTRAINT "program_sources_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "sources"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ingestion_logs" ADD CONSTRAINT "ingestion_logs_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "sources"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "concelhos" ADD CONSTRAINT "concelhos_distritoId_fkey" FOREIGN KEY ("distritoId") REFERENCES "distritos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "freguesias" ADD CONSTRAINT "freguesias_concelhoId_fkey" FOREIGN KEY ("concelhoId") REFERENCES "concelhos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "houses" ADD CONSTRAINT "houses_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "houses" ADD CONSTRAINT "houses_concelhoId_fkey" FOREIGN KEY ("concelhoId") REFERENCES "concelhos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "houses" ADD CONSTRAINT "houses_freguesiaId_fkey" FOREIGN KEY ("freguesiaId") REFERENCES "freguesias"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "applications" ADD CONSTRAINT "applications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "applications" ADD CONSTRAINT "applications_programId_fkey" FOREIGN KEY ("programId") REFERENCES "programs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "applications" ADD CONSTRAINT "applications_houseId_fkey" FOREIGN KEY ("houseId") REFERENCES "houses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "checklist_items" ADD CONSTRAINT "checklist_items_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_documents" ADD CONSTRAINT "user_documents_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "application_documents" ADD CONSTRAINT "application_documents_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "application_documents" ADD CONSTRAINT "application_documents_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "user_documents"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
