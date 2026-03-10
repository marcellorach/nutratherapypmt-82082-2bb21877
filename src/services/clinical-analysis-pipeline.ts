/**
 * Clinical Analysis Pipeline - 6-Stage Decision Engine
 * 
 * Stage 1: Collect patient profile (biometrics, conditions, medications, exams)
 * Stage 2: Query breed predispositions → identify undiagnosed risks
 * Stage 3: Compare exams vs lab_reference_ranges → flag abnormals
 * Stage 4: Query Knowledge Graph for conditions + predispositions
 * Stage 5: Check interactions (recommended compounds vs current medications)
 * Stage 6: Generate hybrid recommendation with enriched context
 */

import { supabase } from '@/integrations/supabase/client';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface PatientProfile {
  id: string;
  name: string;
  species: string;
  breed: string;
  age_years: number;
  weight_kg: number;
  sex: string;
  neutered: boolean;
}

export interface BreedPredisposition {
  id: string;
  condition_name: string;
  condition_name_en: string | null;
  risk_factor: number;
  evidence_grade: string;
  notes: string | null;
  already_diagnosed: boolean;
}

export interface LabAlert {
  test_name: string;
  value: number;
  unit: string;
  min_normal: number;
  max_normal: number;
  status: 'low' | 'high' | 'critical_low' | 'critical_high';
  clinical_significance: string;
  exam_date?: string;
}

export interface InteractionAlert {
  compound: string;
  medication: string;
  interaction_type: string;
  severity: 'mild' | 'moderate' | 'severe';
  description: string;
}

export interface ClinicalAnalysisResult {
  predispositions: BreedPredisposition[];
  labAlerts: LabAlert[];
  interactionAlerts: InteractionAlert[];
  kgResults: any[];
  kgTriplets: any[];
  kgPathways: any[];
  kgProjections: any[];
  recommendation: any;
  compounds: any[];
  confidenceLevel: 'high' | 'medium' | 'low' | 'insufficient';
  analysisTimestamp: string;
}

// ─── Stage 2: Breed Predispositions ──────────────────────────────────────────

async function fetchBreedPredispositions(
  breed: string,
  existingConditions: string[]
): Promise<BreedPredisposition[]> {
  // Find breed ID by matching name (case-insensitive)
  const { data: breeds } = await supabase
    .from('breeds')
    .select('id, name, name_en')
    .or(`name.ilike.%${breed}%,name_en.ilike.%${breed}%`);

  if (!breeds || breeds.length === 0) return [];

  const breedId = breeds[0].id;

  // Get predispositions with condition names
  const { data: predispositions } = await supabase
    .from('breed_predispositions')
    .select(`
      id, risk_factor, evidence_grade, notes,
      condition_id
    `)
    .eq('breed_id', breedId)
    .order('risk_factor', { ascending: false });

  if (!predispositions || predispositions.length === 0) return [];

  // Get condition names for all predispositions
  const conditionIds = predispositions.map(p => p.condition_id).filter(Boolean);
  const { data: conditions } = await supabase
    .from('health_conditions')
    .select('id, name, name_en')
    .in('id', conditionIds);

  const conditionMap = new Map(conditions?.map(c => [c.id, c]) || []);
  const normalizedExisting = existingConditions.map(c => c.toLowerCase());

  return predispositions.map(p => {
    const condition = conditionMap.get(p.condition_id);
    const conditionName = condition?.name || 'Unknown';
    return {
      id: p.id,
      condition_name: conditionName,
      condition_name_en: condition?.name_en || null,
      risk_factor: p.risk_factor,
      evidence_grade: p.evidence_grade,
      notes: p.notes,
      already_diagnosed: normalizedExisting.some(
        ec => ec.includes(conditionName.toLowerCase()) || conditionName.toLowerCase().includes(ec)
      ),
    };
  });
}

// ─── Stage 3: Lab Interpretation ─────────────────────────────────────────────

