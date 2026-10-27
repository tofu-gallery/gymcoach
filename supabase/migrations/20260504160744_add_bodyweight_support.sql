-- Tofu: prisma/migrations/20260504160744_add_bodyweight_support/migration.sql, unchanged, which Tofu
-- applies before each build (see TOFU.md).

-- AlterTable
ALTER TABLE "Exercise" ADD COLUMN     "usesBodyweight" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "bodyweight" DOUBLE PRECISION;
