// Edge function: gera capa ilustrativa para meta-estudos via Lovable AI Gateway (Gemini image).
// Aceita { study_ids?: string[], all_missing?: boolean, overwrite?: boolean }
// Style guide fixo garante consistência visual entre todos os papers.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { fetchSystemPrompt } from "../_shared/system-prompts.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// Default fallback se a busca no DB falhar. A versão editável vive em
// `ai_system_prompts.prompt_key = 'generate_meta_study_cover_style'`.
const STYLE_GUIDE_DEFAULT = [
  "isometric scientific editorial illustration",
  "flat vector style, clean geometric shapes",
  "muted academic palette: deep navy #1a2942, antique gold #c9a84c, warm parchment #f5f0e8, sage #87a878",
  "abstract representation only — no text, no letters, no people, no animals, no logos",
  "centered composition on solid #f5f0e8 background",
  "subtle paper grain texture, soft shadows",
  "Stanford research lab aesthetic, Nature journal cover feel",
].join(", ");

const KIND_THEME: Record<string, string> = {
  architectural: "interconnected nodes and edges forming a knowledge graph, abstract retrieval pathways",
  methodological: "layered protocol diagrams, branching decision flows, scientific instruments",
  translational: "bridge connecting molecular structures to a stylized canine silhouette outline",
  ontological: "hierarchical taxonomy tree, classification rings, structured concept lattices",
  empirical: "data charts, distribution curves, measurement points",
  conceptual: "abstract geometric framework, intersecting planes, conceptual scaffolding",
};

function buildPrompt(study: { title: string; kind: string; summary?: string | null }, styleGuide: string): string {
  const theme = KIND_THEME[study.kind] || KIND_THEME.architectural;
  const topic = study.title.slice(0, 140);
  return `${styleGuide}. Subject: ${theme}. Conceptually inspired by: "${topic}". Composition must feel cohesive with a series of related editorial covers.`;
}

async function generateOne(supa: any, studyId: string, overwrite: boolean, styleGuide: string): Promise<{ id: string; ok: boolean; url?: string; error?: string }> {
  const { data: study, error: fetchErr } = await supa
    .from("meta_studies")
    .select("id, title, kind, summary, cover_image_url")
    .eq("id", studyId)
    .maybeSingle();
  if (fetchErr || !study) return { id: studyId, ok: false, error: fetchErr?.message || "not found" };
  if (study.cover_image_url && !overwrite) {
    return { id: studyId, ok: true, url: study.cover_image_url };
  }

  const prompt = buildPrompt(study, styleGuide);
  const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash-image",
      messages: [{ role: "user", content: prompt }],
      modalities: ["image", "text"],
    }),
  });
  if (!resp.ok) {
    const txt = await resp.text();
    return { id: studyId, ok: false, error: `gateway ${resp.status}: ${txt.slice(0, 200)}` };
  }
  const json = await resp.json();
  const dataUrl: string | undefined = json?.choices?.[0]?.message?.images?.[0]?.image_url?.url;
  if (!dataUrl?.startsWith("data:image/")) {
    return { id: studyId, ok: false, error: "no image in response" };
  }
  const [meta, b64] = dataUrl.split(",");
  const mime = meta.match(/data:(.*?);/)?.[1] || "image/png";
  const ext = mime.split("/")[1] || "png";
  const bin = Uint8Array.from(atob(b64), c => c.charCodeAt(0));

  const path = `${studyId}.${ext}`;
  const { error: upErr } = await supa.storage
    .from("meta-study-covers")
    .upload(path, bin, { contentType: mime, upsert: true });
  if (upErr) return { id: studyId, ok: false, error: `upload: ${upErr.message}` };

  const { data: pub } = supa.storage.from("meta-study-covers").getPublicUrl(path);
  const publicUrl = `${pub.publicUrl}?v=${Date.now()}`;

  const { error: updErr } = await supa
    .from("meta_studies")
    .update({ cover_image_url: publicUrl, cover_generated_at: new Date().toISOString() })
    .eq("id", studyId);
  if (updErr) return { id: studyId, ok: false, error: `update: ${updErr.message}` };

  return { id: studyId, ok: true, url: publicUrl };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");
    const body = await req.json().catch(() => ({}));
    const overwrite: boolean = !!body.overwrite;
    const supa = createClient(SUPABASE_URL, SERVICE_ROLE);

    let ids: string[] = Array.isArray(body.study_ids) ? body.study_ids : [];
    if (body.all_missing) {
      const { data } = await supa
        .from("meta_studies")
        .select("id")
        .is("cover_image_url", null);
      ids = (data || []).map((r: any) => r.id);
    }
    if (ids.length === 0) {
      return new Response(JSON.stringify({ results: [], message: "no studies to process" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const results = [];
    // Resolvido em runtime via override (DB) → default (DB) → manifest → fallback.
    // Editável no painel Admin → System Prompts → `generate_meta_study_cover_style`.
    const styleGuide = await fetchSystemPrompt('generate_meta_study_cover_style', STYLE_GUIDE_DEFAULT);
    for (const id of ids) {
      const r = await generateOne(supa, id, overwrite, styleGuide);
      results.push(r);
    }
    return new Response(JSON.stringify({ results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});