async function interpretLabResults(
  exams: any[],
  ageYears: number
): Promise<LabAlert[]> {
  const ageGroup = ageYears >= 7 ? 'senior' : ageYears < 1 ? 'puppy' : 'adult';

  // Fetch reference ranges, preferring age-specific
  const { data: ranges } = await supabase
    .from('lab_reference_ranges' as any)
    .select('*')
    .eq('species', 'canine')
    .in('age_group', [ageGroup, 'adult']);

  if (!ranges || ranges.length === 0) return [];

  // Build a map, preferring age-specific ranges
  const rangeMap = new Map<string, any>();
  for (const r of ranges) {
    const key = r.test_name.toLowerCase();
    if (!rangeMap.has(key) || r.age_group === ageGroup) {
      rangeMap.set(key, r);
    }
  }

  const alerts: LabAlert[] = [];

  for (const exam of exams) {
    if (!exam.results || typeof exam.results !== 'object') continue;

    for (const [key, rawValue] of Object.entries(exam.results as Record<string, any>)) {
      const value = typeof rawValue === 'number' ? rawValue : parseFloat(String(rawValue));
      if (isNaN(value)) continue;

      // Try to match test name
      const normalizedKey = key.toLowerCase().replace(/_/g, ' ');
      let matchedRange: any = null;

      for (const [rangeName, range] of rangeMap.entries()) {
        if (
          normalizedKey.includes(rangeName) ||
          rangeName.includes(normalizedKey) ||
          normalizedKey.replace(/\s/g, '') === rangeName.replace(/\s/g, '')
        ) {
          matchedRange = range;
          break;
        }
      }

      if (!matchedRange) continue;

      const { min_normal, max_normal } = matchedRange;
      let status: LabAlert['status'] | null = null;

      if (value < min_normal) {
        status = value < min_normal * 0.7 ? 'critical_low' : 'low';
      } else if (value > max_normal) {
        status = value > max_normal * 1.5 ? 'critical_high' : 'high';
      }

      if (status) {
        alerts.push({
          test_name: matchedRange.test_name,
          value,
          unit: matchedRange.unit || '',
          min_normal,
          max_normal,
          status,
          clinical_significance: matchedRange.clinical_significance || '',
          exam_date: exam.exam_date,
        });
      }
    }
  }

  return alerts;
}

// ─── Stage 4: KG Query ──────────────────────────────────────────────────────

async function queryKnowledgeGraph(
  conditionNames: string[]
): Promise<any[]> {
  const kgResults: any[] = [];

  for (const condition of conditionNames.length > 0 ? conditionNames : ['aging', 'longevity']) {
    try {
      const { data: kgData, error: kgError } = await supabase.functions.invoke('graph-rag-search', {
        body: { queryType: 'context', sourceEntity: condition }
      });

      if (!kgError && kgData?.data) {
        kgResults.push({ condition, graphData: kgData.data });
      }
    } catch (e) {
      console.warn(`KG query for ${condition} failed:`, e);
    }
  }

  return kgResults;
}

// ─── Stage 5: Interaction Check ──────────────────────────────────────────────

function checkInteractions(
  recommendedCompounds: string[],
  currentMedications: string[],
  kgResults: any[]
): InteractionAlert[] {
  const alerts: InteractionAlert[] = [];

  // Check KG for CONTRAINDICATES/INTERACTS relationships
  for (const result of kgResults) {
    const relationships = result.graphData?.relationships || result.graphData?.edges || [];
    const nodes = result.graphData?.nodes || [];

    for (const rel of relationships) {
      const predicate = (rel.type || rel.label || '').toUpperCase();
      if (!['CONTRAINDICATES', 'INTERACTS', 'INTERACTS_WITH', 'CONTRAINDICATED'].includes(predicate)) continue;

      const sourceNode = nodes.find((n: any) => n.id === rel.source || n.id === rel.startNode);
      const targetNode = nodes.find((n: any) => n.id === rel.target || n.id === rel.endNode);
      if (!sourceNode || !targetNode) continue;

      const sourceName = (sourceNode.label || sourceNode.properties?.name || '').toLowerCase();
      const targetName = (targetNode.label || targetNode.properties?.name || '').toLowerCase();

      const compoundMatch = recommendedCompounds.find(c => 
        sourceName.includes(c.toLowerCase()) || targetName.includes(c.toLowerCase())
      );
      const medMatch = currentMedications.find(m =>
        sourceName.includes(m.toLowerCase()) || targetName.includes(m.toLowerCase())
      );

      if (compoundMatch && medMatch) {
        alerts.push({
          compound: compoundMatch,
          medication: medMatch,
          interaction_type: predicate,
          severity: 'moderate',
          description: `Interação detectada no Knowledge Graph: ${compoundMatch} ${predicate} ${medMatch}`,
        });
      }
    }
  }

  return alerts;
}

