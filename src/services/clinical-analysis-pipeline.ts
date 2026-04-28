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
import { resolveCompoundDosage } from './dosage-resolver';

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

export interface ClinicalDiscovery {
  type: 'lab-condition-correlation' | 'medication-monitoring' | 'breed-lab-confirmation' | 'compound-opportunity';
  severity: 'info' | 'warning' | 'critical';
  title: string;
  description: string;
  relatedEntities: string[];
}

export interface ClinicalAnalysisResult {
  predispositions: BreedPredisposition[];
  labAlerts: LabAlert[];
  interactionAlerts: InteractionAlert[];
  clinicalDiscoveries: ClinicalDiscovery[];
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
  const { data: ranges } = await (supabase as any)
    .from('lab_reference_ranges')
    .select('*')
    .eq('species', 'canine')
    .in('age_group', [ageGroup, 'adult']);

  if (!ranges || ranges.length === 0) return [];

  // Build a map, preferring age-specific ranges
  const rangeMap = new Map<string, any>();
  for (const r of ranges as any[]) {
    const key = (r.test_name as string).toLowerCase();
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

// ─── Condition Name Canonicalization ─────────────────────────────────────────

/**
 * Maps clinical condition names to canonical KG names.
 * The KG uses specific terminology; clinical records may use different names.
 */
const CONDITION_CANONICAL_MAP: Record<string, string[]> = {
  'heart disease': ['Cardiovascular Disease', 'Heart failure', 'Cardiac Disease'],
  'canine cognitive dysfunction syndrome (cds)': ['Cognitive Dysfunction Syndrome', 'Canine Cognitive Dysfunction Syndrome', 'Canine Cognitive Dysfunction'],
  'canine cognitive dysfunction syndrome': ['Cognitive Dysfunction Syndrome', 'Canine Cognitive Dysfunction Syndrome'],
  'cognitive dysfunction': ['Cognitive Dysfunction Syndrome', 'Canine Cognitive Dysfunction Syndrome'],
  'cds': ['Cognitive Dysfunction Syndrome'],
  'cellular senescence': ['Cellular Senescence', 'Senescence'],
  'chronic low-grade inflammation (inflammaging)': ['Inflammaging', 'Chronic Inflammation', 'Inflammation'],
  'inflammaging': ['Inflammaging', 'Chronic Inflammation'],
  'inflammation': ['Inflammation', 'Inflammaging'],
  'hip dysplasia': ['Hip Dysplasia', 'Canine Hip Dysplasia'],
  'obesity': ['Obesity', 'Canine Obesity'],
  'diabetes': ['Diabetes Mellitus', 'Diabetes'],
  'kidney disease': ['Chronic Kidney Disease', 'Renal Disease'],
  'liver disease': ['Hepatic Disease', 'Liver Disease'],
  'cancer': ['Neoplasia', 'Cancer'],
  'anxiety': ['Anxiety', 'Canine Anxiety'],
};

/**
 * Get canonical names to try for KG queries.
 * Returns the original name plus any mapped alternatives.
 */
function getCanonicalConditionNames(conditionName: string): string[] {
  const lower = conditionName.toLowerCase().trim();
  const candidates = [conditionName]; // always try original first
  
  // Check exact match
  if (CONDITION_CANONICAL_MAP[lower]) {
    candidates.push(...CONDITION_CANONICAL_MAP[lower]);
  }
  
  // Check partial matches
  for (const [key, values] of Object.entries(CONDITION_CANONICAL_MAP)) {
    if (lower.includes(key) || key.includes(lower)) {
      for (const v of values) {
        if (!candidates.includes(v)) candidates.push(v);
      }
    }
  }
  
  // Strip parenthetical suffixes as fallback: "Something (ABC)" -> "Something"
  const withoutParens = conditionName.replace(/\s*\([^)]*\)\s*$/, '').trim();
  if (withoutParens !== conditionName && !candidates.includes(withoutParens)) {
    candidates.push(withoutParens);
  }
  
  return candidates;
}

// ─── Stage 4: KG Query ──────────────────────────────────────────────────────

async function queryKnowledgeGraph(
  conditionNames: string[]
): Promise<any[]> {
  const kgResults: any[] = [];

  for (const condition of conditionNames.length > 0 ? conditionNames : ['aging', 'longevity']) {
    const candidates = getCanonicalConditionNames(condition);
    let found = false;
    
    for (const candidate of candidates) {
      try {
        const { data: kgData, error: kgError } = await supabase.functions.invoke('graph-rag-search', {
          body: { queryType: 'context', sourceEntity: candidate }
        });

        if (!kgError && kgData?.data && (kgData.data.nodes?.length > 0 || kgData.data.relationships?.length > 0)) {
          kgResults.push({ condition, graphData: kgData.data });
          console.log(`✅ KG hit for "${condition}" using canonical name "${candidate}": ${kgData.data.nodes?.length || 0} nodes`);
          found = true;
          break; // found a match, stop trying alternatives
        }
      } catch (e) {
        console.warn(`KG query for "${candidate}" (from "${condition}") failed:`, e);
      }
    }
    
    if (!found) {
      console.warn(`⚠️ No KG data found for "${condition}" after trying: ${candidates.join(', ')}`);
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

// All clinically relevant predicates for triplet extraction
const CLINICAL_PREDICATES = [
  'TREATS', 'PREVENTS', 'AMELIORATES', 'INHIBITS', 'MODULATES', 'ACTIVATES',
  'CONTRAINDICATES', 'INTERACTS_WITH', 'SUPPORTS', 'CAUSES', 'AGGRAVATES',
  'ALLEVIATES', 'BLOCKS', 'STIMULATES', 'REDUCES', 'INCREASES',
];

// Map predicates to Portuguese labels for pathway display
const PREDICATE_PT_LABELS: Record<string, string> = {
  TREATS: 'trata',
  PREVENTS: 'previne',
  AMELIORATES: 'melhora',
  INHIBITS: 'inibe',
  MODULATES: 'modula',
  ACTIVATES: 'ativa',
  CONTRAINDICATES: 'contraindica',
  INTERACTS_WITH: 'interage',
  SUPPORTS: 'suporta',
  CAUSES: 'causa',
  AGGRAVATES: 'agrava',
  ALLEVIATES: 'alivia',
  BLOCKS: 'bloqueia',
  STIMULATES: 'estimula',
  REDUCES: 'reduz',
  INCREASES: 'aumenta',
};

function extractKgEvidence(kgResults: any[], conditionNames: string[]) {
  const triplets: any[] = [];
  const pathways: any[] = [];
  const seenPathwayKeys = new Set<string>();

  for (const result of kgResults) {
    const { condition, graphData } = result;
    const nodes = graphData?.nodes || [];
    const relationships = graphData?.relationships || graphData?.edges || [];

    // Extract ALL clinically relevant triplets
    for (const rel of relationships) {
      const sourceNode = nodes.find((n: any) => n.id === rel.source || n.id === rel.startNode);
      const targetNode = nodes.find((n: any) => n.id === rel.target || n.id === rel.endNode);
      if (sourceNode && targetNode) {
        const predicate = (rel.type || rel.label || rel.relationship || 'TREATS').toUpperCase();
        if (CLINICAL_PREDICATES.includes(predicate)) {
          triplets.push({
            subject: sourceNode.label || sourceNode.properties?.name || sourceNode.name,
            predicate,
            object: targetNode.label || targetNode.properties?.name || targetNode.name,
            confidence: rel.confidence || rel.properties?.confidence || 0.7,
            evidenceLevel: rel.evidence_level || rel.properties?.evidence_level || 'KG-backed',
            intensity: rel.intensity ?? rel.properties?.intensity ?? null,
            studyCount: rel.evidence_count || rel.properties?.evidence_count || undefined,
          });
        }
      }
    }

    // Build pathway chains for ALL compounds (not just first)
    const compounds = nodes.filter((n: any) => ['Nutraceutical', 'Compound', 'nutraceutical', 'compound'].includes(n.type || n.labels?.[0]));
    const mechanisms = nodes.filter((n: any) => ['Mechanism', 'mechanism', 'MolecularTarget'].includes(n.type || n.labels?.[0]));
    const effects = nodes.filter((n: any) => ['Effect', 'BiologicalEffect', 'effect'].includes(n.type || n.labels?.[0]));

    for (const compound of compounds) {
      const compoundName = compound.label || compound.properties?.name || 'Compound';
      const pathwayKey = `${compoundName}-${condition}`;
      if (seenPathwayKeys.has(pathwayKey)) continue;
      seenPathwayKeys.add(pathwayKey);

      const steps: any[] = [];
      steps.push({ label: compoundName, type: 'compound' });

      // Find relationship predicate from compound to mechanism
      const compoundRels = relationships.filter((r: any) => {
        const srcId = r.source || r.startNode;
        return srcId === compound.id;
      });

      // Add mechanisms connected to this compound
      for (const mech of mechanisms) {
        const connectingRel = compoundRels.find((r: any) => (r.target || r.endNode) === mech.id);
        const predicate = connectingRel ? (connectingRel.type || connectingRel.label || '').toUpperCase() : 'MODULATES';
        const ptLabel = PREDICATE_PT_LABELS[predicate] || predicate.toLowerCase();
        steps.push({
          label: mech.label || mech.properties?.name || 'Mechanism',
          type: 'mechanism',
          predicate: ptLabel,
        });
        break; // one mechanism per pathway chain
      }

      // Add effects
      for (const eff of effects) {
        const mechNode = mechanisms[0];
        let predicate = 'MODULATES';
        if (mechNode) {
          const mechRels = relationships.filter((r: any) => (r.source || r.startNode) === mechNode.id);
          const connectingRel = mechRels.find((r: any) => (r.target || r.endNode) === eff.id);
          if (connectingRel) predicate = (connectingRel.type || connectingRel.label || '').toUpperCase();
        }
        const ptLabel = PREDICATE_PT_LABELS[predicate] || predicate.toLowerCase();
        steps.push({
          label: eff.label || eff.properties?.name || 'Effect',
          type: 'effect',
          predicate: ptLabel,
        });
        break; // one effect per pathway chain
      }

      // Check if this compound has contraindication relationships
      const contraindicationRel = relationships.find((r: any) => {
        const pred = (r.type || r.label || '').toUpperCase();
        return (pred === 'CONTRAINDICATES' || pred === 'AGGRAVATES') &&
          ((r.source || r.startNode) === compound.id || (r.target || r.endNode) === compound.id);
      });

      if (contraindicationRel) {
        const targetId = (contraindicationRel.target || contraindicationRel.endNode);
        const contraNode = nodes.find((n: any) => n.id === targetId);
        if (contraNode) {
          steps.push({
            label: contraNode.label || contraNode.properties?.name || 'Contraindication',
            type: 'contraindication',
            predicate: 'contraindica',
          });
        }
      }

      steps.push({ label: condition, type: 'outcome', predicate: steps.length > 1 ? 'trata' : undefined });
      pathways.push({ condition, steps });
    }
  }

  // ── Evidence-Based Projections ──
  const EVIDENCE_WEIGHTS: Record<string, number> = {
    meta_analysis: 1.0, systematic_review: 0.95, rct: 0.85, cohort: 0.7,
    observational: 0.6, case_control: 0.55, in_vitro: 0.35, theoretical: 0.15,
  };

  const projections = conditionNames.map((condition) => {
    const condLower = condition.toLowerCase();

    // Gather all triplets relevant to this condition
    const relevantTriplets = triplets.filter(t =>
      t.object.toLowerCase().includes(condLower) || t.subject?.toLowerCase().includes(condLower)
    );

    const therapeuticTriplets = relevantTriplets.filter(t =>
      ['TREATS', 'AMELIORATES', 'PREVENTS', 'SUPPORTS', 'ALLEVIATES'].includes(t.predicate)
    );

    const tripletCount = therapeuticTriplets.length;
    const uniqueStudyIds = [...new Set(therapeuticTriplets.map(t => t.studyCount).filter(Boolean))];
    const compoundsInvolved = [...new Set(therapeuticTriplets.map(t => t.subject).filter(Boolean))];

    // Calculate weighted intensity from real data
    let weightedIntensitySum = 0;
    let weightSum = 0;
    const confidences: number[] = [];

    for (const t of therapeuticTriplets) {
      const evLevel = (t.evidenceLevel || '').toLowerCase().replace(/[\s-]+/g, '_');
      const evWeight = EVIDENCE_WEIGHTS[evLevel] || 0.2;
      const intensity = typeof t.intensity === 'number' ? t.intensity : 0.5; // conservative default
      const conf = typeof t.confidence === 'number' ? t.confidence : 0.3;
      
      weightedIntensitySum += intensity * evWeight * conf;
      weightSum += evWeight * conf;
      confidences.push(conf);
    }

    // Determine dominant evidence level
    const evidenceLevelCounts: Record<string, number> = {};
    for (const t of therapeuticTriplets) {
      const lev = t.evidenceLevel || 'unknown';
      evidenceLevelCounts[lev] = (evidenceLevelCounts[lev] || 0) + 1;
    }
    const dominantEvidenceLevel = Object.entries(evidenceLevelCounts)
      .sort((a, b) => b[1] - a[1])[0]?.[0] || 'unknown';

    let baselineScore: number;
    let projectedImprovement: number;
    let confidenceBand: number;
    let dataSource: 'knowledge_graph' | 'hybrid_kg_llm' | 'llm_only';
    let confidenceLevel: 'high' | 'medium' | 'low' | 'insufficient';
    let studyGaps: string | undefined;

    if (tripletCount >= 3) {
      // Layer 1: Knowledge Graph — sufficient data
      const avgWeightedIntensity = weightSum > 0 ? weightedIntensitySum / weightSum : 0.3;
      const synergyFactor = compoundsInvolved.length > 1 ? 1 + (compoundsInvolved.length - 1) * 0.08 : 1;
      
      projectedImprovement = Math.round(Math.min(55, avgWeightedIntensity * 60 * synergyFactor));
      baselineScore = 35; // conservative fixed baseline
      
      const confStdDev = confidences.length > 1
        ? Math.sqrt(confidences.reduce((s, c) => s + (c - confidences.reduce((a, b) => a + b, 0) / confidences.length) ** 2, 0) / confidences.length)
        : 0.15;
      confidenceBand = Math.round(Math.max(4, Math.min(18, confStdDev * 30)));
      
      const avgConf = confidences.reduce((a, b) => a + b, 0) / confidences.length;
      const bestEvWeight = Math.max(...therapeuticTriplets.map(t => EVIDENCE_WEIGHTS[(t.evidenceLevel || '').toLowerCase().replace(/[\s-]+/g, '_')] || 0.2));
      const overallConfScore = (Math.min(tripletCount / 8, 1) * 0.3) + (bestEvWeight * 0.4) + (avgConf * 0.3);
      
      confidenceLevel = overallConfScore >= 0.7 ? 'high' : overallConfScore >= 0.45 ? 'medium' : 'low';
      dataSource = 'knowledge_graph';
      
      if (tripletCount < 5) {
        studyGaps = condition;
      }
    } else if (tripletCount > 0) {
      // Layer 2: Hybrid — some KG data, needs AI enrichment
      const avgWeightedIntensity = weightSum > 0 ? weightedIntensitySum / weightSum : 0.25;
      projectedImprovement = Math.round(Math.min(40, avgWeightedIntensity * 50));
      baselineScore = 40;
      confidenceBand = 14;
      confidenceLevel = 'low';
      dataSource = 'hybrid_kg_llm';
      studyGaps = condition;
    } else {
      // Layer 3: LLM-only — no KG data
      projectedImprovement = 15;
      baselineScore = 45;
      confidenceBand = 20;
      confidenceLevel = 'insufficient';
      dataSource = 'llm_only';
      studyGaps = condition;
    }

    return {
      condition,
      baselineScore,
      projectedImprovement,
      confidenceBand,
      // Evidence-based metadata
      dataSource,
      confidenceLevel,
      evidenceSummary: {
        tripletCount,
        studyCount: uniqueStudyIds.length,
        dominantEvidenceLevel,
        compoundsInvolved,
        avgIntensity: weightSum > 0 ? Math.round((weightedIntensitySum / weightSum) * 100) / 100 : null,
      },
      studyGaps,
    };
  });

  return { triplets, pathways, projections };
}

// ─── Clinical Discoveries Generator ─────────────────────────────────────────

function generateClinicalDiscoveries(
  predispositions: BreedPredisposition[],
  labAlerts: LabAlert[],
  conditions: any[],
  medications: any[],
  exams: any[],
  breed: string,
  ageYears: number
): ClinicalDiscovery[] {
  const discoveries: ClinicalDiscovery[] = [];
  const conditionNames = conditions.map((c: any) => (c.condition_name || '').toLowerCase());
  const medNames = medications.map((m: any) => (m.medication_name || '').toLowerCase());

  // 1. Lab-Condition correlations
  for (const alert of labAlerts) {
    const testLower = alert.test_name.toLowerCase();
    // CRP/IL-6 elevated + Osteoarthritis/Inflammation
    if ((testLower.includes('crp') || testLower.includes('il6') || testLower.includes('il-6')) && alert.status.includes('high')) {
      const inflammCondition = conditionNames.find(c => c.includes('osteoarthritis') || c.includes('inflam'));
      if (inflammCondition) {
        discoveries.push({
          type: 'lab-condition-correlation',
          severity: 'warning',
          title: `${alert.test_name} elevado correlacionado com ${inflammCondition}`,
          description: `${alert.test_name} = ${alert.value} ${alert.unit} (ref: ${alert.min_normal}-${alert.max_normal}). Marcador inflamatório elevado pode indicar resposta inflamatória crônica associada a ${inflammCondition}. Considerar antioxidantes e anti-inflamatórios naturais.`,
          relatedEntities: [alert.test_name, inflammCondition],
        });
      }
    }
    // Creatinine/BUN elevated + medications
    if ((testLower.includes('creatinine') || testLower.includes('bun') || testLower.includes('sdma')) && alert.status.includes('high')) {
      const nephrotoxicMed = medNames.find(m => m.includes('meloxicam') || m.includes('carprofen') || m.includes('furosemide'));
      if (nephrotoxicMed) {
        discoveries.push({
          type: 'medication-monitoring',
          severity: 'critical',
          title: `Monitoramento renal necessário — ${nephrotoxicMed} + ${alert.test_name} alterado`,
          description: `${alert.test_name} = ${alert.value} ${alert.unit} (limítrofe/elevado). O uso contínuo de ${nephrotoxicMed} requer monitoramento renal frequente. Considerar nefroprotetores (Astaxantina, Omega-3).`,
          relatedEntities: [nephrotoxicMed, alert.test_name],
        });
      }
    }
    // ALT/ALP elevated + medication hepatotoxicity
    if ((testLower.includes('alt') || testLower.includes('alkaline_phosphatase') || testLower.includes('alp')) && alert.status.includes('high')) {
      const hepatotoxicMed = medNames.find(m => m.includes('selegiline') || m.includes('carprofen') || m.includes('meloxicam'));
      if (hepatotoxicMed) {
        discoveries.push({
          type: 'medication-monitoring',
          severity: 'warning',
          title: `Enzimas hepáticas elevadas — monitorar ${hepatotoxicMed}`,
          description: `${alert.test_name} = ${alert.value} ${alert.unit} (elevado). Possível estresse hepático associado ao uso prolongado de ${hepatotoxicMed}. Considerar hepatoprotetores (Silimarina, SAMe).`,
          relatedEntities: [hepatotoxicMed, alert.test_name],
        });
      }
    }
    // NT-proBNP/Troponin elevated
    if ((testLower.includes('nt_probnp') || testLower.includes('troponin')) && alert.status.includes('high')) {
      const cardiacCondition = conditionNames.find(c => c.includes('heart') || c.includes('cardí') || c.includes('cardiac'));
      if (cardiacCondition) {
        discoveries.push({
          type: 'lab-condition-correlation',
          severity: 'critical',
          title: `Biomarcadores cardíacos confirmam ${cardiacCondition}`,
          description: `${alert.test_name} = ${alert.value} ${alert.unit} (significativamente elevado). Confirma progressão de ${cardiacCondition}. Considerar cardioprotetores: CoQ10, Taurina, L-Carnitina.`,
          relatedEntities: [alert.test_name, cardiacCondition],
        });
      }
    }
    // WBC elevated
    if (testLower.includes('wbc') && alert.status.includes('high')) {
      discoveries.push({
        type: 'lab-condition-correlation',
        severity: 'info',
        title: `WBC elevado — possível processo inflamatório ativo`,
        description: `WBC = ${alert.value} ${alert.unit} (ref: ${alert.min_normal}-${alert.max_normal}). Leucocitose pode indicar inflamação sistêmica ativa. Correlacionar com sintomas clínicos e considerar painel inflamatório completo.`,
        relatedEntities: ['WBC', ...conditionNames.filter(c => c.includes('inflam'))],
      });
    }
    // Oxidative stress markers
    if ((testLower.includes('mda') || testLower.includes('sod') || testLower.includes('glutathione')) && (alert.status.includes('high') || alert.status.includes('low'))) {
      discoveries.push({
        type: 'compound-opportunity',
        severity: 'warning',
        title: `Estresse oxidativo detectado — oportunidade terapêutica`,
        description: `${alert.test_name} fora do normal (${alert.value} ${alert.unit}). Estresse oxidativo acelerado contribui para envelhecimento celular. Compostos antioxidantes prioritários: Resveratrol, NAC, Vitamina E, Astaxantina.`,
        relatedEntities: [alert.test_name, 'Estresse Oxidativo'],
      });
    }
    // Cortisol elevated + cognitive dysfunction
    if (testLower.includes('cortisol') && alert.status.includes('high')) {
      const cogCondition = conditionNames.find(c => c.includes('cognitive') || c.includes('cds'));
      if (cogCondition) {
        discoveries.push({
          type: 'lab-condition-correlation',
          severity: 'warning',
          title: `Cortisol elevado associado a disfunção cognitiva`,
          description: `Cortisol = ${alert.value} ${alert.unit} (elevado). Hipercortisolemia crônica acelera neurodegeneração. Compostos neuroprotetores indicados: Fosfatidilserina, DHA, Vitamina E.`,
          relatedEntities: ['Cortisol', cogCondition],
        });
      }
    }
  }

  // 2. Breed predisposition + lab confirmation
  for (const pred of predispositions) {
    if (pred.already_diagnosed) continue;
    const predLower = pred.condition_name.toLowerCase();
    
    // Check if any exam suggests early signs
    for (const exam of exams) {
      if (!exam.results || typeof exam.results !== 'object') continue;
      const resultsStr = JSON.stringify(exam.results).toLowerCase();
      
      if (predLower.includes('hip dysplasia') && resultsStr.includes('dysplasia')) {
        discoveries.push({
          type: 'breed-lab-confirmation',
          severity: 'warning',
          title: `Predisposição a ${pred.condition_name} com sinais em exame`,
          description: `${breed} tem risco ${pred.risk_factor}x para ${pred.condition_name} (evidência ${pred.evidence_grade}). Exame "${exam.exam_type}" mostra sinais compatíveis. Considerar intervenção precoce com condroprotetores.`,
          relatedEntities: [pred.condition_name, exam.exam_type],
        });
        break;
      }
    }
  }

  // 3. Age-related compound opportunities
  if (ageYears >= 7 && conditionNames.some(c => c.includes('senescence') || c.includes('aging'))) {
    const hasOxStress = labAlerts.some(a => a.test_name.toLowerCase().includes('mda') || a.test_name.toLowerCase().includes('sod'));
    if (hasOxStress) {
      discoveries.push({
        type: 'compound-opportunity',
        severity: 'info',
        title: `Perfil geriátrico + estresse oxidativo — stack senolítico indicado`,
        description: `Paciente geriátrico (${ageYears} anos) com marcadores de estresse oxidativo elevados e senescência celular. Considerar stack senolítico: Fisetin + Quercetina + NMN para clearance de células senescentes.`,
        relatedEntities: ['Senescência Celular', 'Estresse Oxidativo', 'Fisetin', 'Quercetina', 'NMN'],
      });
    }
  }

  return discoveries;
}

// ─── Prioritize Compounds by Lab Findings ────────────────────────────────────

function prioritizeCompoundsByLabFindings(
  compounds: any[],
  labAlerts: LabAlert[],
  conditions: any[]
): any[] {
  if (labAlerts.length === 0) return compounds;

  const hasInflammation = labAlerts.some(a => 
    ['crp', 'il6', 'il-6', 'tnf'].some(m => a.test_name.toLowerCase().includes(m)) && a.status.includes('high')
  );
  const hasOxidativeStress = labAlerts.some(a =>
    ['mda', 'sod', 'glutathione'].some(m => a.test_name.toLowerCase().includes(m))
  );
  const hasRenalIssue = labAlerts.some(a =>
    ['creatinine', 'bun', 'sdma'].some(m => a.test_name.toLowerCase().includes(m)) && a.status.includes('high')
  );
  const hasHepaticIssue = labAlerts.some(a =>
    ['alt', 'alkaline_phosphatase', 'ast'].some(m => a.test_name.toLowerCase().includes(m)) && a.status.includes('high')
  );
  const hasCardiacIssue = labAlerts.some(a =>
    ['nt_probnp', 'troponin'].some(m => a.test_name.toLowerCase().includes(m)) && a.status.includes('high')
  );

  // Assign priority scores based on lab findings
  return compounds.map(c => {
    let priorityBoost = 0;
    const nameLower = (c.name || '').toLowerCase();
    
    if (hasInflammation && ['curcumin', 'omega-3', 'boswellia', 'resveratrol'].some(x => nameLower.includes(x))) priorityBoost += 3;
    if (hasOxidativeStress && ['resveratrol', 'nac', 'astaxanthin', 'vitamin e', 'coq10'].some(x => nameLower.includes(x))) priorityBoost += 3;
    if (hasRenalIssue && ['astaxanthin', 'omega-3'].some(x => nameLower.includes(x))) priorityBoost += 2;
    if (hasHepaticIssue && ['silymarin', 'same', 'milk thistle'].some(x => nameLower.includes(x))) priorityBoost += 2;
    if (hasCardiacIssue && ['coq10', 'taurine', 'l-carnitine', 'omega-3'].some(x => nameLower.includes(x))) priorityBoost += 3;

    return { ...c, _priorityBoost: priorityBoost };
  }).sort((a, b) => (b._priorityBoost || 0) - (a._priorityBoost || 0));
}

// ─── Stage 6: Hybrid Recommendation ─────────────────────────────────────────

async function getHybridRecommendation(
  profile: PatientProfile,
  conditionNames: string[],
  kgResults: any[],
  predispositions: BreedPredisposition[],
  labAlerts: LabAlert[],
  medications: string[],
  conditions: any[],
  exams: any[]
) {
  const primaryCondition = conditionNames[0] || 'geriatric wellness';

  // Build FULL enriched context for the LLM
  const clinicalContext = {
    allConditions: conditionNames,
    predispositions: predispositions
      .filter(p => !p.already_diagnosed)
      .map(p => `${p.condition_name} (risco ${p.risk_factor}x, evidência ${p.evidence_grade})`),
    labAlerts: labAlerts.map(a => 
      `${a.test_name}: ${a.value} ${a.unit} (ref: ${a.min_normal}-${a.max_normal}, status: ${a.status}) → ${a.clinical_significance}`
    ),
    currentMedications: medications,
    examSummary: exams.map(e => `${e.exam_type}: ${e.notes || JSON.stringify(e.results)}`).slice(0, 10),
  };

  // Build per-condition compound mapping from KG
  const perConditionCompounds: Record<string, any[]> = {};
  for (const result of kgResults) {
    const compounds = (result.graphData?.nodes || [])
      .filter((n: any) => n.type === 'Nutraceutical' || n.type === 'Compound')
      .map((n: any) => ({
        name: n.properties?.name || n.label,
        dosage: n.properties?.dosage || 'Consultar veterinário',
        mechanism: n.properties?.mechanism || n.properties?.description || 'Via knowledge graph',
        evidenceLevel: 'KG-backed',
        condition: result.condition,
      }));
    perConditionCompounds[result.condition] = compounds;
  }

  // Deduplicate: remove compounds already prescribed as medications
  const medNamesLower = medications.map(m => m.toLowerCase());
  const allKgCompounds = Object.values(perConditionCompounds).flat()
    .filter(c => !medNamesLower.some(m => (c.name || '').toLowerCase().includes(m)));

  // Filter out internal codes (e.g. "LY-D6", "AB-123") — keep only real compound names
  const isInternalCode = (name: string) => /^[A-Z]{1,4}-[A-Z]?\d/.test(name);
  const meaningfulCompounds = allKgCompounds.filter(c => !isInternalCode(c.name || ''));

  // Deduplicate by normalized name, keeping first occurrence, cap at 8 for LLM
  const seenNames = new Set<string>();
  const uniqueCompounds = meaningfulCompounds.filter(c => {
    const key = (c.name || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    if (!key || seenNames.has(key)) return false;
    seenNames.add(key);
    return true;
  }).slice(0, 8);

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
        nutraceuticals: uniqueCompounds,
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

  // Generate clinical discoveries
  const clinicalDiscoveries = generateClinicalDiscoveries(
    predispositions, labAlerts, conditions, medications, exams, profile.breed, profile.age_years
  );

  // Stage 6: Hybrid recommendation with full context
  const recommendation = await getHybridRecommendation(
    profile, conditionNames, kgResults, predispositions, labAlerts, medicationNames, conditions, exams
  );

  // Build compounds from recommendation with per-condition mapping
  const nutraceuticals = recommendation?.nutraceuticals || [];
  const compounds = nutraceuticals.map((n: any, idx: number) => {
    const dosageMatch = n.dosage?.match(/(\d+\.?\d*)\s*-\s*(\d+\.?\d*)\s*(mg\/kg|mg|g|IU)/i);
    const dosageMin = dosageMatch ? parseFloat(dosageMatch[1]) : 5;
    const dosageMax = dosageMatch ? parseFloat(dosageMatch[2]) : 50;
    const unit = dosageMatch ? dosageMatch[3] : 'mg/kg';
    const recommended = dosageMin + (dosageMax - dosageMin) * 0.5;

    return {
      id: `rec-${idx}`,
      name: n.name,
      condition: n.condition || n.targetCondition || conditionNames[idx % conditionNames.length] || 'geriatric wellness',
      dosageMin,
      dosageMax,
      dosageRecommended: Math.round(recommended * 10) / 10,
      dosageCurrent: Math.round(recommended * 10) / 10,
      unit,
      evidenceLevel: n.evidenceLevel || 'AI-suggested',
      rationale: n.mechanism || n.rationale || '',
      removed: false,
      type: 'nutraceutical' as const,
    };
  });

  // Prioritize compounds based on lab findings and cap at 8
  const MAX_COMPOUNDS = 8;
  const prioritizedCompounds = prioritizeCompoundsByLabFindings(compounds, labAlerts, conditions)
    .slice(0, MAX_COMPOUNDS);

  // Stage 6.5: Attach supporting scientific studies + KG triplets + synergies
  // to each compound. The card now renders this evidence inline so vets don't
  // have to switch tabs to see it.
  const patientConditionNames = (conditions || [])
    .map((c: any) => c?.condition_name || c?.name)
    .filter(Boolean);
  const compoundsWithStudies = await attachStudiesToCompounds(
    prioritizedCompounds,
    patientConditionNames,
  );

  return {
    predispositions,
    labAlerts,
    interactionAlerts,
    clinicalDiscoveries,
    kgResults,
    kgTriplets: triplets,
    kgPathways: pathways,
    kgProjections: projections,
    recommendation,
    compounds: compoundsWithStudies,
    confidenceLevel: kgResults.length > 0 ? 'medium' : 'low',
    analysisTimestamp: new Date().toISOString(),
  };
}

// ─── Stage 6.5: Attach scientific studies per compound ────────────────────────

function buildStudyLink(s: { link?: string | null; doi?: string | null; pmid?: string | null; title?: string | null }): string {
  // 1. Direct link (only if absolute http(s))
  if (s.link && /^https?:\/\//i.test(s.link)) return s.link;
  // 2. DOI (strip any embedded https://doi.org/ prefix)
  if (s.doi) {
    const doi = String(s.doi).replace(/^https?:\/\/(dx\.)?doi\.org\//i, '').trim();
    if (doi) return `https://doi.org/${doi}`;
  }
  // 3. PubMed
  if (s.pmid) {
    const pmid = String(s.pmid).trim();
    if (pmid) return `https://pubmed.ncbi.nlm.nih.gov/${pmid}`;
  }
  // 4. Fallback: Google Scholar by title
  if (s.title) return `https://scholar.google.com/scholar?q=${encodeURIComponent(s.title)}`;
  return 'https://scholar.google.com/';
}

async function attachStudiesToCompounds(
  compounds: any[],
  patientConditions: string[] = [],
): Promise<any[]> {
  if (!compounds || compounds.length === 0) return compounds;

  const TREATMENT_PREDICATES = ['TREATS', 'AMELIORATES', 'PREVENTS', 'MODULATES', 'INHIBITS', 'ACTIVATES'];
  const MAX_STUDIES_PER_COMPOUND = 3;

  const enriched = await Promise.all(
    compounds.map(async (c) => {
      try {
        // Find edges where the compound (subject) targets the condition (object).
        // hierarchical_edges stores entity ids — but we don't have ids here.
        // Use triplet_extractions instead, which has subject_name / object_name as text.
        const { data: triplets } = await supabase
          .from('triplet_extractions')
          .select('study_id, extraction_confidence, predicate, subject_name, object_name, mechanism_path')
          .ilike('subject_name', `%${c.name}%`)
          .ilike('object_name', `%${c.condition}%`)
          .in('predicate', TREATMENT_PREDICATES)
          .eq('curation_status', 'approved')
          .order('extraction_confidence', { ascending: false })
          .limit(10);

        const studyIds = Array.from(
          new Set((triplets || []).map((t: any) => t.study_id).filter(Boolean))
        ).slice(0, MAX_STUDIES_PER_COMPOUND);

        // Mechanism: pick the most-confident triplet that has a non-empty mechanism_path
        const topMechTriplet = (triplets || []).find((t: any) => {
          const mp = t.mechanism_path;
          if (!mp) return false;
          if (Array.isArray(mp)) return mp.length > 0;
          if (typeof mp === 'string') return mp.trim().length > 0;
          if (typeof mp === 'object') return Object.keys(mp).length > 0;
          return false;
        });
        let mechanism: string | null = null;
        if (topMechTriplet) {
          const mp = topMechTriplet.mechanism_path;
          if (Array.isArray(mp)) mechanism = mp.map((s: any) => String(s)).join(' → ');
          else if (typeof mp === 'string') mechanism = mp;
          else if (typeof mp === 'object' && Array.isArray((mp as any).steps)) {
            mechanism = (mp as any).steps.map((s: any) => s.label || s.name || s).join(' → ');
          } else mechanism = JSON.stringify(mp);
        }

        // ── Aggregated KG triplets for THIS (compound, condition) pair ───────
        const aggregatedKg: Record<string, any> = {};
        for (const t of triplets || []) {
          const pred = String(t.predicate || 'TREATS');
          const obj = String(t.object_name || c.condition);
          const key = `${pred}::${obj.toLowerCase()}`;
          if (!aggregatedKg[key]) {
            aggregatedKg[key] = {
              subject: c.name,
              predicate: pred,
              object: obj,
              confidence: Number(t.extraction_confidence || 0),
              evidenceLevel: 'KG-backed',
              studyIds: new Set<string>(),
            };
          }
          if (t.study_id) aggregatedKg[key].studyIds.add(t.study_id);
          aggregatedKg[key].confidence = Math.max(
            aggregatedKg[key].confidence,
            Number(t.extraction_confidence || 0),
          );
        }
        const kgTriplets = Object.values(aggregatedKg).map((row: any) => ({
          subject: row.subject,
          predicate: row.predicate,
          object: row.object,
          confidence: row.confidence,
          evidenceLevel: row.evidenceLevel,
          studyCount: row.studyIds.size,
        }));

        // ── Synergies: same compound treating OTHER patient conditions ───────
        let synergies: Array<{ condition: string; predicate: string; studyCount: number }> = [];
        try {
          const otherConditions = (patientConditions || []).filter(
            (cond) => cond && cond.toLowerCase() !== String(c.condition || '').toLowerCase(),
          );
          if (otherConditions.length > 0) {
            const { data: synTriplets } = await supabase
              .from('triplet_extractions')
              .select('predicate, object_name, study_id, extraction_confidence')
              .ilike('subject_name', `%${c.name}%`)
              .in('predicate', TREATMENT_PREDICATES)
              .eq('curation_status', 'approved')
              .limit(50);
            const map: Record<string, { predicate: string; condition: string; studyIds: Set<string> }> = {};
            for (const st of synTriplets || []) {
              const obj = String(st.object_name || '');
              if (!obj) continue;
              const matched = otherConditions.find(
                (cond) => obj.toLowerCase().includes(cond.toLowerCase()) || cond.toLowerCase().includes(obj.toLowerCase()),
              );
              if (!matched) continue;
              const key = `${matched.toLowerCase()}::${st.predicate}`;
              if (!map[key]) map[key] = { predicate: String(st.predicate), condition: matched, studyIds: new Set() };
              if (st.study_id) map[key].studyIds.add(st.study_id);
            }
            synergies = Object.values(map).map((s) => ({
              condition: s.condition,
              predicate: s.predicate,
              studyCount: s.studyIds.size,
            }));
          }
        } catch (e) {
          // synergies are optional
        }

        // Fallback: if no paired (compound, condition) approved triplet exists,
        // surface up to 3 high-confidence studies that mention the compound
        // alone (any condition) so the vet still has clickable references.
        let provenance: 'paired' | 'compound-only' = 'paired';
        let effectiveStudyIds = studyIds;
        if (effectiveStudyIds.length === 0) {
          try {
            const { data: fallbackTriplets } = await supabase
              .from('triplet_extractions')
              .select('study_id, extraction_confidence')
              .ilike('subject_name', `%${c.name}%`)
              .in('predicate', TREATMENT_PREDICATES)
              .eq('curation_status', 'approved')
              .order('extraction_confidence', { ascending: false })
              .limit(20);
            const ids = Array.from(
              new Set((fallbackTriplets || []).map((t: any) => t.study_id).filter(Boolean))
            ).slice(0, MAX_STUDIES_PER_COMPOUND);
            if (ids.length > 0) {
              effectiveStudyIds = ids;
              provenance = 'compound-only';
            }
          } catch (e) {
            // fallback is best-effort
          }
        }

        if (effectiveStudyIds.length === 0) {
          return { ...c, studies: [], mechanism, kgTriplets, synergies };
        }

        const { data: studies } = await supabase
          .from('scientific_studies')
          .select('id, title, title_en, year, doi, pmid, link')
          .in('id', effectiveStudyIds);

        // For each study, fetch a single relevant chunk that contains the compound name.
        // Prefer chunks that also contain the condition. Cap text to ~280 chars.
        const studiesWithExcerpts = await Promise.all(
          (studies || []).map(async (s: any) => {
            let excerpt: string | null = null;
            try {
              const { data: chunks } = await supabase
                .from('study_embeddings')
                .select('chunk_text')
                .eq('study_id', s.id)
                .ilike('chunk_text', `%${c.name}%`)
                .limit(5);

              if (chunks && chunks.length > 0) {
                // Prefer one that also mentions the condition
                const condLower = String(c.condition || '').toLowerCase();
                const best =
                  chunks.find((ch: any) =>
                    ch.chunk_text?.toLowerCase().includes(condLower)
                  ) || chunks[0];
                const text = String(best.chunk_text || '');
                const idx = text.toLowerCase().indexOf(String(c.name).toLowerCase());
                if (idx >= 0) {
                  const start = Math.max(0, idx - 100);
                  const end = Math.min(text.length, idx + c.name.length + 180);
                  excerpt = (start > 0 ? '…' : '') + text.slice(start, end).trim() + (end < text.length ? '…' : '');
                } else {
                  excerpt = text.slice(0, 280) + (text.length > 280 ? '…' : '');
                }
              }
            } catch (e) {
              // ignore — excerpt is optional
            }
            const title = s.title || s.title_en;
            const resolvedLink = buildStudyLink({ link: s.link, doi: s.doi, pmid: s.pmid, title });
            return {
              id: s.id,
              title,
              year: s.year,
              doi: s.doi,
              pmid: s.pmid,
              link: resolvedLink,
              excerpt,
              provenance,
            };
          })
        );

        return {
          ...c,
          mechanism,
          studies: studiesWithExcerpts,
          kgTriplets,
          synergies,
        };
      } catch (err) {
        console.warn(`[attachStudiesToCompounds] Failed for ${c.name}:`, err);
        return { ...c, studies: [], kgTriplets: [], synergies: [] };
      }
    })
  );

  return enriched;
}
