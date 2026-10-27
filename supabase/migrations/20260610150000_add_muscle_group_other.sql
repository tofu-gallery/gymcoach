-- Tofu: prisma/migrations/20260610150000_add_muscle_group_other/migration.sql, unchanged, which Tofu
-- applies before each build (see TOFU.md).

-- Additive migration (issue #100): an OTHER fallback muscle group for
-- imported exercises that cannot be auto-classified. Enum value only, no
-- table or data change.

-- AlterEnum
ALTER TYPE "MuscleGroup" ADD VALUE 'OTHER';
