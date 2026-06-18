/**
 * model-inventory — coleta read-only do mapa modelo × tarefa, resolvido
 * como o runtime resolve (router + overrides inline + embeddings + perplexity).
 *
 * GET  → retorna o inventário atual (não persiste)
 * POST → coleta e persiste em public.ai_model_inventory_snapshots
 */

// deno-lint-ignore-file no-explicit-any
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { loadAliasMap } from "../_shared/model-alias.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

/**
 * Catálogo "ground truth" das tarefas conhecidas + overrides inline detectados
 * por inspeção do código. Mantido em sync com src/config/ai-tasks.ts e com os
 * literais hard-coded das edge functions que NÃO passam pelo router.
 */
const TASK_CATALOG: Array<{
  task_id: string;
  edge_function: string;
  prompt_source: "ai_prompt_versions" | "ai_system_prompts" | "ai_configurations" | "INLINE";
  prompt_key: string | null;
  fallback_model: string;
  governed: boolean;
  provider: string;
  notes?: string;
}> = [
  // Extração (governado pelo router)
  { task_id: "extraction_stage1", edge_function: "extract-study-entities", prompt_source: "ai_prompt_versions", prompt_key: "extraction_stage1", fallback_model: "google/gemini-3-pro-preview", governed: true,  provider: "google" },
  { task_id: "extraction_stage2", edge_function: "extract-study-entities", prompt_source: "ai_prompt_versions", prompt_key: "extraction_stage2", fallback_model: "google/gemini-3-pro-preview", governed: true,  provider: "google" },
  { task_id: "extraction_stage3", edge_function: "extract-study-entities", prompt_source: "ai_prompt_versions", prompt_key: "extraction_stage3", fallback_model: "google/gemini-3-pro-preview", governed: true,  provider: "google" },

  // Triplets
  { task_id: "triplet_extraction",  edge_function: "generate-triplets",            prompt_source: "ai_prompt_versions", prompt_key: "triplet_extraction",  fallback_model: "google/gemini-3.5-flash", governed: true, provider: "google", notes: "fallback inline = gemini-3.5-flash" },
  { task_id: "triplet_enrichment",  edge_function: "enrich-triplet",               prompt_source: "ai_prompt_versions", prompt_key: "triplet_enrichment",  fallback_model: "google/gemini-2.5-pro",   governed: true, provider: "google" },

  // Meta-análise / auditoria
  { task_id: "meta_study_analysis", edge_function: "extract-meta-study",   prompt_source: "INLINE",               prompt_key: null,                  fallback_model: "google/gemini-3-pro-preview", governed: false, provider: "google", notes: "MODEL hard-coded na função" },
  { task_id: "relations_auditor",   edge_function: "relations-auditor",    prompt_source: "ai_prompt_versions",   prompt_key: "relations_auditor",   fallback_model: "openai/gpt-5.4",          governed: true,  provider: "openai" },
  { task_id: "study_tagging",       edge_function: "auto-tag-studies",     prompt_source: "ai_prompt_versions",   prompt_key: "study_tagging",       fallback_model: "google/gemini-2.5-flash", governed: true,  provider: "google" },

  // Inferência clínica
  { task_id: "geroprotector_stack",    edge_function: "hybrid-recommendation",    prompt_source: "ai_prompt_versions", prompt_key: "geroprotector_stack",    fallback_model: "openai/gpt-5.4", governed: true,  provider: "openai" },
  { task_id: "lab_driven_adjustment",  edge_function: "hybrid-recommendation",    prompt_source: "ai_prompt_versions", prompt_key: "lab_driven_adjustment",  fallback_model: "openai/gpt-5.4", governed: true,  provider: "openai" },
  { task_id: "treatment_proposal_12m", edge_function: "hybrid-recommendation",    prompt_source: "ai_prompt_versions", prompt_key: "treatment_proposal_12m", fallback_model: "openai/gpt-5.4", governed: true,  provider: "openai" },
  { task_id: "trajectory_projection",  edge_function: "project-pet-trajectory",   prompt_source: "ai_prompt_versions", prompt_key: "trajectory_projection",  fallback_model: "openai/gpt-5.4", governed: true,  provider: "openai" },
  { task_id: "clinical_data_extraction", edge_function: "extract-pet-clinical-data", prompt_source: "ai_prompt_versions", prompt_key: "clinical_data_extraction", fallback_model: "google/gemini-2.5-pro", governed: true, provider: "google" },
  { task_id: "lab_pdf_parsing",        edge_function: "parse-pet-exam-pdf",       prompt_source: "ai_prompt_versions", prompt_key: "lab_pdf_parsing",        fallback_model: "google/gemini-2.5-pro", governed: true, provider: "google" },
  { task_id: "kg_gap_fill",            edge_function: "kg-evidence-gap-fill",     prompt_source: "INLINE",             prompt_key: null,                     fallback_model: "google/gemini-3-flash-preview", governed: false, provider: "google", notes: "modelo inline = gemini-3-flash-preview" },

  // Chat clínico
  { task_id: "clinical_chat_factual",  edge_function: "chat",                     prompt_source: "ai_prompt_versions", prompt_key: "clinical_chat_factual",  fallback_model: "google/gemini-2.5-pro", governed: true, provider: "google" },
  { task_id: "clinical_chat_critical", edge_function: "chat",                     prompt_source: "ai_prompt_versions", prompt_key: "clinical_chat_critical", fallback_model: "openai/gpt-5.4",        governed: true, provider: "openai" },

  // Tradução
  { task_id: "translation_generic",    edge_function: "translate-text",           prompt_source: "ai_prompt_versions", prompt_key: "translation_generic",    fallback_model: "google/gemini-2.5-flash", governed: true, provider: "google" },
  { task_id: "translation_conditions", edge_function: "translate-conditions",     prompt_source: "ai_prompt_versions", prompt_key: "translation_conditions", fallback_model: "google/gemini-2.5-pro",   governed: true, provider: "google" },

  // Enriquecimento / taxonomia
  { task_id: "taxonomy_suggestion",    edge_function: "suggest-taxonomy-terms",   prompt_source: "ai_prompt_versions", prompt_key: "taxonomy_suggestion",    fallback_model: "google/gemini-2.5-pro", governed: true, provider: "google" },
  { task_id: "dosage_web_lookup",      edge_function: "web-dosage-lookup",        prompt_source: "INLINE",             prompt_key: null,                     fallback_model: "google/gemini-2.5-pro", governed: false, provider: "google", notes: "modelo inline = gemini-2.5-pro" },
  { task_id: "food_enrichment",        edge_function: "enrich-pet-food-product",  prompt_source: "ai_prompt_versions", prompt_key: "food_enrichment",        fallback_model: "google/gemini-2.5-pro", governed: true, provider: "google" },
  { task_id: "spreadsheet_enrichment", edge_function: "process-nutraceutical-spreadsheet", prompt_source: "ai_prompt_versions", prompt_key: "spreadsheet_enrichment", fallback_model: "google/gemini-2.5-pro", governed: true, provider: "google" },

  // Não-prompt
  { task_id: "__embeddings__",         edge_function: "vectorize-study",          prompt_source: "INLINE",             prompt_key: null,                     fallback_model: "google/gemini-embedding-001", governed: false, provider: "google", notes: "modelo de embeddings; dimensão registrada em study_embeddings" },
  { task_id: "__perplexity_search__",  edge_function: "perplexity-health, web-dosage-lookup, kg-evidence-gap-fill", prompt_source: "INLINE", prompt_key: null, fallback_model: "perplexity/sonar", governed: false, provider: "perplexity", notes: "modelo controlado pelo endpoint Perplexity" },
];

