/**
 * Server-side authorization for edge functions.
 *
 * public.has_permission is the single source of truth. This helper validates the
 * caller BEFORE any service-role client is created, and it makes internal
 * (function-to-function) calls explicit instead of silently unauthenticated.
 *
 * Three accepted call mechanisms, in order:
 *  1. End-user JWT  -> `Authorization: Bearer <user access token>`.
 *     The user id comes from the token, never from the request body.
 *  2. Chained internal call -> `Authorization: Bearer <service role key>` plus
 *     `x-initiator-id: <uuid>` carrying the identity of the human who started
 *     the pipeline. The initiator is checked against has_permission.
 *  3. Scheduled/system call -> service role key with `x-initiator-id: system`.
 *     Reserved for pg_cron jobs and watchdogs; recorded in the response context.
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

export const INITIATOR_HEADER = 'x-initiator-id';
export const SYSTEM_INITIATOR = 'system';

export type CallerOrigin = 'user' | 'chained' | 'system';

export interface AuthorizedCaller {
  userId: string | null;
  origin: CallerOrigin;
  /** Headers to forward when this function calls another one. */
  forwardHeaders: Record<string, string>;
}

export interface AuthzFailure {
  ok: false;
  status: number;
  error: string;
}

export type AuthzResult = ({ ok: true } & AuthorizedCaller) | AuthzFailure;

const bearer = (req: Request): string | null => {
  const header = req.headers.get('Authorization') ?? req.headers.get('authorization');
  if (!header) return null;
  const [scheme, token] = header.split(' ');
  if (!token || scheme.toLowerCase() !== 'bearer') return null;
  return token.trim();
};

const isUuid = (value: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);

export async function authorize(
  req: Request,
  permissionKey: string,
  level: 'view' | 'edit' = 'edit',
): Promise<AuthzResult> {
  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
  const token = bearer(req);

  if (!supabaseUrl || !serviceKey) {
    return { ok: false, status: 500, error: 'Server misconfigured' };
  }
  if (!token) {
    return { ok: false, status: 401, error: 'Missing Authorization header' };
  }

  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // --- Internal / scheduled calls -------------------------------------------
  if (token === serviceKey) {
    const initiator = req.headers.get(INITIATOR_HEADER)?.trim() ?? '';

    if (initiator === SYSTEM_INITIATOR) {
      return {
        ok: true,
        userId: null,
        origin: 'system',
        forwardHeaders: {
          Authorization: `Bearer ${serviceKey}`,
          [INITIATOR_HEADER]: SYSTEM_INITIATOR,
        },
      };
    }

    if (!isUuid(initiator)) {
      return {
        ok: false,
        status: 401,
        error: `Internal call requires a ${INITIATOR_HEADER} header (user uuid or "${SYSTEM_INITIATOR}")`,
      };
    }

    const { data, error } = await admin.rpc('has_permission', {
      _user_id: initiator,
      _key: permissionKey,
      _level: level,
    });
    if (error) return { ok: false, status: 500, error: error.message };
    if (data !== true) {
      return { ok: false, status: 403, error: `Initiator lacks permission: ${permissionKey}` };
    }

    return {
      ok: true,
      userId: initiator,
      origin: 'chained',
      forwardHeaders: {
        Authorization: `Bearer ${serviceKey}`,
        [INITIATOR_HEADER]: initiator,
      },
    };
  }

  // --- End-user calls --------------------------------------------------------
  const { data: userData, error: userError } = await admin.auth.getUser(token);
  if (userError || !userData?.user) {
    return { ok: false, status: 401, error: 'Invalid or expired session' };
  }
  const userId = userData.user.id;

  const { data, error } = await admin.rpc('has_permission', {
    _user_id: userId,
    _key: permissionKey,
    _level: level,
  });
  if (error) return { ok: false, status: 500, error: error.message };
  if (data !== true) {
    return { ok: false, status: 403, error: `Missing permission: ${permissionKey}` };
  }

  return {
    ok: true,
    userId,
    origin: 'user',
    forwardHeaders: {
      Authorization: `Bearer ${serviceKey}`,
      [INITIATOR_HEADER]: userId,
    },
  };
}

/** Convenience: build the 401/403 Response from a failure. */
export const authzResponse = (
  failure: AuthzFailure,
  corsHeaders: Record<string, string>,
): Response =>
  new Response(JSON.stringify({ error: failure.error }), {
    status: failure.status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

/**
 * Headers a function must use when calling another function, preserving the
 * identity of whoever started the chain. Never invents an identity: when the
 * incoming call carries no recognisable caller it declares itself as system.
 */
export async function forwardIdentity(req: Request): Promise<Record<string, string>> {
  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
  const token = bearer(req);
  const base = { 'Content-Type': 'application/json', Authorization: `Bearer ${serviceKey}` };

  if (token && token === serviceKey) {
    const initiator = req.headers.get(INITIATOR_HEADER)?.trim();
    return { ...base, [INITIATOR_HEADER]: initiator && initiator.length > 0 ? initiator : SYSTEM_INITIATOR };
  }

  if (token && supabaseUrl && serviceKey) {
    try {
      const admin = createClient(supabaseUrl, serviceKey, {
        auth: { persistSession: false, autoRefreshToken: false },
      });
      const { data } = await admin.auth.getUser(token);
      if (data?.user?.id) return { ...base, [INITIATOR_HEADER]: data.user.id };
    } catch (_) {
      // fall through to system
    }
  }

  return { ...base, [INITIATOR_HEADER]: SYSTEM_INITIATOR };
}
