import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Network, GitBranch, Sparkles } from 'lucide-react';
import NetworkGraph from '@/components/administrador/visualizations/NetworkGraph';
import { usePatientPendingGapFillTriplets } from '@/hooks/useKgEvidenceGapFill';

interface PatientKnowledgeSubgraphProps {
  kgTriplets: any[];
  kgPathways: any[];
  conditions: string[];
  recommendedCompounds: string[];
  /** Pet UUID — when present, the component fetches pending gap-fill triplets
   *  for this pet and renders them as provisional (dashed amber) edges so vets
   *  can see which evidence was just imported but is still awaiting curation. */
  petId?: string | null;
  /** Pet identity (Phase 1 — Digital Twin core node).
   *  When present, renders a central Pet node with HAS_CONDITION edges. */
  petProfile?: {
    name?: string;
    breed?: string;
    age_years?: number;
    weight_kg?: number;
    sex?: string;
    neutered?: boolean;
  } | null;
  /** Active medications from pet_medications. Rendered as purple "pill" nodes
   *  connected to Pet via TAKES, plus red INTERACTS_WITH edges to recommended
   *  compounds when an interaction alert exists. */
  activeMedications?: Array<{ medication_name: string; dosage?: string | null }>;
  /** Interaction alerts (compound × medication) used to draw red edges. */
  interactionAlerts?: Array<{ compound?: string; medication?: string; severity?: string; description?: string }>;
  /** Hidden geriatric detractors (e.g. cellular senescence, inflammaging).
   *  Rendered as amber outlined diamonds connected via EXHIBITS_DETRACTOR. */
  hiddenDetractors?: string[];
  /** Phase 2 — Past diagnoses (resolved conditions or older consultations).
   *  Rendered as grey circles connected via HAS_HISTORY (dashed grey). */
  pastDiagnoses?: Array<{ name: string; date?: string | null }>;
  /** Phase 2 — Traits (breed, age class, sex). Rendered as light-blue hexagons
   *  connected via HAS_TRAIT. Breed traits also draw BREED_RISK_FOR edges
   *  toward predisposed conditions. */
  traits?: Array<{ label: string; type: 'breed' | 'age_class' | 'sex'; predisposes?: string[] }>;
  /** Phase 2 — Abnormal lab results from pet_exams / labAlerts.
   *  Rendered as yellow inverted-triangles connected to Pet via PRESENTS_LAB,
   *  and to inferred conditions via INDICATES (dashed yellow). */
  abnormalLabs?: Array<{ test_name: string; status?: string; value?: number | null; unit?: string | null; indicates?: string[] }>;
  /** Phase 4 — KG projections per condition. Used to render projected milestone
   *  nodes (90d/180d/365d) connected to each active condition via
   *  EXPECTED_IMPROVEMENT (dashed teal). Only conditions with a positive
   *  `projectedImprovement` produce milestones. */
  kgProjections?: Array<{
    condition: string;
    baselineScore?: number;
    projectedImprovement?: number;
    confidenceLevel?: string;
  }>;
}

// Color palette for node types
const NODE_COLORS: Record<string, { background: string; border: string }> = {
  compound: { background: '#22c55e', border: '#16a34a' },
  condition: { background: '#f97316', border: '#ea580c' },
  mechanism: { background: '#3b82f6', border: '#2563eb' },
  effect: { background: '#8b5cf6', border: '#7c3aed' },
  outcome: { background: '#06b6d4', border: '#0891b2' },
  pet: { background: '#1e3a8a', border: '#1e40af' },
  medication: { background: '#a855f7', border: '#7e22ce' },
  detractor: { background: '#fef3c7', border: '#b45309' },
  past_diagnosis: { background: '#cbd5e1', border: '#64748b' },
  trait: { background: '#bfdbfe', border: '#3b82f6' },
  lab: { background: '#fef08a', border: '#ca8a04' },
  milestone: { background: '#99f6e4', border: '#0f766e' },
};

