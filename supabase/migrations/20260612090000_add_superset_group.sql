-- Tofu: prisma/migrations/20260612090000_add_superset_group/migration.sql, unchanged, which Tofu
-- applies before each build (see TOFU.md).

-- Superset pairing (issue #146, slice 1): additive nullable column. Exercises
-- of the same workout sharing a group number form a superset; NULL (the
-- default for every existing row) means standalone. No backfill, no
-- constraint beyond the column - bounds live in the Zod schema.
ALTER TABLE "ProgramExercise" ADD COLUMN "supersetGroup" INTEGER;
