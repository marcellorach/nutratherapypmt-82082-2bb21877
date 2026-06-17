import "https://deno.land/std@0.224.0/dotenv/load.ts";
import { assertEquals, assert } from "https://deno.land/std@0.224.0/assert/mod.ts";

const SUPABASE_URL = Deno.env.get("VITE_SUPABASE_URL") ?? Deno.env.get("SUPABASE_URL");
const SUPABASE_ANON_KEY =
  Deno.env.get("VITE_SUPABASE_PUBLISHABLE_KEY") ??
  Deno.env.get("SUPABASE_ANON_KEY") ??
  Deno.env.get("SUPABASE_PUBLISHABLE_KEY");

Deno.test("verify-system-prompts: returns status=ok after deploy", async () => {
  assert(SUPABASE_URL, "Missing SUPABASE URL env");
  assert(SUPABASE_ANON_KEY, "Missing SUPABASE anon key env");

  const res = await fetch(`${SUPABASE_URL}/functions/v1/verify-system-prompts`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      apikey: SUPABASE_ANON_KEY!,
    },
    body: JSON.stringify({ app_version: "test-suite", triggered_by: "deno-test" }),
  });

  const text = await res.text();
  assertEquals(res.status, 200, `HTTP ${res.status}: ${text}`);

  const json = JSON.parse(text);
  assertEquals(
    json.status,
    "ok",
    `verify-system-prompts reported drift. Details:\n${JSON.stringify(json, null, 2)}`,
  );

  // Sanity: counts must match
  assert(typeof json.manifest_count === "number", "manifest_count missing");
  assert(typeof json.db_count === "number", "db_count missing");
  assertEquals(
    json.manifest_count,
    json.db_count,
    `manifest/db count mismatch: ${json.manifest_count} vs ${json.db_count}`,
  );
});