-- Âmbito geral (2026-08-10): o produto passa de nicho casa a radar geral
-- de apoios ao cidadão. O domínio categoriza; deixa de filtrar.

-- AlterEnum
ALTER TYPE "ProgramDomain" ADD VALUE 'MOBILITY';
ALTER TYPE "ProgramDomain" ADD VALUE 'EDUCATION';
ALTER TYPE "ProgramDomain" ADD VALUE 'EMPLOYMENT';
ALTER TYPE "ProgramDomain" ADD VALUE 'HEALTH';
ALTER TYPE "ProgramDomain" ADD VALUE 'FAMILY';
ALTER TYPE "ProgramDomain" ADD VALUE 'AGRICULTURE';
