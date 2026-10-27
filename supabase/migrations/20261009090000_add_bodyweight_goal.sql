-- Tofu: prisma/migrations/20261009090000_add_bodyweight_goal/migration.sql, unchanged, which Tofu
-- applies before each build (see TOFU.md).

-- Additive migration (issue #398): optional bodyweight goal. One nullable
-- column on User, no change to any other table or row. Null (every existing
-- user) means "no goal", which is the current behavior.

-- AlterTable
ALTER TABLE "User" ADD COLUMN "bodyweightGoalKg" DOUBLE PRECISION;
