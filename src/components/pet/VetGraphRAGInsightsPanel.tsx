import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { AlertCircle, Dna, Shield, ChevronDown, ChevronRight, Activity, Zap, Brain } from 'lucide-react';
import type { ClinicalDiscovery, BreedPredisposition, LabAlert } from '@/services/clinical-analysis-pipeline';
import { localizeConditionName } from '@/services/condition-name-localizer';

/**
 * Rótulos de processos biológicos de envelhecimento (gerociência).
 * NUNCA devem aparecer como "Condição Clínica Atual Confirmada" — são
 * detratores geriátricos ocultos, mesmo que dados legados os tenham
 * cadastrado em pet_conditions.
 */
const GEROSCIENCE_PROCESSES = [
  'Cellular Senescence',
  'Inflammaging',
  'Oxidative Stress',
  'Mitochondrial Dysfunction',
];

const isGeroscienceProcess = (name: string): boolean => {
  const n = (name || '').toLowerCase();
  return GEROSCIENCE_PROCESSES.some(p => n.includes(p.toLowerCase()));
};

/**
 * Heurística clínica: dispara um detrator geriátrico oculto quando há
 * "porta de entrada" no quadro do paciente (condição clínica âncora ou
 * idade avançada), mesmo sem triplets explícitos no KG. Reflete consenso
 * da literatura geroscience (López-Otín hallmarks, Franceschi inflammaging).
 */
