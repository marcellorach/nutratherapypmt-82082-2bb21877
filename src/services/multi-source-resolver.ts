/**
 * MultiSourceResolver — consulta clínica multi-fonte com hierarquia de pesos.
 *
 * Hierarquia (peso fixo):
 *   KG curado            1.00 → verdade científica
 *   Histórico do cão     0.95 → personalização
 *   Cohort sintético     0.70 → sinal populacional
 *   Cães tratados        0.60 → stub (futuro)
 *   Internet (Perplexity) 0.30 → controle / gaps
 *
 * Conflito = ≥ 2 fontes com peso ≥ 0.6 e claims divergentes.
 */
import { supabase } from '@/integrations/supabase/client';

export type SourceKind = 'kg' | 'petHistory' | 'cohort' | 'internet' | 'treatedDogs';

export interface SourceResult {
  kind: SourceKind;
  weight: number;
  claim: string | null;
  confidence: number; // 0..1
  evidence?: Array<{ label: string; ref?: string }>;
  notImplemented?: boolean;
  notApplicable?: boolean;
  meta?: Record<string, unknown>;
  error?: string;
}

export interface ResolverInput {
  question: string;
  petId?: string | null;
  cohortId?: string | null;
}

export interface ResolverOutput {
  synthesis: string;
  synthesisSource: SourceKind | null;
  synthesisDegraded: boolean;
  sources: SourceResult[];
  conflicts: Array<{ a: SourceKind; b: SourceKind; reason: string }>;
}

const WEIGHTS: Record<SourceKind, number> = {
  kg: 1.0,
  petHistory: 0.95,
  cohort: 0.7,
  treatedDogs: 0.6,
  internet: 0.3,
};

// crude keyword extraction for KG / cohort search
const stopwords = new Set([
  'a','o','os','as','de','do','da','dos','das','para','com','sem','em','no','na','que','é','e','ou','um','uma',
  'the','of','for','with','without','in','on','at','is','and','or','a','an','to','can','does','do','if',
]);
const extractKeywords = (q: string): string[] =>
  q
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, ' ')
    .split(/\s+/)
    .filter((w) => w.length >= 4 && !stopwords.has(w))
    .slice(0, 6);

async function kgProvider(input: ResolverInput): Promise<SourceResult> {
  try {
    const kws = extractKeywords(input.question);
    if (kws.length === 0) {
      return { kind: 'kg', weight: WEIGHTS.kg, claim: null, confidence: 0 };
    }
    const { data, error } = await supabase.rpc('search_relations_by_term', {
      p_terms: kws,
      p_limit: 25,
    });
    if (error) throw error;
    const rows = (data ?? []) as Array<any>;
    if (rows.length === 0) {
      return { kind: 'kg', weight: WEIGHTS.kg, claim: null, confidence: 0 };
    }
    const top = rows[0];
    const conf = Math.min(1, Number(top.llm_confidence ?? top.extraction_confidence ?? 0.7));
    const claim = `${top.subject_name} ${top.predicate} ${top.object_name}` +
      (top.evidence_level ? ` (evidência ${top.evidence_level})` : '') +
      ` — ${rows.length} relação(ões) aprovadas no KG.`;
    return {
      kind: 'kg',
      weight: WEIGHTS.kg,
      claim,
      confidence: conf,
      evidence: rows.slice(0, 5).map((r) => ({
        label: `${r.subject_name} ${r.predicate} ${r.object_name}`,
        ref: r.study_id ? `/administrador?tab=knowledge-graph&study=${r.study_id}` : undefined,
      })),
      meta: { triplets: rows },
    };
  } catch (e: any) {
    return { kind: 'kg', weight: WEIGHTS.kg, claim: null, confidence: 0, error: e?.message };
  }
}