async function resolveActiveModel(taskId: string, fallback: string): Promise<{ model: string; source: "db_override" | "db_prompt" | "fallback"; prompt_version_id: string | null }> {
  // 1) ai_configurations override
  try {
    const { data: cfg } = await admin
      .from("ai_configurations")
      .select("config_value")
      .eq("config_key", `ai_model_${taskId}`)
      .maybeSingle();
    if (cfg?.config_value) {
      const m = typeof cfg.config_value === "string"
        ? (cfg.config_value as string).replace(/^"|"$/g, "")
        : String(cfg.config_value);
      return { model: m, source: "db_override", prompt_version_id: null };
    }
  } catch (_) { /* ok */ }

  // 2) prompt ativo
  try {
    const { data: versions } = await admin
      .from("ai_prompt_versions")
      .select("id, model_id")
      .eq("task_id", taskId)
      .eq("is_active", true);
    if (versions && versions.length > 0) {
      const chosen = versions.find((v: any) => v.model_id) ?? versions[0];
      return { model: chosen.model_id ?? fallback, source: "db_prompt", prompt_version_id: chosen.id };
    }
  } catch (_) { /* ok */ }

  return { model: fallback, source: "fallback", prompt_version_id: null };
}

async function buildInventory(): Promise<any> {
  const aliases = await loadAliasMap();
  const items: any[] = [];

  for (const t of TASK_CATALOG) {
    let resolved: { model: string; source: "db_override" | "db_prompt" | "fallback"; prompt_version_id: string | null };
    if (t.prompt_source === "INLINE") {
      resolved = { model: t.fallback_model, source: "fallback", prompt_version_id: null };
    } else {
      resolved = await resolveActiveModel(t.task_id, t.fallback_model);
    }
    const alias = aliases.get(t.task_id);
    items.push({
      task_id: t.task_id,
      edge_function: t.edge_function,
      prompt_source: t.prompt_source,
      prompt_key: t.prompt_key,
      prompt_version_id: resolved.prompt_version_id,
      real_model: resolved.model,
      resolution_source: resolved.source,
      provider: t.provider,
      governed: t.governed,
      alias_label_pt: alias?.alias_label_pt ?? "Modelo não-rotulado",
      alias_label_en: alias?.alias_label_en ?? "Unlabeled Model",
      has_alias: !!alias,
      alias_matches_real: alias ? alias.real_model === resolved.model : false,
      notes: t.notes ?? null,
    });
  }

  // Sample embedding dimension
  let embeddingDimension: number | null = null;
  try {
    const { data: sample } = await admin
      .from("study_embeddings")
      .select("embedding_model_version")
      .limit(1)
      .maybeSingle();
    if (sample) {
      // dim não disponível diretamente; só registrar modelo da amostra
      embeddingDimension = 768; // gemini-embedding-001 default; placeholder.
    }
  } catch (_) {}

  return {
    captured_at: new Date().toISOString(),
    items,
    embedding_dimension: embeddingDimension,
    totals: {
      tasks: items.length,
      governed: items.filter((i) => i.governed).length,
      inline: items.filter((i) => !i.governed).length,
      with_alias: items.filter((i) => i.has_alias).length,
      alias_drift: items.filter((i) => i.has_alias && !i.alias_matches_real).length,
    },
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const inventory = await buildInventory();

    if (req.method === "POST") {
      // Persistir snapshot
      const auth = req.headers.get("authorization") ?? "";
      let createdBy: string | null = null;
      try {
        const userClient = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY") ?? "", {
          global: { headers: { Authorization: auth } },
        });
        const { data: u } = await userClient.auth.getUser();
        createdBy = u?.user?.id ?? null;
      } catch (_) {}

      await admin.from("ai_model_inventory_snapshots").insert({
        source: "manual",
        snapshot: inventory,
        created_by: createdBy,
      });
    }

    return new Response(JSON.stringify(inventory), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String((e as Error).message ?? e) }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});