export const inferGeroscienceTriggers = (
  conditions: any[],
  ageYears: number,
): Record<string, string[]> => {
  const triggers: Record<string, string[]> = {
    'Cellular Senescence': [],
    'Inflammaging': [],
    'Oxidative Stress': [],
    'Mitochondrial Dysfunction': [],
  };
  const condNames = conditions.map(c => (c.condition_name || '').toLowerCase());
  const has = (kw: string) => condNames.some(n => n.includes(kw));

  if (has('osteoarthritis') || has('hip dysplasia') || has('sarcopenia')) {
    triggers['Cellular Senescence'].push('Osteoartrite/displasia/sarcopenia → acúmulo de células senescentes em cartilagem e músculo');
  }
  if (has('chronic inflammation') || has('inflamm') || has('osteoarthritis') || has('obesity')) {
    triggers['Inflammaging'].push('Inflamação sistêmica de baixo grau associada ao quadro clínico');
  }
  if (has('chronic kidney') || has('mmvd') || has('mitral') || has('cognitive')) {
    triggers['Oxidative Stress'].push('Doença crônica órgão-alvo aumenta carga oxidativa');
  }
  if (has('cognitive') || has('myelopathy') || has('sarcopenia')) {
    triggers['Mitochondrial Dysfunction'].push('Tecidos pós-mitóticos (neurônio, músculo) afetados → disfunção mitocondrial provável');
  }

  // Idade > 7 anos em cães (senior): senescência e inflammaging são pano de fundo.
  if (ageYears >= 7) {
    triggers['Cellular Senescence'].push(`Idade ${ageYears}a (faixa sênior): acúmulo basal de células senescentes`);
    triggers['Inflammaging'].push(`Idade ${ageYears}a: estado inflamatório basal aumentado`);
  }
  return triggers;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type TFunc = (...args: any[]) => any;

interface ClassifiedInsight {
  category: 'current' | 'hidden_comorbidity' | 'future_prevention';
  title: string;
  description: string;
  inferenceReason?: string;
  confidence?: number;
  severity?: string;
  relatedEntities?: string[];
  source: 'condition' | 'discovery' | 'predisposition' | 'kg_inference';
}

interface VetGraphRAGInsightsPanelProps {
  conditions: any[];
  clinicalDiscoveries: ClinicalDiscovery[];
  predispositions: BreedPredisposition[];
  labAlerts: LabAlert[];
  kgTriplets: any[];
  kgPathways: any[];
  breed: string;
  ageYears: number;
}

function classifyInsights(
  conditions: any[],
  discoveries: ClinicalDiscovery[],
  predispositions: BreedPredisposition[],
  kgTriplets: any[],
  kgPathways: any[],
  locale: string,
  t: TFunc,
  ageYears: number,
): ClassifiedInsight[] {
  const insights: ClassifiedInsight[] = [];

  // 1. Current conditions — enriched with KG data.
  //    Rótulos de gerociência (Inflammaging, Cellular Senescence, ...) são
  //    SEMPRE redirigidos para "Detratores Geriátricos Ocultos" — nunca
  //    figuram como condição clínica atual.
  const clinicalConditions = conditions.filter(c => !isGeroscienceProcess(c.condition_name || c.name || ''));
  for (const c of clinicalConditions) {
    const rawName = c.condition_name || c.name || '';
    const name = localizeConditionName(rawName, locale);
    const relatedTriplets = kgTriplets.filter(
      tr => tr.object?.toLowerCase().includes(rawName.toLowerCase()) || tr.subject?.toLowerCase().includes(rawName.toLowerCase())
    );
    const pathway = kgPathways.find(p => p.condition?.toLowerCase().includes(rawName.toLowerCase()));

    insights.push({
      category: 'current',
      title: name,
      description: c.notes || t('petProfile.insights.diagnosedCondition', `Diagnosed condition: ${name}`).replace('{{name}}', name),
      confidence: relatedTriplets.length > 0 ? 0.9 : 0.7,
      severity: c.severity || 'moderate',
      relatedEntities: relatedTriplets.slice(0, 3).map((tr: any) => `${tr.subject} ${tr.predicate} ${tr.object}`),
      inferenceReason: pathway
        ? t('petProfile.insights.tripletsWithPathway', '{{count}} triplets in KG, pathway: {{pathway}}')
            .replace('{{count}}', String(relatedTriplets.length))
            .replace('{{pathway}}', pathway.steps?.map((s: any) => s.label).join(' → ') || '')
        : t('petProfile.insights.tripletsFound', '{{count}} triplets found in Knowledge Graph')
            .replace('{{count}}', String(relatedTriplets.length)),
      source: 'condition',
    });
  }

  // 2. Hidden comorbidities from discoveries
  const comorbidityDiscoveries = discoveries.filter(d =>
    d.type === 'lab-condition-correlation' || d.type === 'compound-opportunity'
  );
  for (const d of comorbidityDiscoveries) {
    insights.push({
      category: 'hidden_comorbidity',
      title: d.title,
      description: d.description,
      severity: d.severity,
      relatedEntities: d.relatedEntities,
      inferenceReason: d.type === 'lab-condition-correlation'
        ? t('petProfile.insights.labCorrelation', 'Correlation detected between lab results and clinical conditions via Knowledge Graph')
        : t('petProfile.insights.therapeuticOpportunity', 'Therapeutic opportunity identified by biomarker pattern'),
      source: 'discovery',
    });
  }

  // Geroscience hidden detractors: combine triggers clínicos/idade
  // (heurística sempre ativa) com triplets do KG quando disponíveis.
  const triggers = inferGeroscienceTriggers(conditions, ageYears);
  for (const process of GEROSCIENCE_PROCESSES) {
    const reasons = triggers[process];
    const relatedTriplets = kgTriplets.filter(tr =>
      tr.subject?.toLowerCase().includes(process.toLowerCase()) ||
      tr.object?.toLowerCase().includes(process.toLowerCase())
    );
    // Inclui também o caso em que o processo veio em pet_conditions por engano.
    const cameFromConditions = conditions.some(c =>
      (c.condition_name || '').toLowerCase().includes(process.toLowerCase())
    );
    if (reasons.length === 0 && relatedTriplets.length === 0 && !cameFromConditions) continue;

    const connectedConditions = conditions
      .map((c: any) => c.condition_name)
      .filter((cn: string) => !isGeroscienceProcess(cn) && kgTriplets.some(tr =>
        (tr.subject?.toLowerCase().includes(cn.toLowerCase()) && tr.object?.toLowerCase().includes(process.toLowerCase())) ||
        (tr.object?.toLowerCase().includes(cn.toLowerCase()) && tr.subject?.toLowerCase().includes(process.toLowerCase()))
      ));

    const reasonText = reasons.length > 0
      ? reasons.join(' • ')
      : connectedConditions.length > 0
        ? `Via KG: ${connectedConditions.join(', ')} → ${process} (${relatedTriplets.length} triplets)`
        : `${relatedTriplets.length} ${t('petProfile.insights.kgConnections', 'conexões no Knowledge Graph')}`;

    insights.push({
      category: 'hidden_comorbidity',
      title: process,
      description: connectedConditions.length > 0
        ? t('petProfile.insights.inferredProcessConnected', 'Processo biológico inferido: {{conditions}} compartilham vias moleculares com {{process}} segundo o Knowledge Graph.')
            .replace('{{conditions}}', connectedConditions.map((cn: string) => localizeConditionName(cn, locale)).join(', '))
            .replace('{{process}}', process)
        : t('petProfile.insights.inferredProcessRelevant', "Processo biológico {{process}} identificado como relevante para o perfil deste paciente.")
            .replace('{{process}}', process),
      confidence: Math.min(0.9, 0.55 + reasons.length * 0.1 + relatedTriplets.length * 0.03),
      inferenceReason: reasonText,
      relatedEntities: relatedTriplets.length > 0
        ? relatedTriplets.slice(0, 3).map((tr: any) => `${tr.subject} ${tr.predicate} ${tr.object}`)
        : connectedConditions.slice(0, 3).map((cn: string) => localizeConditionName(cn, locale)),
      source: 'kg_inference',
    });
  }

  // 3. Future prevention from undiagnosed predispositions
  for (const p of predispositions) {
    if (p.already_diagnosed) continue;
    const localName = localizeConditionName(p.condition_name, locale);
    insights.push({
      category: 'future_prevention',
      title: localName,
      description: t('petProfile.insights.breedRiskDesc', 'Common condition in this breed — risk {{factor}}× above average (evidence: {{grade}}).{{notes}} Evaluate preventive strategies via Knowledge Graph.')
        .replace('{{factor}}', String(p.risk_factor))
        .replace('{{grade}}', p.evidence_grade)
        .replace('{{notes}}', p.notes ? ` ${p.notes}` : ''),
      confidence: p.risk_factor > 3 ? 0.8 : 0.6,
      inferenceReason: t('petProfile.insights.breedPredisposition', 'Breed predisposition: risk factor {{factor}}× • evidence {{grade}}')
        .replace('{{factor}}', String(p.risk_factor))
        .replace('{{grade}}', p.evidence_grade),
      relatedEntities: [localName],
      source: 'predisposition',
    });
  }

  // Sort future_prevention by risk_factor (highest first) — already done at fetch level,
  // but ensure stable ordering when mixed with breed-lab discoveries below.

  // Breed-lab confirmation discoveries
  const breedLabDiscoveries = discoveries.filter(d => d.type === 'breed-lab-confirmation');
  for (const d of breedLabDiscoveries) {
    insights.push({
      category: 'future_prevention',
      title: d.title,
      description: d.description,
      severity: d.severity,
      relatedEntities: d.relatedEntities,
      inferenceReason: t('petProfile.insights.breedLabConfirmation', 'Breed predisposition confirmed by lab findings'),
      source: 'discovery',
    });
  }

  return insights;
}

const categoryConfig = {
  current: {
    icon: Activity,
    borderColor: 'border-l-red-500',
    bgColor: 'bg-red-50 dark:bg-red-950/20',
    badgeColor: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  },
  hidden_comorbidity: {
    icon: Dna,
    borderColor: 'border-l-amber-500',
    bgColor: 'bg-amber-50 dark:bg-amber-950/20',
    badgeColor: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
  },
  future_prevention: {
    icon: Shield,
    borderColor: 'border-l-blue-500',
    bgColor: 'bg-blue-50 dark:bg-blue-950/20',
    badgeColor: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  },
};

const VetGraphRAGInsightsPanel: React.FC<VetGraphRAGInsightsPanelProps> = ({
  conditions,
  clinicalDiscoveries,
  predispositions,
  labAlerts,
  kgTriplets,
  kgPathways,
  breed,
  ageYears,
}) => {
  const { t, i18n } = useTranslation();
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    current: true,
    hidden_comorbidity: true,
    future_prevention: true,
  });

  const insights = classifyInsights(conditions, clinicalDiscoveries, predispositions, kgTriplets, kgPathways, i18n.language, t, ageYears);

  const currentInsights = insights.filter(i => i.category === 'current');
  const hiddenInsights = insights.filter(i => i.category === 'hidden_comorbidity');
  const futureInsights = insights.filter(i => i.category === 'future_prevention');

  const sections = [
    {
      key: 'current',
      titleKey: 'petProfile.insights.currentConditions',
      titleFallback: 'Condições Atuais Confirmadas',
      descKey: 'petProfile.insights.currentConditionsDesc',
      descFallback: 'Condições diagnosticadas, enriquecidas com dados do Knowledge Graph',
      items: currentInsights,
      config: categoryConfig.current,
    },
    {
      key: 'hidden_comorbidity',
      titleKey: 'petProfile.insights.hiddenComorbidities',
      titleFallback: 'Detratores Geriátricos Ocultos',
      descKey: 'petProfile.insights.hiddenComorbiditiesDesc',
      descFallback: 'Processos moleculares de envelhecimento (senescência celular, inflammaging) inferidos pelo Knowledge Graph — aceleram doenças e reduzem healthspan.',
      items: hiddenInsights,
      config: categoryConfig.hidden_comorbidity,
    },
    {
      key: 'future_prevention',
      titleKey: 'petProfile.insights.preventionTargets',
      titleFallback: 'Alvos para Prevenção',
      descKey: 'petProfile.insights.preventionTargetsDesc',
      descFallback: 'Doenças comuns à raça e idade — estratégias de prevenção sugeridas pelo Knowledge Graph',
      items: futureInsights,
      config: categoryConfig.future_prevention,
    },
  ];

  return (
    <Card className="border-2 border-primary/20">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Brain className="h-5 w-5 text-primary" />
          {t('petProfile.insights.title', 'Análise Senex AI')}
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          {t('petProfile.insights.subtitle', 'Inteligência clínica gerada pelo Knowledge Graph — separada dos dados do prontuário')}
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {sections.map(section => {
          const Icon = section.config.icon;
          const isExpanded = expandedSections[section.key] !== false;

          return (
            <Collapsible
              key={section.key}
              open={isExpanded}
              onOpenChange={(open) => setExpandedSections(prev => ({ ...prev, [section.key]: open }))}
            >
              <CollapsibleTrigger className="w-full">
                <div className={`flex items-center justify-between p-3 rounded-lg ${section.config.bgColor} hover:opacity-90 transition-opacity`}>
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4" />
                    <span className="font-semibold text-sm">
                      {t(section.titleKey, section.titleFallback)}
                    </span>
                    <Badge variant="outline" className={`text-xs ${section.config.badgeColor}`}>
                      {section.items.length}
                    </Badge>
                  </div>
                  {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent>
                {section.items.length === 0 ? (
                  <p className="text-xs text-muted-foreground py-2 px-3">
                    {t('petProfile.insights.noItems', 'Nenhum item identificado nesta categoria.')}
                  </p>
                ) : (
                  <div className="space-y-2 mt-2">
                    {section.items.map((item, idx) => (
                      <div
                        key={idx}
                        className={`border-l-4 ${section.config.borderColor} rounded-r-lg p-3 bg-card shadow-sm`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-medium text-sm">{item.title}</h4>
                          {item.confidence && (
                            <Badge variant="outline" className="text-[10px] shrink-0">
                              {Math.round(item.confidence * 100)}%
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">{item.description}</p>
                        {item.inferenceReason && (
                          <div className="mt-2 flex items-start gap-1.5 text-[11px] text-muted-foreground/80 bg-muted/50 rounded px-2 py-1">
                            <Zap className="h-3 w-3 mt-0.5 shrink-0 text-amber-500" />
                            <span>{item.inferenceReason}</span>
                          </div>
                        )}
                        {item.relatedEntities && item.relatedEntities.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {item.relatedEntities.map((entity, eIdx) => (
                              <Badge key={eIdx} variant="secondary" className="text-[10px] font-normal">
                                {entity}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CollapsibleContent>
            </Collapsible>
          );
        })}
      </CardContent>
    </Card>
  );
};

export default VetGraphRAGInsightsPanel;