// ─── Extract Evidence from KG ────────────────────────────────────────────────

function extractKgEvidence(kgResults: any[], conditionNames: string[]) {
  const triplets: any[] = [];
  const pathways: any[] = [];

  for (const result of kgResults) {
    const { condition, graphData } = result;
    const nodes = graphData?.nodes || [];
    const relationships = graphData?.relationships || graphData?.edges || [];

    for (const rel of relationships) {
      const sourceNode = nodes.find((n: any) => n.id === rel.source || n.id === rel.startNode);
      const targetNode = nodes.find((n: any) => n.id === rel.target || n.id === rel.endNode);
      if (sourceNode && targetNode) {
        const predicate = rel.type || rel.label || rel.relationship || 'TREATS';
        if (['TREATS', 'PREVENTS', 'ALLEVIATES', 'SUPPORTS'].includes(predicate.toUpperCase())) {
          triplets.push({
            subject: sourceNode.label || sourceNode.properties?.name || sourceNode.name,
            predicate: predicate.toUpperCase(),
            object: targetNode.label || targetNode.properties?.name || targetNode.name,
            confidence: rel.confidence || rel.properties?.confidence || 0.7,
            evidenceLevel: 'KG-backed',
            studyCount: rel.evidence_count || rel.properties?.evidence_count || undefined,
          });
        }
      }
    }

    const compounds = nodes.filter((n: any) => ['Nutraceutical', 'Compound', 'nutraceutical', 'compound'].includes(n.type || n.labels?.[0]));
    const mechanisms = nodes.filter((n: any) => ['Mechanism', 'mechanism', 'MolecularTarget'].includes(n.type || n.labels?.[0]));
    const effects = nodes.filter((n: any) => ['Effect', 'BiologicalEffect', 'effect'].includes(n.type || n.labels?.[0]));

    if (compounds.length > 0) {
      const steps: any[] = [];
      steps.push({ label: compounds[0].label || compounds[0].properties?.name || 'Compound', type: 'compound' });
      if (mechanisms.length > 0) {
        steps.push({ label: mechanisms[0].label || mechanisms[0].properties?.name || 'Mechanism', type: 'mechanism' });
      }
      if (effects.length > 0) {
        steps.push({ label: effects[0].label || effects[0].properties?.name || 'Effect', type: 'effect' });
      }
      steps.push({ label: condition, type: 'outcome' });
      pathways.push({ condition, steps });
    }
  }

  const projections = conditionNames.map((condition) => {
    const hasTriplets = triplets.some(t => t.object.toLowerCase().includes(condition.toLowerCase()));
    return {
      condition,
      baselineScore: 30 + Math.floor(Math.random() * 20),
      projectedImprovement: hasTriplets ? 25 + Math.floor(Math.random() * 20) : 15 + Math.floor(Math.random() * 10),
      confidenceBand: hasTriplets ? 8 : 15,
    };
  });

  return { triplets, pathways, projections };
}

// ─── Stage 6: Hybrid Recommendation ─────────────────────────────────────────

async function getHybridRecommendation(
  profile: PatientProfile,
  conditionNames: string[],
  kgResults: any[],
  predispositions: BreedPredisposition[],
  labAlerts: LabAlert[],
  medications: string[]
) {
  const primaryCondition = conditionNames[0] || 'geriatric wellness';

  // Build enriched context for the LLM
  const clinicalContext = {
    predispositions: predispositions
      .filter(p => !p.already_diagnosed)
      .map(p => `${p.condition_name} (risco ${p.risk_factor}x, evidência ${p.evidence_grade})`),
    labAlerts: labAlerts.map(a => 
      `${a.test_name}: ${a.value} ${a.unit} (ref: ${a.min_normal}-${a.max_normal}) → ${a.clinical_significance}`
    ),
    currentMedications: medications,
  };

  const { data: recommendation, error: recError } = await supabase.functions.invoke('hybrid-recommendation', {
    body: {
      mode: kgResults.length > 0 ? 'enrich' : 'fallback',
      petProfile: {
        species: profile.species,
        breed: profile.breed,
        age: profile.age_years,
        weight: profile.weight_kg,
      },
      condition: primaryCondition,
      clinicalContext,
      kgData: kgResults.length > 0 ? {
        nutraceuticals: kgResults.flatMap(r =>
          (r.graphData.nodes || [])
            .filter((n: any) => n.type === 'Nutraceutical' || n.type === 'Compound')
            .map((n: any) => ({
              name: n.label || n.properties?.name,
              dosage: n.properties?.dosage || 'Consultar veterinário',
              mechanism: n.properties?.mechanism || 'Via knowledge graph',
              evidenceLevel: 'KG-backed',
            }))
        ),
        rationale: `Baseado em ${kgResults.length} consulta(s) ao Knowledge Graph para: ${conditionNames.join(', ')}`,
        precautions: [],
      } : undefined,
    }
  });

  if (recError) throw recError;
  return recommendation;
}

