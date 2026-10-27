-- Tofu: prisma/migrations/20260904090000_index_set_gym_equipment/migration.sql, unchanged, which Tofu
-- applies before each build (see TOFU.md).

-- Index the referencing side of Set.gymEquipmentId (issue #325). The foreign
-- key's ON DELETE SET NULL is executed by Postgres, which does not index the
-- referencing column on its own, so deleting an equipment item (or a gym,
-- which cascades to its equipment) had to scan the whole "Set" table per row.
CREATE INDEX IF NOT EXISTS "Set_gymEquipmentId_completedAt_idx" ON "Set"("gymEquipmentId", "completedAt");
