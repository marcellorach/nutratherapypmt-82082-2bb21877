import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { AlertCircle, Dna, Shield, ChevronDown, ChevronRight, Activity, Zap, Brain } from 'lucide-react';
import type { ClinicalDiscovery, BreedPredisposition, LabAlert } from '@/services/clinical-analysis-pipeline';

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
): ClassifiedInsight[] {
  const insights: ClassifiedInsight[] = [];

  // 1. Current conditions — enriched with KG data
  for (const c of conditions) {
    const name = c.condition_name || c.name || '';
    const relatedTriplets = kgTriplets.filter(
      t => t.object?.toLowerCase().includes(name.toLowerCase()) || t.subject?.toLowerCase().includes(name.toLowerCase())
    );
    const pathway = kgPathways.find(p => p.condition?.toLowerCase().includes(name.toLowerCase()));

    insights.push({
      category: 'current',
      title: name,
      description: c.notes || `Condição diagnosticada: ${name}`,
      confidence: relatedTriplets.length > 0 ? 0.9 : 0.7,
      severity: c.severity || 'moderate',
      relatedEntities: relatedTriplets.slice(0, 3).map((t: any) => `${t.subject} ${t.predicate} ${t.object}`),
      inferenceReason: pathway
        ? `${relatedTriplets.length} triplets no KG, pathway: ${pathway.steps?.map((s: any) => s.label).join(' → ')}`
        : `${relatedTriplets.length} triplets encontrados no Knowledge Graph`,
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
        ? 'Correlação detectada entre exames laboratoriais e condições clínicas via Knowledge Graph'
        : 'Oportunidade terapêutica identificada por padrão de biomarcadores',
      source: 'discovery',
    });
  }

  // Infer biological processes from KG pathways (these are NOT clinical diagnoses)
  const biologicalProcesses = ['Cellular Senescence', 'Inflammaging', 'Oxidative Stress', 'Mitochondrial Dysfunction'];
  const conditionNamesLower = conditions.map((c: any) => (c.condition_name || '').toLowerCase());
  for (const process of biologicalProcesses) {
    // Skip if already present as a condition (legacy data)
    const alreadyPresent = conditionNamesLower.some(cn => cn.includes(process.toLowerCase()));
    if (alreadyPresent) continue;
    const relatedTriplets = kgTriplets.filter(t =>
      t.subject?.toLowerCase().includes(process.toLowerCase()) || t.object?.toLowerCase().includes(process.toLowerCase())
    );
    if (relatedTriplets.length > 0) {
      const connectedConditions = conditions.map((c: any) => c.condition_name).filter((cn: string) =>
        kgTriplets.some(t =>
          (t.subject?.toLowerCase().includes(cn.toLowerCase()) && t.object?.toLowerCase().includes(process.toLowerCase())) ||
          (t.object?.toLowerCase().includes(cn.toLowerCase()) && t.subject?.toLowerCase().includes(process.toLowerCase()))
        )
      );
      insights.push({
        category: 'hidden_comorbidity',
        title: process,
        description: connectedConditions.length > 0
          ? `Processo biológico inferido: ${connectedConditions.join(', ')} compartilham vias moleculares com ${process} segundo o Knowledge Graph.`
          : `Processo biológico ${process} identificado no Knowledge Graph como relevante para o perfil deste paciente.`,
        confidence: Math.min(0.85, 0.5 + relatedTriplets.length * 0.05),
        inferenceReason: connectedConditions.length > 0
          ? `Via KG: ${connectedConditions.join(', ')} → ${process} (${relatedTriplets.length} triplets)`
          : `${relatedTriplets.length} conexões no Knowledge Graph`,
        relatedEntities: relatedTriplets.slice(0, 3).map((t: any) => `${t.subject} ${t.predicate} ${t.object}`),
        source: 'kg_inference',
      });
    }
  }

  // 3. Future prevention from undiagnosed predispositions
  for (const p of predispositions) {
    if (p.already_diagnosed) continue;
    const ageContext = ` Comum em ${p.condition_name} a partir da meia-idade.`;
    insights.push({
      category: 'future_prevention',
      title: p.condition_name,
      description: `Doença comum nesta raça — risco ${p.risk_factor}× acima da média (evidência: ${p.evidence_grade}).${p.notes ? ` ${p.notes}` : ''} Avaliar estratégias preventivas pelo Knowledge Graph.`,
      confidence: p.risk_factor > 3 ? 0.8 : 0.6,
      inferenceReason: `Predisposição racial: fator de risco ${p.risk_factor}× • evidência ${p.evidence_grade}`,
      relatedEntities: [p.condition_name],
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
      inferenceReason: 'Predisposição racial confirmada por achados laboratoriais',
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
  const { t } = useTranslation();
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    current: true,
    hidden_comorbidity: true,
    future_prevention: true,
  });

  const insights = classifyInsights(conditions, clinicalDiscoveries, predispositions, kgTriplets, kgPathways);

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
      titleFallback: 'Processos Biológicos Inferidos (Gerociência)',
      descKey: 'petProfile.insights.hiddenComorbiditiesDesc',
      descFallback: 'Processos moleculares inferidos pelo Knowledge Graph — não são diagnósticos clínicos',
      items: hiddenInsights,
      config: categoryConfig.hidden_comorbidity,
    },
    {
      key: 'future_prevention',
      titleKey: 'petProfile.insights.futurePrevention',
      titleFallback: 'Prevenção Futura',
      descKey: 'petProfile.insights.futurePreventionDesc',
      descFallback: 'Riscos baseados em predisposições de raça e padrões laboratoriais',
      items: futureInsights,
      config: categoryConfig.future_prevention,
    },
  ];

  return (
    <Card className="border-2 border-primary/20">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Brain className="h-5 w-5 text-primary" />
          {t('petProfile.insights.title', 'Análise VetGraphRAG')}
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