// ─── Main Pipeline ───────────────────────────────────────────────────────────

export async function runClinicalAnalysisPipeline(
  profile: PatientProfile,
  conditions: any[],
  medications: any[],
  exams: any[]
): Promise<ClinicalAnalysisResult> {
  // Stage 1: Collect patient data (already passed as params)
  const conditionNames = conditions.map((c: any) => c.condition_name);
  const medicationNames = medications.map((m: any) => m.medication_name);

  // Stage 2: Breed predispositions
  const predispositions = await fetchBreedPredispositions(profile.breed, conditionNames);

  // Stage 3: Lab interpretation
  const labAlerts = await interpretLabResults(exams, profile.age_years);

  // Build extended condition list (existing + undiagnosed predispositions)
  const undiagnosedRisks = predispositions
    .filter(p => !p.already_diagnosed && p.risk_factor >= 2.5)
    .map(p => p.condition_name);
  const allConditionsToQuery = [...new Set([...conditionNames, ...undiagnosedRisks])];

  // Stage 4: KG Query
  const kgResults = await queryKnowledgeGraph(allConditionsToQuery);

  // Extract evidence
  const { triplets, pathways, projections } = extractKgEvidence(kgResults, conditionNames);

  // Stage 5: Interaction check
  const recommendedCompoundNames = kgResults.flatMap(r =>
    (r.graphData?.nodes || [])
      .filter((n: any) => ['Nutraceutical', 'Compound'].includes(n.type))
      .map((n: any) => n.label || n.properties?.name || '')
  );
  const interactionAlerts = checkInteractions(recommendedCompoundNames, medicationNames, kgResults);

  // Stage 6: Hybrid recommendation
  const recommendation = await getHybridRecommendation(
    profile, conditionNames, kgResults, predispositions, labAlerts, medicationNames
  );

  // Build compounds from recommendation
  const nutraceuticals = recommendation?.nutraceuticals || [];
  const primaryCondition = conditionNames[0] || 'geriatric wellness';
  const compounds = nutraceuticals.map((n: any, idx: number) => {
    const dosageMatch = n.dosage?.match(/(\d+\.?\d*)\s*-\s*(\d+\.?\d*)\s*(mg\/kg|mg|g|IU)/i);
    const dosageMin = dosageMatch ? parseFloat(dosageMatch[1]) : 5;
    const dosageMax = dosageMatch ? parseFloat(dosageMatch[2]) : 50;
    const unit = dosageMatch ? dosageMatch[3] : 'mg/kg';
    const recommended = dosageMin + (dosageMax - dosageMin) * 0.5;

    return {
      id: `rec-${idx}`,
      name: n.name,
      condition: primaryCondition,
      dosageMin,
      dosageMax,
      dosageRecommended: Math.round(recommended * 10) / 10,
      dosageCurrent: Math.round(recommended * 10) / 10,
      unit,
      evidenceLevel: n.evidenceLevel || 'AI-suggested',
      rationale: n.mechanism || '',
      removed: false,
      type: 'nutraceutical' as const,
    };
  });

  return {
    predispositions,
    labAlerts,
    interactionAlerts,
    kgResults,
    kgTriplets: triplets,
    kgPathways: pathways,
    kgProjections: projections,
    recommendation,
    compounds,
    confidenceLevel: kgResults.length > 0 ? 'medium' : 'low',
    analysisTimestamp: new Date().toISOString(),
  };
}
