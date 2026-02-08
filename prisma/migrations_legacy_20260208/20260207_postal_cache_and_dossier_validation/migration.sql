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

-- AlterTable
ALTER TABLE "user_dossiers"
    ADD COLUMN "postal_cache_id" TEXT,
    ADD COLUMN "postal_validated" BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN "postal_validated_at" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "postal_code_cache_postal_code_key" ON "postal_code_cache"("postal_code");

-- CreateIndex
CREATE INDEX "postal_code_cache_expires_at_idx" ON "postal_code_cache"("expires_at");

-- CreateIndex
CREATE INDEX "postal_code_cache_concelho_idx" ON "postal_code_cache"("concelho");

-- CreateIndex
CREATE INDEX "user_dossiers_postal_cache_id_idx" ON "user_dossiers"("postal_cache_id");

-- AddForeignKey
ALTER TABLE "user_dossiers"
    ADD CONSTRAINT "user_dossiers_postal_cache_id_fkey"
    FOREIGN KEY ("postal_cache_id") REFERENCES "postal_code_cache"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
