-- Tofu: prisma/migrations/20260613163135_add_coach_note/migration.sql, unchanged, which Tofu
-- applies before each build (see TOFU.md).

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "coachNote" TEXT;
