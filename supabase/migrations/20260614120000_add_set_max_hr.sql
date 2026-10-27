-- Tofu: prisma/migrations/20260614120000_add_set_max_hr/migration.sql, unchanged, which Tofu
-- applies before each build (see TOFU.md).

-- Additive (issue #203): maximum (peak) heart rate on a cardio set, imported
-- from a TCX file alongside the average. NULL on every existing row and on
-- manually logged sets.
ALTER TABLE "Set" ADD COLUMN "maxHr" INTEGER;
