import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * Lê o CHANGELOG.md público do app, conta entradas Added/Changed/Fixed em áreas
 * críticas (configuráveis em audit_settings) desde a `system_changelog_date` da
 * última auditoria ativa, e — se a contagem atingir `change_threshold` —
 * insere uma audit_request com auto_triggered=true.
 *
 * Idempotente: se já existe uma request pending auto-disparada cobrindo o mesmo
 * range, não cria outra.
 */
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // 1) Settings
    const { data: settings } = await supabase
      .from("audit_settings")
      .select("change_threshold, watched_areas")
      .eq("id", true)
      .maybeSingle();
    const threshold = settings?.change_threshold ?? 6;
    const watched: string[] = settings?.watched_areas ?? [
      "curation", "kg", "clinical-pipeline", "infra", "base-knowledge",
    ];

    // 2) Última auditoria ativa (não substituída)
    const { data: lastAudit } = await supabase
      .from("technical_audits")
      .select("id, system_changelog_date, audit_date")
      .is("superseded_by", null)
      .order("audit_date", { ascending: false })
      .limit(1)
      .maybeSingle();
    const sinceDate = lastAudit?.system_changelog_date ?? "1970-01-01";

    // 3) Fetch CHANGELOG.md público
    const origin = new URL(req.url).origin.replace(
      "functions.supabase.co",
      "supabase.co",
    );
    const changelogUrl = (Deno.env.get("APP_PUBLIC_URL") ?? "https://nutratherapypmt-82082.lovable.app")
      + "/CHANGELOG.md";
    let changelogText = "";
    try {
      const res = await fetch(changelogUrl);
      if (res.ok) changelogText = await res.text();
    } catch (_) { /* swallow */ }

    // 4) Parse: bloco entre [Unreleased] e o próximo [x.y.z]
    const unreleasedMatch = changelogText.match(/##\s*\[Unreleased\]([\s\S]*?)(?=\n##\s*\[|$)/);
    const block = unreleasedMatch?.[1] ?? "";

    // Cada entrada: ### Added|Changed|Fixed - YYYY-MM-DD ... seguido de <!-- area: X -->
    const entryRegex = /###\s*(Added|Changed|Fixed)\s*-\s*(\d{4}-\d{2}-\d{2})[^\n]*\n<!--\s*area:\s*([\w-]+)/g;
    let m: RegExpExecArray | null;
    const matched: { date: string; area: string; kind: string }[] = [];
    while ((m = entryRegex.exec(block)) !== null) {
      if (m[2] > sinceDate && watched.includes(m[3])) {
        matched.push({ kind: m[1], date: m[2], area: m[3] });
      }
    }

    const count = matched.length;
    const shouldTrigger = count >= threshold;

    // 5) Idempotência: já existe request auto pending cobrindo este sinceDate?
    const { data: existingAuto } = await supabase
      .from("audit_requests")
      .select("id, system_date")
      .eq("status", "pending")
      .eq("auto_triggered", true)
      .gte("system_date", sinceDate)
      .maybeSingle();

    let created = false;
    if (shouldTrigger && !existingAuto) {
      const scope = `Auditoria sugerida automaticamente: ${count} mudanças relevantes detectadas no CHANGELOG desde ${sinceDate} em áreas críticas (${watched.join(", ")}).\n\nMudanças cobertas:\n` +
        matched.map((x) => `• ${x.date} [${x.area}] ${x.kind}`).join("\n");
      const { error: insErr } = await supabase.from("audit_requests").insert({
        scope,
        system_version: "auto-detected",
        system_date: new Date().toISOString().slice(0, 10),
        status: "pending",
        auto_triggered: true,
      });
      if (insErr) throw insErr;
      created = true;
    }

    return new Response(
      JSON.stringify({
        threshold, watched, sinceDate, count, shouldTrigger, created,
        existingPending: existingAuto?.id ?? null,
        sampled: matched.slice(0, 8),
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