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
  error?: string;
}

export interface ResolverInput {
  question: string;
  petId?: string | null;
  cohortId?: string | null;
}

export interface ResolverOutput {
  synthesis: string;
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
    const { data, error } = await supabase.rpc('get_relations_graph_data', { p_limit: 500 });
    if (error) throw error;
    const rows = (data ?? []) as Array<any>;
    const matched = rows.filter((r) => {
      const blob = `${r.source_name} ${r.target_name} ${r.relationship}`.toLowerCase();
      return kws.some((k) => blob.includes(k));
    }).slice(0, 5);
    if (matched.length === 0) {
      return { kind: 'kg', weight: WEIGHTS.kg, claim: null, confidence: 0 };
    }
    const top = matched[0];
    const claim = `${top.source_name} ${top.relationship} ${top.target_name} (n=${top.evidence_count ?? 0}, evidência ${top.evidence_level ?? '?'})`;
    const confidence = Math.min(1, Number(top.confidence ?? 0.7));
    return {
      kind: 'kg',
      weight: WEIGHTS.kg,
      claim,
      confidence,
      evidence: matched.map((m) => ({
        label: `${m.source_name} → ${m.target_name}`,
        ref: m.relationship,
      })),
    };
  } catch (e: any) {
    return { kind: 'kg', weight: WEIGHTS.kg, claim: null, confidence: 0, error: e?.message };
  }
}

async function petHistoryProvider(input: ResolverInput): Promise<SourceResult> {
  if (!input.petId) {
    return { kind: 'petHistory', weight: WEIGHTS.petHistory, claim: null, confidence: 0 };
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
    let query = supabase
      .from('pet_profiles')
      .select('breed, age_years, notes', { count: 'exact' })
      .eq('is_synthetic', true);
    if (input.cohortId) query = query.eq('cohort_id', input.cohortId);
    const { data, count, error } = await query.limit(200);
    if (error) throw error;
    if (!count || count === 0) {
      return { kind: 'cohort', weight: WEIGHTS.cohort, claim: null, confidence: 0 };
    }
    const kws = extractKeywords(input.question);
    const rows = (data ?? []) as Array<any>;
    const matching = rows.filter((p) => {
      const blob = `${p.breed ?? ''} ${p.notes ?? ''}`.toLowerCase();
      return kws.some((k) => blob.includes(k));
    });
    const pct = rows.length > 0 ? Math.round((matching.length / rows.length) * 100) : 0;
    return {
      kind: 'cohort',
      weight: WEIGHTS.cohort,
      claim: `${pct}% dos ${rows.length} pets sintéticos analisados apresentam menção a "${kws.slice(0, 3).join(', ')}".`,
      confidence: pct > 30 ? 0.7 : 0.4,
      evidence: [{ label: `${matching.length}/${rows.length} pets` }],
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

function synthesize(sources: SourceResult[]): string {
  const ranked = sources
    .filter((s) => s.claim && !s.notImplemented)
    .sort((a, b) => b.weight * b.confidence - a.weight * a.confidence);
  if (ranked.length === 0) return 'Nenhuma fonte retornou evidência suficiente para responder.';
  const top = ranked[0];
  return top.claim!;
}

export async function resolveMultiSource(input: ResolverInput): Promise<ResolverOutput> {
  const sources = await Promise.all([
    kgProvider(input),
    petHistoryProvider(input),
    cohortProvider(input),
    treatedDogsProvider(input),
    internetProvider(input),
  ]);
  return {
    synthesis: synthesize(sources),
    sources,
    conflicts: detectConflicts(sources),
  };
}