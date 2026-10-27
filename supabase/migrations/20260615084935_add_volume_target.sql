-- Tofu: prisma/migrations/20260615084935_add_volume_target/migration.sql, unchanged, which Tofu
-- applies before each build (see TOFU.md). The lines after it turn row-level security on,
-- with no policy, for the tables it makes.

-- CreateTable
CREATE TABLE "VolumeTarget" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "muscleGroup" "MuscleGroup" NOT NULL,
    "mev" INTEGER NOT NULL,
    "mrv" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VolumeTarget_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "VolumeTarget_userId_muscleGroup_key" ON "VolumeTarget"("userId", "muscleGroup");

-- AddForeignKey
ALTER TABLE "VolumeTarget" ADD CONSTRAINT "VolumeTarget_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Tofu: row-level security on, with no policy, for the tables this file makes.
-- A Tofu database opens the tables these files make to Supabase's Data API
-- roles; with this, those roles read and change no row. The app is not
-- limited: its own connection owns the tables, and the policy is not forced.
ALTER TABLE "VolumeTarget" ENABLE ROW LEVEL SECURITY;
