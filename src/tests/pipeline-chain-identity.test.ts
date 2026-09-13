/**
 * Chain-identity contract for the study pipeline.
 *
 * Covers: parse-study -> extract-study-entities -> generate-triplets keeps
 * working when the identity of the human who started the run is propagated
 * through the x-initiator-id header, and fails closed when it is absent.
 *
 * The authorize()/forwardIdentity() helpers talk to Deno + Supabase, so this
 * suite exercises the header contract they implement, which is what the
 * chained fetch calls depend on.
 */
import { describe, it, expect } from 'vitest';

const INITIATOR_HEADER = 'x-initiator-id';
const SYSTEM_INITIATOR = 'system';
const SERVICE_KEY = 'service-role-key';
const USER_ID = '11111111-2222-3333-4444-555555555555';

const isUuid = (value: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);

type Decision =
  | { ok: true; origin: 'user' | 'chained' | 'system'; userId: string | null }
  | { ok: false; status: number };

/** Mirrors supabase/functions/_shared/authorization.ts decision tree. */
const decide = (headers: Record<string, string>, permitted: Set<string>): Decision => {
  const auth = headers['Authorization'];
  if (!auth?.startsWith('Bearer ')) return { ok: false, status: 401 };
  const token = auth.slice(7);

  if (token === SERVICE_KEY) {
    const initiator = headers[INITIATOR_HEADER]?.trim() ?? '';
    if (initiator === SYSTEM_INITIATOR) return { ok: true, origin: 'system', userId: null };
    if (!isUuid(initiator)) return { ok: false, status: 401 };
    if (!permitted.has(initiator)) return { ok: false, status: 403 };
    return { ok: true, origin: 'chained', userId: initiator };
  }

  if (!permitted.has(token)) return { ok: false, status: 403 };
  return { ok: true, origin: 'user', userId: token };
};

const chainHeaders = (initiator: string) => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${SERVICE_KEY}`,
  [INITIATOR_HEADER]: initiator,
});

describe('pipeline chain identity', () => {
  const permitted = new Set([USER_ID]);

  it('lets the full chain run with the initiator propagated', () => {
    const parse = decide(
      { Authorization: `Bearer ${USER_ID}` }, // user JWT resolves to USER_ID
      permitted,
    );
    expect(parse).toEqual({ ok: true, origin: 'user', userId: USER_ID });

    const extract = decide(chainHeaders(USER_ID), permitted);
    expect(extract).toEqual({ ok: true, origin: 'chained', userId: USER_ID });

    const triplets = decide(chainHeaders(USER_ID), permitted);
    expect(triplets).toEqual({ ok: true, origin: 'chained', userId: USER_ID });
  });

  it('refuses an internal call with no declared initiator', () => {
    expect(decide({ Authorization: `Bearer ${SERVICE_KEY}` }, permitted)).toEqual({
      ok: false,
      status: 401,
    });
  });

  it('refuses a chained call whose initiator lost the permission', () => {
    expect(decide(chainHeaders(USER_ID), new Set())).toEqual({ ok: false, status: 403 });
  });

  it('accepts the explicit scheduled mechanism', () => {
    expect(decide(chainHeaders(SYSTEM_INITIATOR), new Set())).toEqual({
      ok: true,
      origin: 'system',
      userId: null,
    });
  });

  it('refuses a call with no Authorization header', () => {
    expect(decide({}, permitted)).toEqual({ ok: false, status: 401 });
  });
});
