// Edge function: compara snapshots auditáveis entre Preview e Publicado.
// Sem CORS no browser porque o fetch é server-side. Whitelist fixa de arquivos.
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const ALLOWED_FILES = new Set([
  "manifest.json",
  "drift-report.json",
  "ARCHITECTURE_LIVE.md",
  "CHANGELOG.md",
  "PROMPTS.md",
]);

async function sha256Hex(s: string): Promise<string> {
  const buf = new TextEncoder().encode(s);
  const hash = await crypto.subtle.digest("SHA-256", buf);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function fetchOne(baseUrl: string, file: string) {
  const url = `${baseUrl.replace(/\/+$/, "")}/snapshots/${file}`;
  const started = Date.now();
  try {
    const res = await fetch(url, {
      headers: { "cache-control": "no-cache" },
      // Curto: snapshots são pequenos (<200KB)
      signal: AbortSignal.timeout(15_000),
    });
    const body = res.ok ? await res.text() : "";
    return {
      url,
      status: res.status,
      bytes: body.length,
      sha256: body ? await sha256Hex(body) : null,
      body,
      fetched_at: new Date().toISOString(),
      duration_ms: Date.now() - started,
    };
  } catch (e) {
    return {
      url,
      status: 0,
      bytes: 0,
      sha256: null,
      body: "",
      fetched_at: new Date().toISOString(),
      duration_ms: Date.now() - started,
      error: e instanceof Error ? e.message : String(e),
    };
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const previewUrl: string = String(body.preview_url || "").trim();
    const publishedUrl: string = String(body.published_url || "").trim();
    const requested: string[] = Array.isArray(body.files) ? body.files : [];

    if (!previewUrl || !publishedUrl) {
      return new Response(
        JSON.stringify({ error: "preview_url and published_url are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const files = requested.filter((f) => ALLOWED_FILES.has(f));
    if (files.length === 0) {
      return new Response(
        JSON.stringify({ error: "no allowed files requested" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const results = await Promise.all(
      files.map(async (file) => {
        const [preview, published] = await Promise.all([
          fetchOne(previewUrl, file),
          fetchOne(publishedUrl, file),
        ]);
        const equal =
          preview.sha256 !== null &&
          published.sha256 !== null &&
          preview.sha256 === published.sha256;
        return { file, equal, preview, published };
      }),
    );

    return new Response(
      JSON.stringify({
        compared_at: new Date().toISOString(),
        preview_url: previewUrl,
        published_url: publishedUrl,
        results,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : String(e) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});