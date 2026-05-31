// deno-lint-ignore-file no-explicit-any
// Cron-invoked watchdog for technical_audits.
// - Finds processing audits whose last_heartbeat is older than STALL_AFTER_MS.
// - If resume_count < MAX_RESUMES: invokes generate-audit with action=resume.
// - Otherwise: marks the audit as failed with a clear reason and frees the UI.
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const STALL_AFTER_MS = 3 * 60 * 1000; // 3 minutes without heartbeat = stalled
const MAX_RESUMES = 2;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  const service = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const out: any[] = [];

  try {
    const { data: rows, error } = await service
      .from("technical_audits")
      .select("id, version, scope, system_version, system_changelog_date, summary, last_heartbeat, resume_count, progress_log")
      .filter("summary->>status", "eq", "processing");
    if (error) throw error;

    const now = Date.now();
    for (const row of (rows ?? []) as any[]) {
      const hb = row.last_heartbeat ? new Date(row.last_heartbeat).getTime() : 0;
      const ageMs = now - hb;
      if (!hb || ageMs < STALL_AFTER_MS) { out.push({ id: row.id, action: "skip", age_ms: ageMs }); continue; }

      const resumeCount = Number(row.resume_count ?? 0);

      // Append a watchdog log entry first so the UI shows the diagnosis.
      const prevLog = Array.isArray(row.progress_log) ? row.progress_log : [];
      const logEntry = {
        ts: new Date().toISOString(),
        level: "warn" as const,
        phase: "watchdog" as const,
        message: `Heartbeat perdido há ${Math.round(ageMs / 1000)}s. ${resumeCount < MAX_RESUMES ? "Tentando retomar automaticamente." : "Limite de retomadas atingido — marcando como failed."}`,
      };
      await service.from("technical_audits")
        .update({ progress_log: [...prevLog, logEntry].slice(-200), last_heartbeat: logEntry.ts })
        .eq("id", row.id);

      if (resumeCount >= MAX_RESUMES) {
        await service.from("technical_audits").update({
          summary: {
            ...(row.summary ?? {}),
            status: "failed",
            stage: "failed",
            stage_label: "Falhou (watchdog)",
            progress: 100,
            error: `Geração travada por ${Math.round(ageMs / 1000)}s após ${resumeCount} retomadas. Re-execute manualmente.`,
          },
        }).eq("id", row.id);
        out.push({ id: row.id, action: "failed", resume_count: resumeCount, age_ms: ageMs });
        continue;
      }

      // Fire-and-forget resume: generate-audit picks up where it left off via action=resume.
      try {
        await fetch(`${SUPABASE_URL}/functions/v1/generate-audit`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`, apikey: SUPABASE_SERVICE_ROLE_KEY },
          body: JSON.stringify({
            action: "resume",
            version: row.version || row.id.replace(/^v/, ""),
            scope: row.scope ?? "",
            system_version: row.system_version ?? "",
            system_changelog_date: row.system_changelog_date ?? null,
          }),
        });
        out.push({ id: row.id, action: "resumed", resume_count: resumeCount + 1, age_ms: ageMs });
      } catch (e: any) {
        out.push({ id: row.id, action: "resume_failed", error: e?.message ?? String(e), age_ms: ageMs });
      }
    }

    return new Response(JSON.stringify({ ok: true, checked: rows?.length ?? 0, results: out }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    console.error("audit-watchdog error:", e);
    return new Response(JSON.stringify({ error: e?.message ?? String(e) }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});