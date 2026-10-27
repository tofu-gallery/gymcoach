// Hydrates IndexedDB with the sets fetched from the server.
// Tofu: reconcile by serverId as well as localId, so a locally logged set
// and its server snapshot are one row. Preserve unsent edits while hydrating.
//
// Strategy: on every SessionRunner mount, we call hydrate with the
// server-side sets. IndexedDB thus becomes the single source of truth
// for display (the components use useLiveQuery on Dexie).
//
// Ownership (issue #490): the page that renders the runner loaded the
// session scoped to the signed-in user, so this is the one place that knows
// who owns `sessionId`. Server rows are tagged with that user, and queued rows
// of this session written before rows carried a `userId` are claimed by them,
// so they count in that user's offline badge right away. The sync would also
// tag them on its first 2xx for them (lib/sync.ts).

import type { Set as PrismaSet } from '@/lib/prisma-client';
import { getDB, type PendingSet } from '@/lib/indexeddb';

export async function hydrateFromServerSets(
  sessionId: string,
  serverSets: PrismaSet[],
  userId: string,
): Promise<void> {
  const db = getDB();
  const records: PendingSet[] = serverSets.map((s) => ({
    localId: `srv_${s.id}`,
    sessionId,
    userId,
    exerciseId: s.exerciseId,
    gymEquipmentId: s.gymEquipmentId,
    setNumber: s.setNumber,
    weight: s.weight,
    reps: s.reps,
    rir: s.rir,
    durationSec: s.durationSec,
    distanceM: s.distanceM,
    notes: s.notes,
    isWarmup: s.isWarmup,
    isDropSet: s.isDropSet,
    block: s.block,
    createdAt: new Date(s.completedAt).getTime(),
    status: 'synced',
    serverId: s.id,
    syncedAt: new Date(s.completedAt).getTime(),
    attempts: 0,
    lastError: null,
  }));
  // One write transaction prevents a completing sync or local edit from
  // landing between the reconciliation read and write.
  await db.transaction('rw', db.pendingSets, async () => {
    const local = await db.pendingSets.where('sessionId').equals(sessionId).toArray();
    const mine = local.filter((row) => row.userId === userId || row.userId === undefined);
    const reconciled: PendingSet[] = [];
    const duplicates: string[] = [];
    for (const record of records) {
      const matches = mine.filter((row) => row.serverId === record.serverId);
      // Prefer unsent work, then the original local identity. A server
      // snapshot must not replace a newer edit that is still in the queue.
      matches.sort((a, b) =>
        Number(a.status === 'synced') - Number(b.status === 'synced') ||
        Number(a.localId.startsWith('srv_')) - Number(b.localId.startsWith('srv_')),
      );
      const existing = matches[0];
      if (!existing) {
        // Do not overwrite a row explicitly owned by a different account.
        if (!local.some((row) => row.localId === record.localId)) reconciled.push(record);
        continue;
      }
      reconciled.push(existing.status === 'synced'
        ? { ...existing, ...record, localId: existing.localId }
        : { ...existing, userId });
      duplicates.push(...matches.slice(1).filter((row) => row.status === 'synced').map((row) => row.localId));
    }
    await db.pendingSets.bulkDelete(duplicates);
    await db.pendingSets.bulkPut(reconciled);
    // Only this session's owner can claim its untagged legacy rows.
    await db.pendingSets.where('sessionId').equals(sessionId).modify((row) => {
      if (row.userId === undefined) row.userId = userId;
    });
  });
}
