// READ-ONLY profiling of Aura orphan edges (triplet_id not in triplet_extractions).
// No DELETE / MERGE / SET — only MATCH ... RETURN against Neo4j and SELECTs in Postgres.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const service = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false } },
    );

    // ---- Neo4j credentials from ai_configurations ----
    const { data: cfgRows } = await service
      .from("ai_configurations")
      .select("config_key,config_value")
      .in("config_key", ["neo4j_uri", "neo4j_username", "neo4j_password"]);
    const cfg: Record<string, string> = {};
    for (const r of (cfgRows ?? []) as any[]) cfg[r.config_key] = r.config_value;
    if (!cfg.neo4j_uri || !cfg.neo4j_username || !cfg.neo4j_password) {
      return new Response(JSON.stringify({ error: "neo4j_credentials_missing" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const httpUri = cfg.neo4j_uri.replace("neo4j+s://", "https://").replace("neo4j://", "http://");
    const auth = "Basic " + btoa(`${cfg.neo4j_username}:${cfg.neo4j_password}`);
    const cypher = async (statement: string, parameters: Record<string, unknown> = {}) => {
      const res = await fetch(`${httpUri}/db/neo4j/query/v2`, {
        method: "POST",
        headers: { Authorization: auth, "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ statement, parameters }),
        signal: AbortSignal.timeout(45_000),
      });
      if (!res.ok) throw new Error(`neo4j ${res.status}: ${await res.text()}`);
      return await res.json();
    };

    // ---- Pull every Aura edge with triplet_id, plus context ----
    // Returns: [triplet_id, lower(s.name), toLower(type(r)), lower(o.name), study_id, s_labels, o_labels]
    const edgesJson = await cypher(`
      MATCH (s)-[r]->(o)
      WHERE r.triplet_id IS NOT NULL
      RETURN r.triplet_id AS id,
             toLower(coalesce(s.name, s.id, '')) AS s,
             toLower(type(r)) AS p,
             toLower(coalesce(o.name, o.id, '')) AS o,
             coalesce(r.study_id, '') AS study_id,
             labels(s) AS s_labels,
             labels(o) AS o_labels
    `);
    const rows = (edgesJson?.data?.values ?? []) as any[][];
    type Edge = { id: string; s: string; p: string; o: string; study_id: string; s_labels: string[]; o_labels: string[] };
    const edges: Edge[] = rows.map((r) => ({
      id: String(r[0] ?? ""),
      s: String(r[1] ?? ""),
      p: String(r[2] ?? ""),
      o: String(r[3] ?? ""),
      study_id: String(r[4] ?? ""),
      s_labels: (r[5] ?? []) as string[],
      o_labels: (r[6] ?? []) as string[],
    })).filter((e) => e.id.length > 0);

    // ---- Resolve which triplet_ids exist in Postgres ----
    const allIds = Array.from(new Set(edges.map((e) => e.id)));
    const known = new Set<string>();
    for (let i = 0; i < allIds.length; i += 200) {
      const chunk = allIds.slice(i, i + 200);
      const { data: hits } = await service.from("triplet_extractions").select("id").in("id", chunk);
      for (const h of (hits ?? []) as any[]) known.add(h.id);
    }
    const orphanEdges = edges.filter((e) => !known.has(e.id));
    const orphanIds = Array.from(new Set(orphanEdges.map((e) => e.id)));

    // ---- APPROVED-alive SPO set for redundancy check ----
    const approvedSpo = new Set<string>();
    let from = 0;
    const pageSize = 1000;
    while (true) {
      const { data, error } = await service
        .from("triplet_extractions")
        .select("subject_name,predicate,object_name")
        .eq("curation_status", "approved")
        .range(from, from + pageSize - 1);
      if (error) throw new Error(`pg approved page: ${error.message}`);
      const batch = (data ?? []) as any[];
      for (const r of batch) {
        approvedSpo.add(
          `${String(r.subject_name ?? "").toLowerCase()}|${String(r.predicate ?? "").toLowerCase()}|${String(r.object_name ?? "").toLowerCase()}`,
        );
      }
      if (batch.length < pageSize) break;
      from += pageSize;
    }

    // ---- Classify each orphan edge ----
    let redundant = 0;
    let unique = 0;
    const byStudy = new Map<string, number>();
    const byPredicate = new Map<string, number>();
    const byLabel = new Map<string, number>();
    const orphanIdToClass = new Map<string, "REDUNDANT" | "UNIQUE">();
    for (const e of orphanEdges) {
      const spo = `${e.s}|${e.p}|${e.o}`;
      const cls: "REDUNDANT" | "UNIQUE" = approvedSpo.has(spo) ? "REDUNDANT" : "UNIQUE";
      orphanIdToClass.set(e.id, cls);
      if (cls === "REDUNDANT") redundant++; else unique++;
      byStudy.set(e.study_id || "(none)", (byStudy.get(e.study_id || "(none)") ?? 0) + 1);
      byPredicate.set(e.p, (byPredicate.get(e.p) ?? 0) + 1);
      for (const l of e.s_labels) byLabel.set(`S:${l}`, (byLabel.get(`S:${l}`) ?? 0) + 1);
      for (const l of e.o_labels) byLabel.set(`O:${l}`, (byLabel.get(`O:${l}`) ?? 0) + 1);
    }

    const top = (m: Map<string, number>, n: number) =>
      Array.from(m.entries()).sort((a, b) => b[1] - a[1]).slice(0, n).map(([k, v]) => ({ key: k, count: v }));

    // ---- Recoverability: do orphan IDs appear in any backup table? ----
    const recoverable = { in_ghost_backup_20260616: 0 };
    for (let i = 0; i < orphanIds.length; i += 200) {
      const chunk = orphanIds.slice(i, i + 200);
      const { data: bk } = await service
        .from("neo4j_ghost_edges_backup_20260616")
        .select("triplet_id")
        .in("triplet_id", chunk);
      recoverable.in_ghost_backup_20260616 += (bk ?? []).length;
    }

    // ---- Sample of 20 orphan edges ----
    const sample = orphanEdges.slice(0, 20).map((e) => ({
      triplet_id: e.id,
      s: e.s,
      predicate: e.p,
      o: e.o,
      study_id: e.study_id,
      class: orphanIdToClass.get(e.id),
    }));

    return new Response(
      JSON.stringify({
        ok: true,
        read_only: true,
        totals: {
          aura_edges_with_triplet_id: edges.length,
          distinct_triplet_ids: allIds.length,
          orphan_edges: orphanEdges.length,
          orphan_distinct_ids: orphanIds.length,
        },
        classification: { redundant_edges: redundant, unique_edges: unique },
        top_studies: top(byStudy, 10),
        top_predicates: top(byPredicate, 15),
        top_labels: top(byLabel, 15),
        recoverability: recoverable,
        sample_20: sample,
      }, null, 2),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as any)?.message ?? String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});