async function petHistoryProvider(input: ResolverInput): Promise<SourceResult> {
  if (!input.petId) {
    return {
      kind: 'petHistory',
      weight: WEIGHTS.petHistory,
      claim: null,
      confidence: 0,
      notApplicable: true,
    };
  }
  try {
    const { data: pet } = await supabase
      .from('pet_profiles')
      .select('name, breed, age_years, notes')
      .eq('id', input.petId)
      .maybeSingle();
    if (!pet) return { kind: 'petHistory', weight: WEIGHTS.petHistory, claim: null, confidence: 0 };
    const kws = extractKeywords(input.question);
    const blob = JSON.stringify(pet).toLowerCase();
    const hits = kws.filter((k) => blob.includes(k));
    if (hits.length === 0) {
      return {
        kind: 'petHistory',
        weight: WEIGHTS.petHistory,
        claim: `Nenhuma menção direta a "${kws.join(', ')}" no histórico de ${pet.name ?? 'pet'}.`,
        confidence: 0.4,
      };
    }
    return {
      kind: 'petHistory',
      weight: WEIGHTS.petHistory,
      claim: `Histórico de ${pet.name ?? 'pet'} (${pet.breed ?? '?'}, ${pet.age_years ?? '?'}a) menciona: ${hits.join(', ')}.`,
      confidence: 0.75,
      evidence: hits.map((h) => ({ label: h })),
    };
  } catch (e: any) {
    return { kind: 'petHistory', weight: WEIGHTS.petHistory, claim: null, confidence: 0, error: e?.message };
  }
}

async function cohortProvider(input: ResolverInput): Promise<SourceResult> {
  try {
    // Detect a canonical clinical entity (breed and/or condition) from the question
    // using values that actually exist in pet_profiles / pet_conditions — not raw keywords.
    const qLower = input.question.toLowerCase();

    // Pull distinct breeds and condition names (small lists) to match against the question
    const [{ data: breedsRows }, { data: condsRows }] = await Promise.all([
      supabase.from('pet_profiles').select('breed').eq('is_synthetic', true).not('breed', 'is', null).limit(2000),
      supabase.from('pet_conditions').select('condition_name').not('condition_name', 'is', null).limit(2000),
    ]);
    const breedSet = new Set<string>(
      (breedsRows ?? []).map((r: any) => String(r.breed).toLowerCase()).filter(Boolean),
    );
    const condSet = new Set<string>(
      (condsRows ?? []).map((r: any) => String(r.condition_name).toLowerCase()).filter(Boolean),
    );
    const matchedBreed = [...breedSet].find((b) => b.length >= 3 && qLower.includes(b)) ?? null;
    const matchedCond = [...condSet].find((c) => c.length >= 3 && qLower.includes(c)) ?? null;

    if (!matchedBreed && !matchedCond) {
      return {
        kind: 'cohort',
        weight: WEIGHTS.cohort,
        claim: 'Sem entidade clínica reconhecida na pergunta (raça/condição) — sinal populacional indisponível.',
        confidence: 0,
      };
    }

    // Base pool of synthetic pets, optionally filtered by breed and cohort
    let petsQ = supabase.from('pet_profiles').select('id, breed').eq('is_synthetic', true);
    if (input.cohortId) petsQ = petsQ.eq('cohort_id', input.cohortId);
    if (matchedBreed) petsQ = petsQ.ilike('breed', `%${matchedBreed}%`);
    const { data: pets, error: petsErr } = await petsQ.limit(500);
    if (petsErr) throw petsErr;
    const total = pets?.length ?? 0;
    if (total === 0) {
      return {
        kind: 'cohort',
        weight: WEIGHTS.cohort,
        claim: matchedBreed
          ? `Nenhum pet sintético da raça "${matchedBreed}" no cohort selecionado.`
          : 'Nenhum pet sintético compatível.',
        confidence: 0,
      };
    }
    const petIds = pets!.map((p: any) => p.id);

    let withCondition = 0;
    if (matchedCond) {
      const { count, error: ccErr } = await supabase
        .from('pet_conditions')
        .select('pet_id', { count: 'exact', head: true })
        .in('pet_id', petIds)
        .ilike('condition_name', `%${matchedCond}%`);
      if (ccErr) throw ccErr;
      withCondition = count ?? 0;
    }

    const pct = matchedCond ? Math.round((withCondition / total) * 100) : null;
    const parts: string[] = [];
    parts.push(`${total} pets sintéticos`);
    if (matchedBreed) parts.push(`raça "${matchedBreed}"`);
    if (matchedCond) parts.push(`${withCondition} (${pct}%) com "${matchedCond}"`);
    return {
      kind: 'cohort',
      weight: WEIGHTS.cohort,
      claim: parts.join(' · '),
      confidence: matchedCond ? (pct! >= 30 ? 0.7 : 0.45) : 0.4,
      evidence: [
        { label: `n=${total}` },
        ...(matchedCond ? [{ label: `com condição: ${withCondition}` }] : []),
      ],
      meta: { matchedBreed, matchedCond, total, withCondition },
    };
  } catch (e: any) {
    return { kind: 'cohort', weight: WEIGHTS.cohort, claim: null, confidence: 0, error: e?.message };
  }
}

