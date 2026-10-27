-- Tofu: prisma/migrations/20260610120000_add_bodyweight_entry/migration.sql, unchanged, which Tofu
-- applies before each build (see TOFU.md). The lines after it turn row-level security on,
-- with no policy, for the tables it makes.

-- Additive migration (issue #99): bodyweight measurement history. New table
-- only, no change to existing tables. User.bodyweight stays the "current
-- value" the rest of the app reads.

-- CreateTable
CREATE TABLE "BodyweightEntry" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "weightKg" DOUBLE PRECISION NOT NULL,
    "measuredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "note" TEXT,
    CONSTRAINT "BodyweightEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BodyweightEntry_userId_measuredAt_idx" ON "BodyweightEntry"("userId", "measuredAt");

-- AddForeignKey
ALTER TABLE "BodyweightEntry" ADD CONSTRAINT "BodyweightEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Tofu: row-level security on, with no policy, for the tables this file makes.
-- A Tofu database opens the tables these files make to Supabase's Data API
-- roles; with this, those roles read and change no row. The app is not
-- limited: its own connection owns the tables, and the policy is not forced.
ALTER TABLE "BodyweightEntry" ENABLE ROW LEVEL SECURITY;
