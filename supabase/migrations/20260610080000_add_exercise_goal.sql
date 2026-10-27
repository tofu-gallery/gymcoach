-- Tofu: prisma/migrations/20260610080000_add_exercise_goal/migration.sql, unchanged, which Tofu
-- applies before each build (see TOFU.md). The lines after it turn row-level security on,
-- with no policy, for the tables it makes.

-- Additive migration (issue #90): per-exercise target goals. New table only,
-- no change to existing tables.

-- CreateTable
CREATE TABLE "ExerciseGoal" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "exerciseId" TEXT NOT NULL,
    "targetWeight" DOUBLE PRECISION NOT NULL,
    "targetReps" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "achievedAt" TIMESTAMP(3),
    CONSTRAINT "ExerciseGoal_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ExerciseGoal_userId_exerciseId_key" ON "ExerciseGoal"("userId", "exerciseId");

-- AddForeignKey
ALTER TABLE "ExerciseGoal" ADD CONSTRAINT "ExerciseGoal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExerciseGoal" ADD CONSTRAINT "ExerciseGoal_exerciseId_fkey" FOREIGN KEY ("exerciseId") REFERENCES "Exercise"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Tofu: row-level security on, with no policy, for the tables this file makes.
-- A Tofu database opens the tables these files make to Supabase's Data API
-- roles; with this, those roles read and change no row. The app is not
-- limited: its own connection owns the tables, and the policy is not forced.
ALTER TABLE "ExerciseGoal" ENABLE ROW LEVEL SECURITY;
