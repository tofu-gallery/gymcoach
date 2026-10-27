-- Tofu: prisma/migrations/20260609000000_add_readiness_checkin/migration.sql, unchanged, which Tofu
-- applies before each build (see TOFU.md). The lines after it turn row-level security on,
-- with no policy, for the tables it makes.

-- CreateTable
CREATE TABLE "ReadinessCheckin" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "readiness" INTEGER NOT NULL,
    "sleepQuality" INTEGER NOT NULL,
    "soreness" JSONB,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ReadinessCheckin_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ReadinessCheckin_userId_createdAt_idx" ON "ReadinessCheckin"("userId", "createdAt");

-- AddForeignKey
ALTER TABLE "ReadinessCheckin" ADD CONSTRAINT "ReadinessCheckin_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Tofu: row-level security on, with no policy, for the tables this file makes.
-- A Tofu database opens the tables these files make to Supabase's Data API
-- roles; with this, those roles read and change no row. The app is not
-- limited: its own connection owns the tables, and the policy is not forced.
ALTER TABLE "ReadinessCheckin" ENABLE ROW LEVEL SECURITY;
