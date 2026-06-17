import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  SYSTEM_PROMPTS,
  fetchSystemPrompt,
  getSystemPrompt,
} from "./system-prompts.ts";

// ─────────────── Helpers ───────────────

const ORIGINAL_FETCH = globalThis.fetch;
const ORIGINAL_ENV_GET = Deno.env.get.bind(Deno.env);

function stubEnv(map: Record<string, string | undefined>) {
  (Deno.env as any).get = (k: string) =>
    Object.prototype.hasOwnProperty.call(map, k) ? map[k] : ORIGINAL_ENV_GET(k);
}
function restoreEnv() {
  (Deno.env as any).get = ORIGINAL_ENV_GET;
}
function stubFetch(handler: (input: RequestInfo | URL) => Response | Promise<Response>) {
  (globalThis as any).fetch = (input: RequestInfo | URL) => Promise.resolve(handler(input));
}
function restoreFetch() {
  globalThis.fetch = ORIGINAL_FETCH;
}

const KNOWN_KEY = "chat_assistant"; // exists in manifest
const UNKNOWN_KEY = "__does_not_exist_in_manifest__";

// ─────────────── fetchSystemPrompt ───────────────

Deno.test("fetchSystemPrompt: returns override_content when DB has override", async () => {
  stubEnv({ SUPABASE_URL: "https://x.test", SUPABASE_SERVICE_ROLE_KEY: "k" });
  stubFetch(() =>
    new Response(
      JSON.stringify([{ override_content: "OVERRIDE", default_content: "DEFAULT" }]),
      { status: 200, headers: { "content-type": "application/json" } },
    ),
  );
  try {
    const out = await fetchSystemPrompt(KNOWN_KEY, "FB");
    assertEquals(out, "OVERRIDE");
  } finally {
    restoreFetch();
    restoreEnv();
  }
});

Deno.test("fetchSystemPrompt: falls back to default_content when no override", async () => {
  stubEnv({ SUPABASE_URL: "https://x.test", SUPABASE_SERVICE_ROLE_KEY: "k" });
  stubFetch(() =>
    new Response(
      JSON.stringify([{ override_content: null, default_content: "DEFAULT" }]),
      { status: 200, headers: { "content-type": "application/json" } },
    ),
  );
  try {
    const out = await fetchSystemPrompt(KNOWN_KEY, "FB");
    assertEquals(out, "DEFAULT");
  } finally {
    restoreFetch();
    restoreEnv();
  }
});

Deno.test("fetchSystemPrompt: falls back to manifest when DB row missing", async () => {
  stubEnv({ SUPABASE_URL: "https://x.test", SUPABASE_SERVICE_ROLE_KEY: "k" });
  stubFetch(() =>
    new Response("[]", { status: 200, headers: { "content-type": "application/json" } }),
  );
  try {
    const out = await fetchSystemPrompt(KNOWN_KEY, "FB");
    assertEquals(out, SYSTEM_PROMPTS[KNOWN_KEY].content);
  } finally {
    restoreFetch();
    restoreEnv();
  }
});

Deno.test("fetchSystemPrompt: falls back to manifest when fetch throws", async () => {
  stubEnv({ SUPABASE_URL: "https://x.test", SUPABASE_SERVICE_ROLE_KEY: "k" });
  stubFetch(() => {
    throw new Error("network down");
  });
  try {
    const out = await fetchSystemPrompt(KNOWN_KEY, "FB");
    assertEquals(out, SYSTEM_PROMPTS[KNOWN_KEY].content);
  } finally {
    restoreFetch();
    restoreEnv();
  }
});

Deno.test("fetchSystemPrompt: returns fallback when key unknown and DB empty", async () => {
  stubEnv({ SUPABASE_URL: "https://x.test", SUPABASE_SERVICE_ROLE_KEY: "k" });
  stubFetch(() =>
    new Response("[]", { status: 200, headers: { "content-type": "application/json" } }),
  );
  try {
    const out = await fetchSystemPrompt(UNKNOWN_KEY, "FB_TEXT");
    assertEquals(out, "FB_TEXT");
  } finally {
    restoreFetch();
    restoreEnv();
  }
});

Deno.test("fetchSystemPrompt: returns empty string when no manifest and no fallback", async () => {
  stubEnv({ SUPABASE_URL: undefined, SUPABASE_SERVICE_ROLE_KEY: undefined, SUPABASE_ANON_KEY: undefined });
  try {
    const out = await fetchSystemPrompt(UNKNOWN_KEY);
    assertEquals(out, "");
  } finally {
    restoreEnv();
  }
});

Deno.test("fetchSystemPrompt: uses manifest when env vars missing", async () => {
  stubEnv({ SUPABASE_URL: undefined, SUPABASE_SERVICE_ROLE_KEY: undefined, SUPABASE_ANON_KEY: undefined });
  try {
    const out = await fetchSystemPrompt(KNOWN_KEY, "FB");
    assertEquals(out, SYSTEM_PROMPTS[KNOWN_KEY].content);
  } finally {
    restoreEnv();
  }
});

// ─────────────── getSystemPrompt (client-based) ───────────────

function mockClient(row: { override_content: string | null; default_content: string | null } | null, error?: unknown) {
  return {
    from: (_t: string) => ({
      select: (_s: string) => ({
        eq: (_c: string, _v: string) => ({
          maybeSingle: async () => ({ data: row, error: error ?? null }),
        }),
      }),
    }),
  };
}

Deno.test("getSystemPrompt: prefers override over default", async () => {
  const c = mockClient({ override_content: "OV", default_content: "DEF" });
  assertEquals(await getSystemPrompt(c, KNOWN_KEY), "OV");
});

Deno.test("getSystemPrompt: returns default when no override", async () => {
  const c = mockClient({ override_content: null, default_content: "DEF" });
  assertEquals(await getSystemPrompt(c, KNOWN_KEY), "DEF");
});

Deno.test("getSystemPrompt: falls back to manifest when row null", async () => {
  const c = mockClient(null);
  assertEquals(await getSystemPrompt(c, KNOWN_KEY), SYSTEM_PROMPTS[KNOWN_KEY].content);
});

Deno.test("getSystemPrompt: falls back to manifest on DB error", async () => {
  const c = mockClient(null, new Error("db down"));
  assertEquals(await getSystemPrompt(c, KNOWN_KEY), SYSTEM_PROMPTS[KNOWN_KEY].content);
});

Deno.test("getSystemPrompt: empty string for unknown key with no DB row", async () => {
  const c = mockClient(null);
  assertEquals(await getSystemPrompt(c, UNKNOWN_KEY), "");
});