import { supabase } from "@/integrations/supabase/client";

export type DosageSourceType =
  | "kg_triplet"
  | "curated_study"
  | "web_authoritative"
  | "llm_estimate"
  | "default_class";

export interface ResolvedDosage {
  minPerKg: number;
  maxPerKg: number;
  recommendedPerKg: number;
  unit: string;
  frequencyPerDay?: number | null;
  source: DosageSourceType;
  sourceUrl?: string | null;
  sourceCitation?: string | null;
  confidence: number;
  needsReview: boolean;
  notes?: string | null;
  weightAdjusted: boolean;
  totalDailyMg?: number;
  referenceId?: string | null;
  adjustments: string[]; // human-readable notes (interaction, age, lab)
}

export interface ResolveContext {
  compoundName: string;
  conditionName?: string | null;
  species?: string;
  petWeightKg?: number | null;
  petAgeYears?: number | null;
  petId?: string | null;
  stackCompounds?: string[]; // other compounds in same recommendation
  petMedications?: string[];
  kgInteractions?: Array<{
    a: string;
    b: string;
    type: "CONTRAINDICATES" | "INTERACTS" | "AGGRAVATES";
  }>;
  hepaticOrRenalRisk?: boolean;
  // Raw KG data attached by pipeline (already retrieved)
  kgDosageString?: string | null;
}

function parseDosageString(raw: string | null | undefined): {
  min: number;
  max: number;
  unit: string;
} | null {
  if (!raw) return null;
  const m = raw.match(/(\d+(?:\.\d+)?)\s*[-–]\s*(\d+(?:\.\d+)?)\s*(mg\/kg|mg|g|IU)/i);
  if (m) {
    return {
      min: parseFloat(m[1]),
      max: parseFloat(m[2]),
      unit: m[3],
    };
  }
  // Single value
  const single = raw.match(/(\d+(?:\.\d+)?)\s*(mg\/kg|mg|g|IU)/i);
  if (single) {
    const v = parseFloat(single[1]);
    return { min: v * 0.7, max: v * 1.3, unit: single[2] };
  }
  return null;
}

