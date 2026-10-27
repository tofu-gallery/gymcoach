-- Tofu: prisma/migrations/20260722160000_add_intra_set_autoregulation/migration.sql, unchanged, which Tofu
-- applies before each build (see TOFU.md).

CREATE TYPE "SetAutoregulationMode" AS ENUM ('PRESERVE_RIR', 'PRESERVE_REPS');

ALTER TABLE "ProgramExercise"
ADD COLUMN "autoregulationMode" "SetAutoregulationMode" NOT NULL DEFAULT 'PRESERVE_RIR',
ADD COLUMN "fatigueRate" DOUBLE PRECISION,
ADD COLUMN "loadAdjustmentPct" DOUBLE PRECISION;
