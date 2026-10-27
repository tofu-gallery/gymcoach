// Tofu: a browser's stable row key makes retries safe after a lost response.
import { createHash } from 'node:crypto';
import { NextResponse } from 'next/server';
import type { Exercise, Set } from '@/lib/prisma-client';
import { db } from '@/lib/db';
import { Prisma } from '@/prisma/generated/client';
import { setInputSchema, validateSetForCategory } from '@/lib/schemas/set';
import { ApiError, handleApiError, parseJsonBody, requireApiUserId } from '@/lib/api';
import { setAchievesGoal } from '@/lib/goals';
import { effectiveWeight } from '@/lib/stats';
import { resolveSetEquipmentSnapshot } from '@/lib/set-equipment';
import { effectiveSetBlock } from '@/lib/exercise-blocks';

interface Params {
  params: Promise<{ id: string }>;
}

// POST /api/sessions/[id]/sets: records a set in a session.
export async function POST(req: Request, props: Params) {
  const params = await props.params;
  try {
    const userId = await requireApiUserId();

    // Scoped reads (issue #317): ownership is part of each query, not a
    // separate comparison that a later edit could drop.
    const session = await db.session.findFirst({ where: { id: params.id, userId } });
    if (!session) {
      throw new ApiError(404, 'Session not found.');
    }
    const data = await parseJsonBody(req, setInputSchema);
    // The existing primary key supplies atomic uniqueness without a schema
    // change. Include the account and session so callers cannot name or read
    // another user's row. A 'c' prefix also satisfies existing cuid readers.
    const retryId = data.clientId
      ? `c${createHash('sha256').update(JSON.stringify([userId, params.id, data.clientId])).digest('hex')}`
      : undefined;
    if (retryId) {
      const saved = await db.set.findFirst({ where: { id: retryId, sessionId: params.id } });
      if (saved) return NextResponse.json(saved, { status: 201 });
    }
    if (session.finishedAt) {
      throw new ApiError(400, 'Session already finished.');
    }

    // Validation: the exercise must belong to the user.
    const exercise = await db.exercise.findFirst({
      where: { id: data.exerciseId, userId },
    });
    if (!exercise) {
      throw new ApiError(400, 'Invalid exercise.');
    }

    // Cardio cross-field rule (issue #133): duration/distance only on CARDIO
    // exercises, and a cardio set requires a duration.
    const categoryError = validateSetForCategory(exercise.category, data);
    if (categoryError) {
      throw new ApiError(400, categoryError);
    }
    const isCardio = exercise.category === 'CARDIO';

    // Block of a repeated exercise (issue #429): stored only when the
    // session's workout holds this exercise more than once, normalized into
    // range, so a single-occurrence exercise always stores NULL as before.
    const occurrences = session.workoutId
      ? await db.programExercise.count({
          // Ownership in the query scope itself (issue #317): the session is
          // the user's, and so must the workout whose rows are counted.
          where: {
            workoutId: session.workoutId,
            exerciseId: data.exerciseId,
            workout: { program: { userId } },
          },
        })
      : 0;
    const block = occurrences > 1 ? effectiveSetBlock(data.block, occurrences) : null;

    const created = await db.$transaction(async (tx) => {
      const canonicalWeight = isCardio ? 0 : data.weight;
      const equipmentSnapshot = await resolveSetEquipmentSnapshot(tx, {
        userId,
        sessionGymId: session.gymId,
        exerciseId: data.exerciseId,
        gymEquipmentId: data.gymEquipmentId,
      });
      return tx.set.create({
        data: {
          ...(retryId ? { id: retryId } : {}),
          sessionId: params.id,
          exerciseId: data.exerciseId,
          ...equipmentSnapshot,
          setNumber: data.setNumber,
          // Cardio sets store weight = 0 / reps = 1 by convention (the columns
          // are NOT NULL); the UI never shows them for CARDIO exercises.
          weight: canonicalWeight,
          reps: isCardio ? 1 : data.reps,
          rir: isCardio ? null : (data.rir ?? null),
          durationSec: isCardio ? data.durationSec : null,
          distanceM: isCardio ? (data.distanceM ?? null) : null,
          avgHr: isCardio ? (data.avgHr ?? null) : null,
          maxHr: isCardio ? (data.maxHr ?? null) : null,
          notes: data.notes ?? null,
          isWarmup: data.isWarmup ?? false,
          isDropSet: data.isDropSet ?? false,
          block,
        },
      });
    }).catch(async (err: unknown) => {
      // Two tabs may retry together. The loser reads the committed winner
      // outside the rolled-back transaction; it never overwrites its values.
      if (retryId && err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        const saved = await db.set.findFirst({ where: { id: retryId, sessionId: params.id } });
        if (saved) return saved;
      }
      throw err;
    });
    // Best-effort: the set is already committed, so a failure here must never
    // fail the request (a 500 would make the offline sync retry the POST and
    // duplicate the set). An unstamped goal self-heals on the next achieving
    // set or on goal re-creation, which re-derives achievedAt from history.
    try {
      await stampGoalIfAchieved(userId, exercise, created);
    } catch (stampErr) {
      console.error('[api] goal achievement stamping failed:', stampErr);
    }

    return NextResponse.json(created, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}

// Per-exercise goal (issue #90): when a freshly logged working set meets an
// unachieved goal's target, stamp achievedAt with the set's completedAt
// (deterministic - the same instant the goal-creation path would derive).
// Comparison runs on the effective load (bodyweight + added load for
// bodyweight exercises), consistent with lib/stats.
async function stampGoalIfAchieved(userId: string, exercise: Exercise, set: Set): Promise<void> {
  if (set.isWarmup) return;
  const goal = await db.exerciseGoal.findUnique({
    where: { userId_exerciseId: { userId, exerciseId: exercise.id } },
  });
  if (!goal || goal.achievedAt) return;

  let weight = set.weight;
  if (exercise.usesBodyweight) {
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { bodyweight: true },
    });
    weight = effectiveWeight(set.weight, true, user?.bodyweight);
  }
  if (setAchievesGoal({ weight, reps: set.reps, isWarmup: set.isWarmup }, goal)) {
    await db.exerciseGoal.update({
      where: { id: goal.id },
      data: { achievedAt: set.completedAt },
    });
  }
}
