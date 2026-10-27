// Tofu: lost replies must be retryable without inserting a second set.
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { db } from '@/lib/db';
import { getCurrentUserId } from '@/lib/auth';
import { POST } from '@/app/api/sessions/[id]/sets/route';
vi.mock('@/lib/auth', () => ({ getCurrentUserId: vi.fn() }));
const auth = vi.mocked(getCurrentUserId);
beforeEach(() => auth.mockReset());

async function fixture(email = 'retry@example.invalid') {
  const user = await db.user.create({ data: { email, passwordHash: 'local-test' } });
  const exercise = await db.exercise.create({ data: { userId: user.id, name: 'Bench Press', muscleGroup: 'CHEST', category: 'COMPOUND' } });
  const session = await db.session.create({ data: { userId: user.id } });
  auth.mockResolvedValue(user.id);
  return { user, exercise, session };
}
function send(sessionId: string, exerciseId: string, clientId?: string, weight = 60) {
  return POST(new Request('http://test.local/api', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ exerciseId, setNumber: 1, weight, reps: 5, clientId }),
  }), { params: Promise.resolve({ id: sessionId }) });
}

describe('retrying a set after a lost reply', () => {
  it('returns one row for two sends, including after the workout was finished', async () => {
    const { session, exercise } = await fixture();
    const first = await send(session.id, exercise.id, 'loc_retry');
    const second = await send(session.id, exercise.id, 'loc_retry');
    expect(first.status).toBe(201);
    expect(second.status).toBe(201);
    const saved = await first.json();
    expect(await second.json()).toMatchObject({ id: saved.id, weight: 60 });
    expect(await db.set.count({ where: { sessionId: session.id } })).toBe(1);
    await db.session.update({ where: { id: session.id }, data: { finishedAt: new Date() } });
    const afterFinish = await send(session.id, exercise.id, 'loc_retry');
    expect(afterFinish.status).toBe(201);
    expect(await afterFinish.json()).toMatchObject({ id: saved.id });
  });

  it('handles simultaneous identical sends without duplicate rows or 500s', async () => {
    const { session, exercise } = await fixture();
    const responses = await Promise.all(Array.from({ length: 5 }, () => send(session.id, exercise.id, 'loc_racing')));
    expect(responses.map((res) => res.status)).toEqual([201, 201, 201, 201, 201]);
    const records = await Promise.all(responses.map((res) => res.json()));
    expect(new Set(records.map((row) => row.id)).size).toBe(1);
    expect(await db.set.count({ where: { sessionId: session.id } })).toBe(1);
  });

  it('does not overwrite a saved set when a retry carries different values', async () => {
    const { session, exercise } = await fixture();
    await send(session.id, exercise.id, 'loc_same', 60);
    const res = await send(session.id, exercise.id, 'loc_same', 90);
    expect(await res.json()).toMatchObject({ weight: 60 });
    expect(await db.set.count({ where: { sessionId: session.id } })).toBe(1);
  });

  it('scopes the key to the session and still enforces ownership', async () => {
    const { user, session, exercise } = await fixture();
    const other = await db.session.create({ data: { userId: user.id } });
    const first = await (await send(session.id, exercise.id, 'loc_same')).json();
    const second = await (await send(other.id, exercise.id, 'loc_same')).json();
    expect(second.id).not.toBe(first.id);
    const stranger = await db.user.create({ data: { email: 'stranger@example.invalid', passwordHash: 'local-test' } });
    auth.mockResolvedValue(stranger.id);
    expect((await send(session.id, exercise.id, 'loc_same')).status).toBe(404);
  });

  it('leaves callers without a key free to record two identical sets', async () => {
    const { session, exercise } = await fixture();
    await send(session.id, exercise.id);
    await send(session.id, exercise.id);
    expect(await db.set.count({ where: { sessionId: session.id } })).toBe(2);
  });
});
