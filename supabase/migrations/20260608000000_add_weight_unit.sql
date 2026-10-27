-- Tofu: prisma/migrations/20260608000000_add_weight_unit/migration.sql, unchanged, which Tofu
-- applies before each build (see TOFU.md).

-- CreateEnum
CREATE TYPE "WeightUnit" AS ENUM ('KG', 'LB');

-- AlterTable
ALTER TABLE "User"
  ADD COLUMN "unit" "WeightUnit" NOT NULL DEFAULT 'KG';