async function internetProvider(input: ResolverInput): Promise<SourceResult> {
  try {
    const { data, error } = await supabase.functions.invoke('query-perplexity', {
      body: { question: input.question },
    });
    if (error) throw error;
    if (data?.error) throw new Error(data.error);
    if (data?.outOfScope) {
      return {
        kind: 'internet',
        weight: WEIGHTS.internet,
        claim: 'Fora de escopo canino.',
        confidence: 0,
      };
    }
    return {
      kind: 'internet',
      weight: WEIGHTS.internet,
      claim: data?.answer ?? null,
      confidence: Number(data?.confidence ?? 0.5),
      evidence: (data?.citations ?? []).slice(0, 5).map((c: string) => ({ label: c, ref: c })),
    };
  } catch (e: any) {
    return { kind: 'internet', weight: WEIGHTS.internet, claim: null, confidence: 0, error: e?.message };
  }
}

async function treatedDogsProvider(_input: ResolverInput): Promise<SourceResult> {
  return {
    kind: 'treatedDogs',
    weight: WEIGHTS.treatedDogs,
    claim: null,
    confidence: 0,
    notImplemented: true,
  };
}

function detectConflicts(sources: SourceResult[]): ResolverOutput['conflicts'] {
  const candidates = sources.filter((s) => s.weight >= 0.6 && s.claim);
  const out: ResolverOutput['conflicts'] = [];
  for (let i = 0; i < candidates.length; i++) {
    for (let j = i + 1; j < candidates.length; j++) {
      const a = candidates[i];
      const b = candidates[j];
      const aHas = /\b(seguro|safe|recomendad|recommended|beneficial|benéfic)/i.test(a.claim!);
      const aDeny = /\b(contraindicad|contraindicated|risk|risco|tóxic|toxic|evitar|avoid)/i.test(a.claim!);
      const bHas = /\b(seguro|safe|recomendad|recommended|beneficial|benéfic)/i.test(b.claim!);
      const bDeny = /\b(contraindicad|contraindicated|risk|risco|tóxic|toxic|evitar|avoid)/i.test(b.claim!);
      if ((aHas && bDeny) || (aDeny && bHas)) {
        out.push({ a: a.kind, b: b.kind, reason: 'Afirmações com polaridade divergente.' });
      }
    }
  }
  return out;
}

function synthesize(sources: SourceResult[]): { text: string; source: SourceKind | null; degraded: boolean } {
  const usable = sources.filter(
    (s) => s.claim && !s.notImplemented && !s.notApplicable && s.confidence > 0,
  );
  if (usable.length === 0) {
    return { text: 'Nenhuma fonte retornou evidência suficiente para responder.', source: null, degraded: false };
  }
  const ranked = [...usable].sort((a, b) => b.weight * b.confidence - a.weight * a.confidence);
  const top = ranked[0];
  const topWeight = top.weight;
  // Degraded when the chosen source has weight below the curated KG tier (1.0)
  const degraded = topWeight < 1.0;
  return { text: top.claim!, source: top.kind, degraded };
}

export async function resolveMultiSource(input: ResolverInput): Promise<ResolverOutput> {
  const sources = await Promise.all([
    kgProvider(input),
    petHistoryProvider(input),
    cohortProvider(input),
    treatedDogsProvider(input),
    internetProvider(input),
  ]);
  const s = synthesize(sources);
  return {
    synthesis: s.text,
    synthesisSource: s.source,
    synthesisDegraded: s.degraded,
    sources,
    conflicts: detectConflicts(sources),
  };
}