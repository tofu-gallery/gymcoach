import { describe, it, expect, vi, beforeEach, beforeAll, afterAll } from 'vitest';
import { db } from '@/lib/db';
import { getCurrentUserId } from '@/lib/auth';

// Auth is read through getCurrentUserId (via requireApiUserId in @/lib/api).
vi.mock('@/lib/auth', () => ({ getCurrentUserId: vi.fn() }));
const mockUserId = vi.mocked(getCurrentUserId);

import { POST as parseSet } from '@/app/api/sets/parse/route';

// Run the parse route against the deterministic demo provider so the test has
// no key dependency and exercises the real validation path.
const savedProvider = process.env.LLM_PROVIDER;
beforeAll(() => {
  process.env.LLM_PROVIDER = 'demo';
});
afterAll(() => {
  if (savedProvider === undefined) delete process.env.LLM_PROVIDER;
  else process.env.LLM_PROVIDER = savedProvider;
});

function actAs(userId: string) {
  mockUserId.mockResolvedValue(userId);
}

function jsonReq(body: unknown): Request {
  return new Request('http://test.local/api/sets/parse', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

async function seed() {
  const [a, b] = await Promise.all([
    db.user.create({ data: { email: 'parse-owner@test.dev', passwordHash: 'x' } }),
    db.user.create({ data: { email: 'parse-stranger@test.dev', passwordHash: 'x' } }),
  ]);
  const bench = await db.exercise.create({
    data: { userId: a.id, name: 'Bench', muscleGroup: 'CHEST', category: 'COMPOUND' },
  });
  const run = await db.exercise.create({
    data: { userId: a.id, name: 'Running', muscleGroup: 'OTHER', category: 'CARDIO' },
  });
  const strangersBench = await db.exercise.create({
    data: { userId: b.id, name: 'B Bench', muscleGroup: 'CHEST', category: 'COMPOUND' },
  });
  return { a, b, bench, run, strangersBench };
}

beforeEach(() => {
  mockUserId.mockReset();
});

describe('POST /api/sets/parse (issue #210)', () => {
  it('returns a validated strength parse for the owner exercise', async () => {
    const { a, bench } = await seed();
    actAs(a.id);
    const res = await parseSet(jsonReq({ exerciseId: bench.id, text: '100 for 8' }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.parsed).toEqual({ kind: 'strength', weight: 100, reps: 8, rir: 2 });
  });

  it('returns a cardio parse for a cardio exercise', async () => {
    const { a, run } = await seed();
    actAs(a.id);
    const res = await parseSet(
      jsonReq({ exerciseId: run.id, text: 'ran 5k in 25 minutes' }),
    );
    const body = await res.json();
    expect(body.parsed.kind).toBe('cardio');
    expect(body.parsed.durationSec).toBe(1500);
  });

  // Tofu: with no AI key saved, the route says which key the owner adds.
  it('answers 503 naming the key the owner adds when no AI key is saved', async () => {
    const { a, bench } = await seed();
    actAs(a.id);
    const saved = {
      LLM_PROVIDER: process.env.LLM_PROVIDER,
      ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
      OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY,
    };
    delete process.env.LLM_PROVIDER;
    delete process.env.ANTHROPIC_API_KEY;
    delete process.env.OPENROUTER_API_KEY;
    try {
      const res = await parseSet(jsonReq({ exerciseId: bench.id, text: '100 for 8' }));
      expect(res.status).toBe(503);
      const body = await res.json();
      expect(body).toMatchObject({ keyMissing: true, variable: 'ANTHROPIC_API_KEY' });
      expect(body.error).toMatch(/^The owner of this GymCoach turns on the AI features/);
    } finally {
      for (const [key, value] of Object.entries(saved)) {
        if (value === undefined) delete process.env[key];
        else process.env[key] = value;
      }
    }
  });

  it('returns parsed: null (not an error) when the model cannot parse', async () => {
    const { a, bench } = await seed();
    actAs(a.id);
    // The demo provider returns the refusal sentinel for the UNPARSEABLE marker.
    const res = await parseSet(jsonReq({ exerciseId: bench.id, text: 'UNPARSEABLE junk' }));
    expect(res.status).toBe(200);
    expect((await res.json()).parsed).toBeNull();
  });

  it('does not log any set as a side effect of parsing', async () => {
    const { a, bench } = await seed();
    actAs(a.id);
    await parseSet(jsonReq({ exerciseId: bench.id, text: '100 for 8' }));
    expect(await db.set.count()).toBe(0);
    expect(await db.session.count()).toBe(0);
  });

  it("404s on another user's exercise (ownership)", async () => {
    const { a, strangersBench } = await seed();
    actAs(a.id);
    const res = await parseSet(
      jsonReq({ exerciseId: strangersBench.id, text: '100 for 8' }),
    );
    expect(res.status).toBe(404);
  });

  it('rejects an empty or missing text with 400', async () => {
    const { a, bench } = await seed();
    actAs(a.id);
    expect((await parseSet(jsonReq({ exerciseId: bench.id, text: '' }))).status).toBe(400);
    expect((await parseSet(jsonReq({ exerciseId: bench.id }))).status).toBe(400);
  });

  it('rejects an unauthenticated request with 401', async () => {
    const { bench } = await seed();
    mockUserId.mockResolvedValue(null);
    const res = await parseSet(jsonReq({ exerciseId: bench.id, text: '100 for 8' }));
    expect(res.status).toBe(401);
  });

  it('rejects an over-length text with 400 (never reaches the model)', async () => {
    const { a, bench } = await seed();
    actAs(a.id);
    // text is bounded to 500 chars so a huge blob cannot be forwarded to the LLM.
    const res = await parseSet(
      jsonReq({ exerciseId: bench.id, text: 'x'.repeat(501) }),
    );
    expect(res.status).toBe(400);
    expect(await db.set.count()).toBe(0);
  });

  it('rate-limits a burst with 429', async () => {
    const { a, bench } = await seed();
    actAs(a.id);
    // The route allows 20 parses/min per user; the 21st is rejected.
    let limited = false;
    for (let i = 0; i < 25; i++) {
      const res = await parseSet(jsonReq({ exerciseId: bench.id, text: '100 for 8' }));
      if (res.status === 429) {
        expect(res.headers.get('retry-after') ?? res.headers.get('Retry-After')).toBeTruthy();
        limited = true;
        break;
      }
    }
    expect(limited).toBe(true);
    expect(await db.set.count()).toBe(0);
  });
});
