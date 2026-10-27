-- Tofu: prisma/migrations/20260915033000_add_mcp_historical_equipment_backfill_audit/migration.sql, unchanged, which Tofu
-- applies before each build (see TOFU.md). The lines after it turn row-level security on,
-- with no policy, for the tables it makes.

-- Durable audit records for explicitly confirmed MCP historical-equipment backfills.
-- References are intentionally stored as immutable scalar IDs/snapshots so the audit
-- survives later deletion of a gym, exercise, equipment item, or training set.
-- The owning user is the one real foreign key: audit rows go away with the account.
CREATE TABLE "McpHistoricalEquipmentBackfillAudit" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "gymId" TEXT NOT NULL,
    "exerciseId" TEXT NOT NULL,
    "equipmentId" TEXT NOT NULL,
    "setIds" TEXT[],
    "equipmentSnapshot" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "undoneAt" TIMESTAMP(3),

    CONSTRAINT "McpHistoricalEquipmentBackfillAudit_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "McpHistoricalEquipmentBackfillAudit_userId_createdAt_idx"
ON "McpHistoricalEquipmentBackfillAudit"("userId", "createdAt");

ALTER TABLE "McpHistoricalEquipmentBackfillAudit"
ADD CONSTRAINT "McpHistoricalEquipmentBackfillAudit_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Tofu: row-level security on, with no policy, for the tables this file makes.
-- A Tofu database opens the tables these files make to Supabase's Data API
-- roles; with this, those roles read and change no row. The app is not
-- limited: its own connection owns the tables, and the policy is not forced.
ALTER TABLE "McpHistoricalEquipmentBackfillAudit" ENABLE ROW LEVEL SECURITY;
