-- Tofu: prisma/migrations/20260612120000_add_set_avg_hr/migration.sql, unchanged, which Tofu
-- applies before each build (see TOFU.md).

-- Additive (issue #152): average heart rate on a cardio set, imported from a
-- TCX file. NULL on every existing row and on manually logged sets.
ALTER TABLE "Set" ADD COLUMN "avgHr" INTEGER;
