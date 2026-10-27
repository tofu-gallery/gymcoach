-- Tofu: prisma/migrations/20260823073000_add_set_equipment_history/migration.sql, unchanged, which Tofu
-- applies before each build (see TOFU.md).

-- Preserve the concrete equipment used for each set. Equipment is optional:
-- historical training data remains valid if inventory rows are later deleted.
ALTER TABLE "Set"
  ADD COLUMN "gymEquipmentId" TEXT,
  ADD COLUMN "equipmentNameSnapshot" TEXT,
  ADD COLUMN "equipmentLoadSnapshot" JSONB;

ALTER TABLE "Set"
  ADD CONSTRAINT "Set_gymEquipmentId_fkey"
  FOREIGN KEY ("gymEquipmentId") REFERENCES "GymEquipment"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