const PatientKnowledgeSubgraph: React.FC<PatientKnowledgeSubgraphProps> = ({
  kgTriplets,
  kgPathways,
  conditions,
  recommendedCompounds,
  petId,
  petProfile,
  activeMedications = [],
  interactionAlerts = [],
  hiddenDetractors = [],
  pastDiagnoses = [],
  traits = [],
  abnormalLabs = [],
  kgProjections = [],
}) => {
  const { t } = useTranslation();
  // Phase 4 — toggle between full Digital Twin (default) and pure-evidence mode.
  const [digitalTwinMode, setDigitalTwinMode] = useState(true);

  // Pull pending triplets created by gap-fill that touch this pet's stack/conditions.
  const { data: pendingProvisional = [] } = usePatientPendingGapFillTriplets(
    petId,
    recommendedCompounds,
    conditions,
    !!petId,
  );

  const graphData = useMemo(() => {
    const nodeMap = new Map<string, any>();
    const links: any[] = [];

    // Helper to add node
    const addNode = (name: string, type: string) => {
      const key = name.toLowerCase().trim();
      if (!key || nodeMap.has(key)) return key;
      nodeMap.set(key, {
        id: key,
        label: name.length > 25 ? name.slice(0, 22) + '...' : name,
        title: name,
        group: type,
        shape:
          type === 'pet' ? 'star' :
          type === 'medication' ? 'box' :
          type === 'detractor' ? 'diamond' :
          type === 'compound' ? 'dot' :
          type === 'condition' ? 'diamond' :
        type === 'past_diagnosis' ? 'dot' :
        type === 'trait' ? 'hexagon' :
        type === 'lab' ? 'triangleDown' :
        type === 'milestone' ? 'diamond' :
          type === 'mechanism' ? 'triangle' : 'dot',
        color: NODE_COLORS[type] || NODE_COLORS.effect,
        value:
          type === 'pet' ? 32 :
          type === 'compound' ? 20 :
          type === 'condition' ? 18 :
          type === 'medication' ? 16 :
        type === 'detractor' ? 16 :
        type === 'past_diagnosis' ? 12 :
        type === 'trait' ? 14 :
        type === 'lab' ? 14 :
        type === 'milestone' ? 12 : 12,
      });
      return key;
    };

    // ── Phase 1: Pet central node (Digital Twin core) ─────────────────────
    let petKey: string | null = null;
    if (digitalTwinMode && petProfile?.name) {
      const traits: string[] = [];
      if (petProfile.breed) traits.push(petProfile.breed);
      if (typeof petProfile.age_years === 'number') traits.push(`${petProfile.age_years}a`);
      if (typeof petProfile.weight_kg === 'number') traits.push(`${petProfile.weight_kg}kg`);
      if (petProfile.sex) traits.push(petProfile.sex === 'female' ? '♀' : '♂');
      const label = `🐾 ${petProfile.name}`;
      petKey = label.toLowerCase().trim();
      nodeMap.set(petKey, {
        id: petKey,
        label,
        title: `${petProfile.name} · ${traits.join(' · ')}`,
        group: 'pet',
        shape: 'star',
        color: NODE_COLORS.pet,
        value: 32,
        font: { color: '#ffffff', size: 14, face: 'Inter, system-ui, sans-serif' },
      });
    }

    // Add conditions
    for (const c of conditions) {
      addNode(c, 'condition');
    }

    // Add compounds
    for (const c of recommendedCompounds) {
      addNode(c, 'compound');
    }

    // ── Pet → conditions (HAS_CONDITION) ──────────────────────────────────
    if (petKey) {
      for (const c of conditions) {
        const k = c.toLowerCase().trim();
        if (!k || !nodeMap.has(k)) continue;
        links.push({
          from: petKey,
          to: k,
          label: 'tem',
          title: `${petProfile?.name} HAS_CONDITION ${c}`,
          arrows: 'to',
          color: '#f97316',
          width: 2.5,
        });
      }
    }

    // ── Hidden geriatric detractors (EXHIBITS_DETRACTOR) ──────────────────
    for (const d of (digitalTwinMode ? hiddenDetractors : [])) {
      const k = addNode(d, 'detractor');
      if (petKey) {
        links.push({
          from: petKey,
          to: k,
          label: 'apresenta',
          title: `${petProfile?.name} EXHIBITS_DETRACTOR ${d}`,
          arrows: 'to',
          color: '#b45309',
          width: 2,
          dashes: false,
        });
      }
    }

    // ── Active medications (TAKES) ────────────────────────────────────────
    const medKeys = new Map<string, string>(); // canonical lower → node key
    for (const med of (digitalTwinMode ? activeMedications : [])) {
      const name = med.medication_name?.trim();
      if (!name) continue;
      const display = med.dosage ? `💊 ${name} (${med.dosage})` : `💊 ${name}`;
      const k = addNode(display, 'medication');
      medKeys.set(name.toLowerCase(), k);
      if (petKey) {
        links.push({
          from: petKey,
          to: k,
          label: 'toma',
          title: `${petProfile?.name} TAKES ${name}`,
          arrows: 'to',
          color: '#a855f7',
          width: 2,
        });
      }
    }

    // ── Drug × compound interactions (INTERACTS_WITH, red alert) ─────────
    for (const alert of (digitalTwinMode ? interactionAlerts : [])) {
      const compoundName = (alert.compound || '').toLowerCase().trim();
      const medName = (alert.medication || '').toLowerCase().trim();
      if (!compoundName || !medName) continue;
      const compoundKey = compoundName; // already lowercased keys
      const medKey = medKeys.get(medName);
      if (!nodeMap.has(compoundKey) || !medKey) continue;
      links.push({
        from: compoundKey,
        to: medKey,
        label: '⚠ interage',
        title: `INTERACTS_WITH${alert.severity ? ` (${alert.severity})` : ''}${alert.description ? ` — ${alert.description}` : ''}`,
        arrows: 'to;from',
        color: '#ef4444',
        width: 3,
        dashes: false,
      });
    }

    // ── Phase 2: Past diagnoses (HAS_HISTORY) ────────────────────────────
    for (const dx of (digitalTwinMode ? pastDiagnoses : [])) {
      const name = dx?.name?.trim();
      if (!name) continue;
      const label = dx.date ? `${name} (${dx.date.slice(0, 7)})` : name;
      const k = addNode(label, 'past_diagnosis');
      if (petKey) {
        links.push({
          from: petKey,
          to: k,
          label: 'histórico',
          title: `${petProfile?.name} HAS_HISTORY ${name}${dx.date ? ` · ${dx.date}` : ''}`,
          arrows: 'to',
          color: '#94a3b8',
          width: 1.5,
          dashes: [4, 4],
        });
      }
    }

    // ── Phase 2: Traits (HAS_TRAIT) + BREED_RISK_FOR ─────────────────────
    const traitKeys = new Map<string, string>();
    for (const tr of (digitalTwinMode ? traits : [])) {
      const label = tr?.label?.trim();
      if (!label) continue;
      const k = addNode(label, 'trait');
      traitKeys.set(`${tr.type}:${label.toLowerCase()}`, k);
      if (petKey) {
        links.push({
          from: petKey,
          to: k,
          label: tr.type === 'breed' ? 'raça' : tr.type === 'age_class' ? 'faixa etária' : 'sexo',
          title: `${petProfile?.name} HAS_TRAIT ${label} (${tr.type})`,
          arrows: 'to',
          color: '#3b82f6',
          width: 1.5,
        });
      }
      // Breed → conditions (BREED_RISK_FOR)
      if (tr.type === 'breed' && Array.isArray(tr.predisposes)) {
        for (const cond of tr.predisposes) {
          const ck = cond.toLowerCase().trim();
          if (!ck || !nodeMap.has(ck)) continue;
          links.push({
            from: k,
            to: ck,
            label: 'predispõe',
            title: `${label} BREED_RISK_FOR ${cond}`,
            arrows: 'to',
            color: '#1e40af',
            width: 1.5,
            dashes: [4, 4],
          });
        }
      }
    }

    // ── Phase 2: Abnormal labs (PRESENTS_LAB / INDICATES) ────────────────
    for (const lab of (digitalTwinMode ? abnormalLabs : [])) {
      const name = lab?.test_name?.trim();
      if (!name) continue;
      const valueLabel = (lab.value != null && lab.unit) ? ` ${lab.value}${lab.unit}` : '';
      const arrow = lab.status === 'high' || lab.status === 'critical_high' ? '↑'
                  : lab.status === 'low' || lab.status === 'critical_low' ? '↓' : '';
      const display = `🧪 ${name}${valueLabel}${arrow ? ' ' + arrow : ''}`;
      const k = addNode(display, 'lab');
      if (petKey) {
        links.push({
          from: petKey,
          to: k,
          label: 'exame',
          title: `${petProfile?.name} PRESENTS_LAB ${name}${valueLabel} (${lab.status || 'abnormal'})`,
          arrows: 'to',
          color: '#ca8a04',
          width: 2,
        });
      }
      // INDICATES → conditions
      for (const cond of (lab.indicates || [])) {
        const ck = cond.toLowerCase().trim();
        if (!ck || !nodeMap.has(ck)) continue;
        links.push({
          from: k,
          to: ck,
          label: 'indica',
          title: `${name} INDICATES ${cond}`,
          arrows: 'to',
          color: '#ca8a04',
          width: 1.5,
          dashes: [3, 3],
        });
      }
    }

    // Add triplet edges
    const seenEdges = new Set<string>();
    const compoundSet = new Set(recommendedCompounds.map(c => c.toLowerCase().trim()));
    const conditionSet = new Set(conditions.map(c => c.toLowerCase().trim()));
    let justifiedCount = 0;
    for (const trip of kgTriplets) {
      const subjectKey = addNode(trip.subject, guessNodeType(trip.subject, conditions, recommendedCompounds));
      const objectKey = addNode(trip.object, guessNodeType(trip.object, conditions, recommendedCompounds));
      const edgeKey = `${subjectKey}-${trip.predicate}-${objectKey}`;
      if (seenEdges.has(edgeKey)) continue;
      seenEdges.add(edgeKey);

      const predLabel = trip.predicate?.replace(/_/g, ' ') || '';
      // Phase 3 — JUSTIFIED_BY: if this triplet links a recommended compound to
      // an active condition with a positive predicate, visually upgrade it as
      // explicit provenance for the recommendation.
      const isPositive = ['TREATS', 'PREVENTS', 'SUPPORTS', 'IMPROVES', 'MODULATES'].includes(trip.predicate);
      const justifies = isPositive
        && compoundSet.has(String(trip.subject || '').toLowerCase().trim())
        && conditionSet.has(String(trip.object || '').toLowerCase().trim());
      if (justifies) justifiedCount += 1;
      links.push({
        from: subjectKey,
        to: objectKey,
        label: justifies
          ? `✓ ${t('petProfile.subgraph.justifiedBy', 'justifica')}`
          : (predLabel.length > 15 ? predLabel.slice(0, 12) + '...' : predLabel),
        title: justifies
          ? `JUSTIFIED_BY · ${trip.subject} ${trip.predicate} ${trip.object}` +
            (trip.confidence ? ` (conf ${(trip.confidence * 100).toFixed(0)}%)` : '')
          : `${trip.subject} ${trip.predicate} ${trip.object}`,
        arrows: 'to',
        color: justifies ? '#15803d'
               : trip.predicate === 'TREATS' || trip.predicate === 'PREVENTS' ? '#22c55e'
               : trip.predicate === 'CONTRAINDICATES' || trip.predicate === 'AGGRAVATES' ? '#ef4444'
               : '#94a3b8',
        width: justifies
          ? Math.max(3.5, (trip.confidence || 0.7) * 5)
          : (trip.confidence ? Math.max(1, trip.confidence * 3) : 2),
        ...(justifies ? { shadow: { enabled: true, color: 'rgba(21,128,61,0.35)', size: 6 } } : {}),
      });
    }
    // Stash count for legend/footer.
    (links as any).__justifiedCount = justifiedCount;

    // ── Phase 4: Projected milestones (EXPECTED_IMPROVEMENT) ─────────────
    let milestoneCount = 0;
    if (digitalTwinMode) {
      // Sigmoid-ish progression: 30% by 90d, 65% by 180d, 100% by 365d.
      const STAGES: Array<{ key: string; label: string; pct: number }> = [
        { key: '90d', label: '90d', pct: 0.30 },
        { key: '180d', label: '180d', pct: 0.65 },
        { key: '365d', label: '365d', pct: 1.00 },
      ];
      for (const proj of kgProjections) {
        const condName = String(proj?.condition || '').trim();
        const condKey = condName.toLowerCase();
        if (!condName || !nodeMap.has(condKey)) continue;
        const target = Number(proj.projectedImprovement || 0);
        if (!(target > 0)) continue;
        const conf = proj.confidenceLevel || 'medium';
        for (const stage of STAGES) {
          const delta = Math.round(target * stage.pct);
          const display = `🎯 ${condName.length > 18 ? condName.slice(0, 16) + '…' : condName} · ${stage.label} (+${delta}%)`;
          const k = addNode(display, 'milestone');
          milestoneCount += 1;
          links.push({
            from: condKey,
            to: k,
            label: `+${delta}%`,
            title: `EXPECTED_IMPROVEMENT · ${condName} → ${stage.label}: +${delta}% (target ${target}%, conf ${conf})`,
            arrows: 'to',
            color: '#0f766e',
            width: 1.5 + stage.pct,
            dashes: [4, 3],
          });
        }
      }
    }
    (links as any).__milestoneCount = milestoneCount;

    // Add pathway steps as mechanism nodes
    for (const pathway of kgPathways) {
      const steps = pathway.steps || [];
      for (let i = 0; i < steps.length - 1; i++) {
        const fromKey = addNode(steps[i].label, steps[i].type || 'mechanism');
        const toKey = addNode(steps[i + 1].label, steps[i + 1].type || 'mechanism');
        const edgeKey = `${fromKey}-${steps[i + 1].predicate || 'connects'}-${toKey}`;
        if (seenEdges.has(edgeKey)) continue;
        seenEdges.add(edgeKey);
        links.push({
          from: fromKey,
          to: toKey,
          label: steps[i + 1].predicate || '',
          arrows: 'to',
          color: '#94a3b8',
          width: 1.5,
          dashes: true,
        });
      }
    }

    // Add provisional gap-fill triplets (Perplexity / PubMed) as dashed amber edges.
    for (const trip of (pendingProvisional || [])) {
      const subject = String(trip.subject_name || '').trim();
      const object = String(trip.object_name || '').trim();
      if (!subject || !object) continue;
      const subjectKey = addNode(subject, guessNodeType(subject, conditions, recommendedCompounds));
      const objectKey = addNode(object, guessNodeType(object, conditions, recommendedCompounds));
      const predLabel = String(trip.predicate || '').replace(/_/g, ' ');
      const edgeKey = `prov-${subjectKey}-${trip.predicate}-${objectKey}`;
      if (seenEdges.has(edgeKey)) continue;
      seenEdges.add(edgeKey);
      const provider = (trip.approval_chain && (trip.approval_chain.source || trip.approval_chain.provider)) || 'gap_fill';
      links.push({
        from: subjectKey,
        to: objectKey,
        label: `⏳ ${predLabel.length > 12 ? predLabel.slice(0, 10) + '…' : predLabel}`,
        title: `[provisional · ${provider}] ${subject} ${trip.predicate} ${object}` +
               (trip.evidence_level ? ` · ${trip.evidence_level}` : ''),
        arrows: 'to',
        color: '#f59e0b', // amber-500
        width: 2,
        dashes: [6, 4],
      });
    }

    return {
      nodes: Array.from(nodeMap.values()),
      links,
    };
  }, [kgTriplets, kgPathways, conditions, recommendedCompounds, pendingProvisional, petProfile, activeMedications, interactionAlerts, hiddenDetractors, pastDiagnoses, traits, abnormalLabs, kgProjections, digitalTwinMode]);

  if (graphData.nodes.length === 0) return null;
  const justifiedCount: number = (graphData.links as any).__justifiedCount || 0;
  const milestoneCount: number = (graphData.links as any).__milestoneCount || 0;

  const customOptions = {
    physics: {
      enabled: true,
      solver: 'barnesHut',
      stabilization: { enabled: true, iterations: 400, fit: true, updateInterval: 25 },
      barnesHut: {
        gravitationalConstant: -28000,
        centralGravity: 0.05,
        springLength: 220,
        springConstant: 0.02,
        damping: 0.3,
        avoidOverlap: 0.6,
      },
      maxVelocity: 40,
      minVelocity: 0.5,
    },
    edges: {
      font: { size: 9, color: '#64748b', strokeWidth: 2, strokeColor: '#ffffff' },
      smooth: { enabled: true, type: 'curvedCW', roundness: 0.2 },
      length: 220,
    },
    nodes: {
      font: { size: 12, face: 'Inter, system-ui, sans-serif' },
      borderWidth: 2,
      shadow: { enabled: true, color: 'rgba(0,0,0,0.15)', size: 4 },
    },
    interaction: {
      hover: true,
      zoomView: true,
      dragView: true,
      navigationButtons: false,
    },
    layout: {
      improvedLayout: true,
    },
    groups: {
      compound: { color: NODE_COLORS.compound, shape: 'dot', size: 18 },
      condition: { color: NODE_COLORS.condition, shape: 'diamond', size: 16 },
      mechanism: { color: NODE_COLORS.mechanism, shape: 'triangle', size: 14 },
      effect: { color: NODE_COLORS.effect, shape: 'dot', size: 12 },
      outcome: { color: NODE_COLORS.outcome, shape: 'dot', size: 14 },
        pet: { color: NODE_COLORS.pet, shape: 'star', size: 26 },
        medication: { color: NODE_COLORS.medication, shape: 'box', size: 16 },
        detractor: { color: NODE_COLORS.detractor, shape: 'diamond', size: 14 },
      past_diagnosis: { color: NODE_COLORS.past_diagnosis, shape: 'dot', size: 12 },
      trait: { color: NODE_COLORS.trait, shape: 'hexagon', size: 14 },
      lab: { color: NODE_COLORS.lab, shape: 'triangleDown', size: 14 },
      milestone: { color: NODE_COLORS.milestone, shape: 'diamond', size: 12 },
    },
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Network className="h-4 w-4 text-primary" />
          {t('petProfile.subgraph.title', 'Subgrafo do Paciente')}
          <Badge variant="outline" className="ml-1 text-[10px]">
            {digitalTwinMode
              ? t('petProfile.subgraph.modeDigitalTwin', 'Digital Twin')
              : t('petProfile.subgraph.modeEvidence', 'Evidência pura')}
          </Badge>
          {pendingProvisional.length > 0 && (
            <Badge variant="outline" className="ml-2 border-amber-400 bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 text-[10px]">
              <Sparkles className="h-3 w-3 mr-0.5" />
              {t('petProfile.subgraph.provisionalBadge', { count: pendingProvisional.length, defaultValue: '+{{count}} provisórios' })}
            </Badge>
          )}
          <div className="ml-auto flex items-center gap-2">
            <Switch
              id="digital-twin-toggle"
              checked={digitalTwinMode}
              onCheckedChange={setDigitalTwinMode}
            />
            <Label htmlFor="digital-twin-toggle" className="text-[11px] text-muted-foreground cursor-pointer">
              {t('petProfile.subgraph.toggleDigitalTwin', 'Digital Twin')}
            </Label>
          </div>
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          {digitalTwinMode
            ? t('petProfile.subgraph.descriptionDigitalTwin', 'Digital Twin clínico: paciente, histórico, traits, exames, medicações e projeções temporais conectados às evidências do KG.')
            : t('petProfile.subgraph.description', 'Fragmento do Knowledge Graph utilizado nas recomendações deste paciente')}
        </p>
        <div className="flex flex-wrap gap-2 mt-2">
          {Object.entries(NODE_COLORS).map(([type, colors]) => (
            <div key={type} className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: colors.background }} />
              <span className="text-[10px] text-muted-foreground capitalize">
                {t(`petProfile.subgraph.nodeType.${type}`, type)}
              </span>
            </div>
          ))}
          {justifiedCount > 0 && (
            <div className="flex items-center gap-1 ml-2 pl-2 border-l">
              <span
                className="inline-block"
                style={{ width: 18, height: 0, borderTop: '3px solid #15803d' }}
              />
              <span className="text-[10px] text-emerald-700 dark:text-emerald-400">
                {t('petProfile.subgraph.justifiedLegend', 'JUSTIFIED_BY (proveniência da recomendação)')}
              </span>
            </div>
          )}
          {milestoneCount > 0 && (
            <div className="flex items-center gap-1 ml-2 pl-2 border-l">
              <span
                className="inline-block"
                style={{ width: 18, height: 0, borderTop: '2px dashed #0f766e' }}
              />
              <span className="text-[10px] text-teal-700 dark:text-teal-400">
                {t('petProfile.subgraph.milestoneLegend', 'EXPECTED_IMPROVEMENT (projeções 90/180/365d)')}
              </span>
            </div>
          )}
          {pendingProvisional.length > 0 && (
            <div className="flex items-center gap-1 ml-2 pl-2 border-l">
              <span
                className="inline-block"
                style={{ width: 18, height: 0, borderTop: '2px dashed #f59e0b' }}
              />
              <span className="text-[10px] text-amber-700 dark:text-amber-400">
                {t('petProfile.subgraph.provisionalLegend', 'aresta provisória (gap-fill, aguardando curadoria)')}
              </span>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <NetworkGraph
          data={graphData}
          height="400px"
          showControls={true}
          customOptions={customOptions}
        />
        <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
          <span>{graphData.nodes.length} {t('petProfile.subgraph.nodes', 'nós')}</span>
          <span>{graphData.links.length} {t('petProfile.subgraph.edges', 'conexões')}</span>
          <span>{kgTriplets.length} {t('petProfile.subgraph.triplets', 'triplets')}</span>
          {justifiedCount > 0 && (
            <span className="text-emerald-700 dark:text-emerald-400">
              ✓ {justifiedCount} {t('petProfile.subgraph.justifiedCount', 'arestas JUSTIFIED_BY')}
            </span>
          )}
          {pendingProvisional.length > 0 && (
            <span className="text-amber-700 dark:text-amber-400">
              ⏳ {pendingProvisional.length} {t('petProfile.subgraph.provisionalCount', 'provisórios')}
            </span>
          )}
          {milestoneCount > 0 && (
            <span className="text-teal-700 dark:text-teal-400">
              🎯 {milestoneCount} {t('petProfile.subgraph.milestoneCount', 'marcos projetados')}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

// Guess node type based on name matching
function guessNodeType(name: string, conditions: string[], compounds: string[]): string {
  const lower = name.toLowerCase();
  if (conditions.some(c => c.toLowerCase() === lower)) return 'condition';
  if (compounds.some(c => c.toLowerCase() === lower)) return 'compound';
  const mechKeywords = ['pathway', 'nf-kb', 'cox', 'receptor', 'enzyme', 'kinase', 'inhibit', 'modula'];
  if (mechKeywords.some(k => lower.includes(k))) return 'mechanism';
  return 'effect';
}

export default PatientKnowledgeSubgraph;