async function lookupCuratedReference(
  compound: string,
  condition: string | null,
  species: string,
) {
  // Tier A: exact compound + condition
  if (condition) {
    const { data: exact } = await supabase
      .from("compound_dosage_reference")
      .select("*")
      .ilike("compound_name_en", compound)
      .ilike("condition_name_en", condition)
      .eq("species", species)
      .maybeSingle();
    if (exact) return { row: exact, tier: "exact" as const };
  }
  // Tier B: compound only
  const { data: generic } = await supabase
    .from("compound_dosage_reference")
    .select("*")
    .ilike("compound_name_en", compound)
    .is("condition_name_en", null)
    .eq("species", species)
    .maybeSingle();
  if (generic) return { row: generic, tier: "generic" as const };

  // Tier C: any condition for this compound
  const { data: any } = await supabase
    .from("compound_dosage_reference")
    .select("*")
    .ilike("compound_name_en", compound)
    .eq("species", species)
    .order("confidence", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (any) return { row: any, tier: "any" as const };

  return null;
}

async function callWebLookup(
  compound: string,
  condition: string | null,
  species: string,
) {
  try {
    const { data, error } = await supabase.functions.invoke(
      "web-dosage-lookup",
      { body: { compound, condition, species } },
    );
    if (error) {
      console.warn("web-dosage-lookup invoke error", error);
      return null;
    }
    return data?.reference ?? null;
  } catch (e) {
    console.warn("web-dosage-lookup failed", e);
    return null;
  }
}

function applyAdjustments(
  dose: ResolvedDosage,
  ctx: ResolveContext,
): ResolvedDosage {
  const notes: string[] = [...dose.adjustments];
  let recommended = dose.recommendedPerKg;

  // Interaction inside the stack
  const compoundLower = ctx.compoundName.toLowerCase();
  const interaction = (ctx.kgInteractions || []).find(
    (i) =>
      [i.a.toLowerCase(), i.b.toLowerCase()].includes(compoundLower) &&
      (ctx.stackCompounds || []).some((s) =>
        [i.a.toLowerCase(), i.b.toLowerCase()].includes(s.toLowerCase()),
      ),
  );
  if (interaction) {
    recommended *= 0.75;
    notes.push(
      `Dose reduzida 25% por interação (${interaction.type.toLowerCase()}) com outro item do stack.`,
    );
  }

  // Concurrent medication interaction
  const medInteraction = (ctx.kgInteractions || []).find(
    (i) =>
      [i.a.toLowerCase(), i.b.toLowerCase()].includes(compoundLower) &&
      (ctx.petMedications || []).some((m) =>
        [i.a.toLowerCase(), i.b.toLowerCase()].includes(m.toLowerCase()),
      ),
  );
  if (medInteraction) {
    recommended *= 0.75;
    notes.push(
      `Dose reduzida 25% por interação com medicação atual do paciente.`,
    );
  }

  // Geriatric
  if ((ctx.petAgeYears ?? 0) >= 10) {
    const lowerThird = dose.minPerKg + (dose.maxPerKg - dose.minPerKg) / 3;
    if (recommended > lowerThird) {
      recommended = lowerThird;
      notes.push("Dose iniciada no terço inferior por idade geriátrica (≥10 anos).");
    }
  }

  // Hepatic / renal
  if (ctx.hepaticOrRenalRisk) {
    const lowerThird = dose.minPerKg + (dose.maxPerKg - dose.minPerKg) / 3;
    if (recommended > lowerThird) {
      recommended = lowerThird;
      notes.push("Dose limitada ao terço inferior por alteração hepática/renal nos exames.");
    }
  }

  recommended = Math.max(dose.minPerKg, Math.min(dose.maxPerKg, recommended));

  const weight = ctx.petWeightKg ?? null;
  const totalDaily = weight ? Math.round(recommended * weight * 10) / 10 : undefined;

  return {
    ...dose,
    recommendedPerKg: Math.round(recommended * 100) / 100,
    totalDailyMg: totalDaily,
    weightAdjusted: !!weight,
    adjustments: notes,
  };
}

async function logLookup(
  ctx: ResolveContext,
  result: ResolvedDosage,
  fallbackReason?: string,
) {
  try {
    await supabase.from("dosage_lookup_log").insert({
      compound_name: ctx.compoundName,
      condition_name: ctx.conditionName ?? null,
      species: ctx.species ?? "canine",
      pet_weight_kg: ctx.petWeightKg ?? null,
      pet_id: ctx.petId ?? null,
      resolved_source: result.source,
      resolved_min_per_kg: result.minPerKg,
      resolved_max_per_kg: result.maxPerKg,
      resolved_recommended_mg_total: result.totalDailyMg ?? null,
      reference_id: result.referenceId ?? null,
      fallback_reason: fallbackReason ?? null,
    });
  } catch (e) {
    console.warn("dosage_lookup_log insert failed", e);
  }
}

/**
 * Resolve a compound dose using a 5-tier waterfall:
 *   1. Parsed dose string from KG triplet/node
 *   2. Curated reference table (compound × condition × species)
 *   3. Curated reference table fallback (compound × species, any condition)
 *   4. web-dosage-lookup edge function (authoritative web sources)
 *   5. Class-default range (transparent estimate)
 */
export async function resolveCompoundDosage(
  ctx: ResolveContext,
): Promise<ResolvedDosage> {
  const species = ctx.species ?? "canine";

  // Tier 1: KG dosage string
  const kgParsed = parseDosageString(ctx.kgDosageString);
  if (kgParsed && kgParsed.unit.toLowerCase().includes("mg/kg")) {
    const base: ResolvedDosage = {
      minPerKg: kgParsed.min,
      maxPerKg: kgParsed.max,
      recommendedPerKg: (kgParsed.min + kgParsed.max) / 2,
      unit: kgParsed.unit,
      source: "kg_triplet",
      confidence: 0.85,
      needsReview: false,
      weightAdjusted: false,
      adjustments: [],
    };
    const adjusted = applyAdjustments(base, ctx);
    await logLookup(ctx, adjusted);
    return adjusted;
  }

  // Tier 2/3: curated reference
  const curated = await lookupCuratedReference(
    ctx.compoundName,
    ctx.conditionName ?? null,
    species,
  );
  if (curated && curated.row.min_mg_per_kg != null && curated.row.max_mg_per_kg != null) {
    const r = curated.row;
    const sourceType: DosageSourceType =
      r.source_type === "curated_study"
        ? "curated_study"
        : r.source_type === "web_authoritative"
        ? "web_authoritative"
        : r.source_type === "llm_estimate"
        ? "llm_estimate"
        : "curated_study";
    const base: ResolvedDosage = {
      minPerKg: Number(r.min_mg_per_kg),
      maxPerKg: Number(r.max_mg_per_kg),
      recommendedPerKg: (Number(r.min_mg_per_kg) + Number(r.max_mg_per_kg)) / 2,
      unit: r.unit ?? "mg/kg",
      frequencyPerDay: r.frequency_per_day,
      source: sourceType,
      sourceUrl: r.source_url,
      sourceCitation: r.source_citation,
      confidence: Number(r.confidence ?? 0.5),
      needsReview: !!r.needs_review,
      notes: r.notes,
      referenceId: r.id,
      weightAdjusted: false,
      adjustments:
        curated.tier === "exact"
          ? []
          : curated.tier === "generic"
          ? ["Dose geral do composto (não específica a esta condição)."]
          : ["Dose para este composto em outra condição (aproximação)."],
    };
    const adjusted = applyAdjustments(base, ctx);
    await logLookup(ctx, adjusted);
    return adjusted;
  }

  // Tier 4: web lookup (also persists into compound_dosage_reference)
  const webRef = await callWebLookup(
    ctx.compoundName,
    ctx.conditionName ?? null,
    species,
  );
  if (webRef && webRef.min_mg_per_kg != null && webRef.max_mg_per_kg != null) {
    const base: ResolvedDosage = {
      minPerKg: Number(webRef.min_mg_per_kg),
      maxPerKg: Number(webRef.max_mg_per_kg),
      recommendedPerKg:
        (Number(webRef.min_mg_per_kg) + Number(webRef.max_mg_per_kg)) / 2,
      unit: webRef.unit ?? "mg/kg",
      frequencyPerDay: webRef.frequency_per_day,
      source: webRef.source_type === "llm_estimate"
        ? "llm_estimate"
        : "web_authoritative",
      sourceUrl: webRef.source_url,
      sourceCitation: webRef.source_citation,
      confidence: Number(webRef.confidence ?? 0.4),
      needsReview: true,
      notes: webRef.notes,
      referenceId: webRef.id ?? null,
      weightAdjusted: false,
      adjustments: ["Dose obtida de fonte veterinária autoritativa — pendente de curadoria interna."],
    };
    const adjusted = applyAdjustments(base, ctx);
    await logLookup(ctx, adjusted, "web_lookup");
    return adjusted;
  }

  // Tier 5: transparent estimate
  const fallback: ResolvedDosage = {
    minPerKg: 5,
    maxPerKg: 50,
    recommendedPerKg: 10,
    unit: "mg/kg",
    source: "default_class",
    confidence: 0.2,
    needsReview: true,
    weightAdjusted: false,
    adjustments: [
      "Estimativa genérica — sem fonte dedicada para este composto. Confirmar com bibliografia veterinária.",
    ],
  };
  const adjusted = applyAdjustments(fallback, ctx);
  await logLookup(ctx, adjusted, "no_source_found");
  return adjusted;
}