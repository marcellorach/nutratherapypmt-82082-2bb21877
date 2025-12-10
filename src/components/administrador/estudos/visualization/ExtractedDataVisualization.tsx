import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Beaker,
  AlertTriangle,
  Ban,
  Pill,
  Zap,
  Users,
  Activity,
  ChevronDown,
  ChevronRight,
  FlaskConical,
  TrendingUp,
  TrendingDown,
  Minus,
  Heart,
  Brain,
  Shield
} from 'lucide-react';

interface StudyPopulation {
  species?: string;
  breed?: string;
  age_group?: string;
  sample_size?: number;
  weight_range_min?: number;
  weight_range_max?: number;
  health_status?: string;
}

interface StructuredDosage {
  compound: string;
  amount: number;
  unit: string;
  frequency?: string;
  per_body_weight?: boolean;
  duration_days?: number;
  route?: string;
}

interface Biomarker {
  name: string;
  baseline_value?: number;
  final_value?: number;
  change_percent?: number;
  unit?: string;
  p_value?: number;
  significance: 'significant' | 'trending' | 'not_significant';
}

interface SideEffect {
  name: string;
  description: string;
  severity: 'low' | 'medium' | 'high';
  frequency?: string;
  dose_related?: boolean;
}

interface Contraindication {
  condition: string;
  reason: string;
  severity: 'absolute' | 'relative' | 'caution';
  evidence_level?: string;
}

interface DrugInteraction {
  compound: string;
  interaction_type: string;
  effect: string;
  severity: string;
  mechanism?: string;
}

interface Synergy {
  compounds: string[];
  enhanced_effect: string;
  mechanism?: string;
  optimal_ratio?: string;
}

interface ExtractedDataVisualizationProps {
  analysisData: {
    study_population?: StudyPopulation;
    structured_dosages?: StructuredDosage[];
    biomarkers?: Biomarker[];
    side_effects?: SideEffect[];
    contraindications?: Contraindication[];
    drug_interactions?: DrugInteraction[];
    synergies?: Synergy[];
    nutraceuticals?: any[];
    mechanisms?: any[];
    conditions?: any[];
    interactions?: any[];
  };
}

const ExtractedDataVisualization: React.FC<ExtractedDataVisualizationProps> = ({ analysisData }) => {
  const { t } = useTranslation();
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    population: true,
    dosages: true,
    biomarkers: false,
    sideEffects: false,
    contraindications: false,
    interactions: false,
    synergies: false
  });

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const getSeverityColor = (severity: string) => {
    switch (severity?.toLowerCase()) {
      case 'high':
      case 'absolute':
      case 'dangerous':
        return 'bg-destructive/10 text-destructive border-destructive/30';
      case 'medium':
      case 'relative':
      case 'avoid':
      case 'caution':
        return 'bg-amber-500/10 text-amber-600 border-amber-500/30';
      case 'low':
      case 'beneficial':
      case 'neutral':
        return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getSignificanceIcon = (significance: string) => {
    switch (significance) {
      case 'significant':
        return <TrendingUp className="h-4 w-4 text-emerald-500" />;
      case 'trending':
        return <Minus className="h-4 w-4 text-amber-500" />;
      default:
        return <TrendingDown className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const { 
    study_population, 
    structured_dosages, 
    biomarkers, 
    side_effects, 
    contraindications, 
    drug_interactions, 
    synergies 
  } = analysisData || {};

  // Check if we have any expanded data
  const hasExpandedData = study_population || 
    (structured_dosages && structured_dosages.length > 0) ||
    (biomarkers && biomarkers.length > 0) ||
    (side_effects && side_effects.length > 0) ||
    (contraindications && contraindications.length > 0) ||
    (drug_interactions && drug_interactions.length > 0) ||
    (synergies && synergies.length > 0);

  if (!hasExpandedData) {
    return (
      <Card className="border-dashed border-muted-foreground/30">
        <CardContent className="py-8 text-center">
          <FlaskConical className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
          <p className="text-muted-foreground text-sm">
            {t('studies.extraction.noExpandedData', 'Dados expandidos não disponíveis. Reprocesse o estudo para extrair informações detalhadas.')}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Study Population */}
      {study_population && (
        <Collapsible open={expandedSections.population} onOpenChange={() => toggleSection('population')}>
          <Card>
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors py-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-primary" />
                    <CardTitle className="text-base">
                      {t('studies.extraction.studyPopulation', 'População do Estudo')}
                    </CardTitle>
                  </div>
                  {expandedSections.population ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </div>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="pt-0">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {study_population.species && (
                    <div className="flex flex-col">
                      <span className="text-xs text-muted-foreground">{t('studies.extraction.species', 'Espécie')}</span>
                      <Badge variant="outline" className="w-fit mt-1 capitalize">{study_population.species}</Badge>
                    </div>
                  )}
                  {study_population.breed && (
                    <div className="flex flex-col">
                      <span className="text-xs text-muted-foreground">{t('studies.extraction.breed', 'Raça')}</span>
                      <span className="font-medium text-sm">{study_population.breed}</span>
                    </div>
                  )}
                  {study_population.sample_size && (
                    <div className="flex flex-col">
                      <span className="text-xs text-muted-foreground">{t('studies.extraction.sampleSize', 'Tamanho da Amostra')}</span>
                      <span className="font-medium text-sm">n = {study_population.sample_size}</span>
                    </div>
                  )}
                  {study_population.age_group && (
                    <div className="flex flex-col">
                      <span className="text-xs text-muted-foreground">{t('studies.extraction.ageGroup', 'Faixa Etária')}</span>
                      <span className="font-medium text-sm capitalize">{study_population.age_group}</span>
                    </div>
                  )}
                  {study_population.health_status && (
                    <div className="flex flex-col">
                      <span className="text-xs text-muted-foreground">{t('studies.extraction.healthStatus', 'Estado de Saúde')}</span>
                      <span className="font-medium text-sm capitalize">{study_population.health_status}</span>
                    </div>
                  )}
                  {(study_population.weight_range_min || study_population.weight_range_max) && (
                    <div className="flex flex-col">
                      <span className="text-xs text-muted-foreground">{t('studies.extraction.weightRange', 'Faixa de Peso')}</span>
                      <span className="font-medium text-sm">
                        {study_population.weight_range_min} - {study_population.weight_range_max} kg
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      )}

      {/* Structured Dosages */}
      {structured_dosages && structured_dosages.length > 0 && (
        <Collapsible open={expandedSections.dosages} onOpenChange={() => toggleSection('dosages')}>
          <Card>
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors py-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Pill className="h-5 w-5 text-blue-500" />
                    <CardTitle className="text-base">
                      {t('studies.extraction.dosages', 'Dosagens')} ({structured_dosages.length})
                    </CardTitle>
                  </div>
                  {expandedSections.dosages ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </div>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="pt-0">
                <div className="space-y-3">
                  {structured_dosages.map((dosage, idx) => (
                    <div key={idx} className="flex flex-wrap items-center gap-2 p-3 bg-muted/30 rounded-lg">
                      <Badge variant="secondary" className="font-medium">{dosage.compound}</Badge>
                      <span className="text-sm font-mono">
                        {dosage.amount} {dosage.unit}
                        {dosage.per_body_weight && '/kg'}
                      </span>
                      {dosage.frequency && (
                        <Badge variant="outline" className="text-xs">{dosage.frequency}</Badge>
                      )}
                      {dosage.duration_days && (
                        <span className="text-xs text-muted-foreground">
                          ({dosage.duration_days} {t('studies.extraction.days', 'dias')})
                        </span>
                      )}
                      {dosage.route && (
                        <Badge variant="outline" className="text-xs capitalize">{dosage.route}</Badge>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      )}

      {/* Biomarkers */}
      {biomarkers && biomarkers.length > 0 && (
        <Collapsible open={expandedSections.biomarkers} onOpenChange={() => toggleSection('biomarkers')}>
          <Card>
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors py-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Activity className="h-5 w-5 text-emerald-500" />
                    <CardTitle className="text-base">
                      {t('studies.extraction.biomarkers', 'Biomarcadores')} ({biomarkers.length})
                    </CardTitle>
                  </div>
                  {expandedSections.biomarkers ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </div>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="pt-0">
                <div className="space-y-2">
                  {biomarkers.map((biomarker, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                      <div className="flex items-center gap-3">
                        {getSignificanceIcon(biomarker.significance)}
                        <div>
                          <span className="font-medium text-sm">{biomarker.name}</span>
                          {biomarker.unit && <span className="text-xs text-muted-foreground ml-1">({biomarker.unit})</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        {biomarker.baseline_value !== undefined && biomarker.final_value !== undefined && (
                          <span className="font-mono">
                            {biomarker.baseline_value} → {biomarker.final_value}
                          </span>
                        )}
                        {biomarker.change_percent !== undefined && (
                          <Badge 
                            variant="outline" 
                            className={biomarker.change_percent < 0 ? 'text-emerald-600' : 'text-amber-600'}
                          >
                            {biomarker.change_percent > 0 ? '+' : ''}{biomarker.change_percent}%
                          </Badge>
                        )}
                        {biomarker.p_value !== undefined && (
                          <span className="text-xs text-muted-foreground">
                            p={biomarker.p_value}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      )}

      {/* Side Effects */}
      {side_effects && side_effects.length > 0 && (
        <Collapsible open={expandedSections.sideEffects} onOpenChange={() => toggleSection('sideEffects')}>
          <Card className="border-amber-500/30">
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors py-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-amber-500" />
                    <CardTitle className="text-base">
                      {t('studies.extraction.sideEffects', 'Efeitos Adversos')} ({side_effects.length})
                    </CardTitle>
                  </div>
                  {expandedSections.sideEffects ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </div>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="pt-0">
                <div className="space-y-2">
                  {side_effects.map((effect, idx) => (
                    <div key={idx} className="p-3 bg-muted/30 rounded-lg">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-sm">{effect.name}</span>
                        <Badge className={getSeverityColor(effect.severity)}>{effect.severity}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{effect.description}</p>
                      <div className="flex gap-2 mt-2">
                        {effect.frequency && (
                          <Badge variant="outline" className="text-xs">{effect.frequency}</Badge>
                        )}
                        {effect.dose_related && (
                          <Badge variant="outline" className="text-xs">{t('studies.extraction.doseRelated', 'Dose-dependente')}</Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      )}

      {/* Contraindications */}
      {contraindications && contraindications.length > 0 && (
        <Collapsible open={expandedSections.contraindications} onOpenChange={() => toggleSection('contraindications')}>
          <Card className="border-destructive/30">
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors py-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Ban className="h-5 w-5 text-destructive" />
                    <CardTitle className="text-base">
                      {t('studies.extraction.contraindications', 'Contraindicações')} ({contraindications.length})
                    </CardTitle>
                  </div>
                  {expandedSections.contraindications ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </div>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="pt-0">
                <div className="space-y-2">
                  {contraindications.map((contra, idx) => (
                    <div key={idx} className="p-3 bg-muted/30 rounded-lg">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-sm">{contra.condition}</span>
                        <Badge className={getSeverityColor(contra.severity)}>{contra.severity}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{contra.reason}</p>
                      {contra.evidence_level && (
                        <Badge variant="outline" className="text-xs mt-2">
                          {t('studies.extraction.evidence', 'Evidência')}: {contra.evidence_level}
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      )}

      {/* Drug Interactions */}
      {drug_interactions && drug_interactions.length > 0 && (
        <Collapsible open={expandedSections.interactions} onOpenChange={() => toggleSection('interactions')}>
          <Card className="border-purple-500/30">
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors py-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Zap className="h-5 w-5 text-purple-500" />
                    <CardTitle className="text-base">
                      {t('studies.extraction.drugInteractions', 'Interações Medicamentosas')} ({drug_interactions.length})
                    </CardTitle>
                  </div>
                  {expandedSections.interactions ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </div>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="pt-0">
                <div className="space-y-2">
                  {drug_interactions.map((interaction, idx) => (
                    <div key={idx} className="p-3 bg-muted/30 rounded-lg">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">{interaction.compound}</Badge>
                          <Badge variant="outline" className="text-xs capitalize">{interaction.interaction_type}</Badge>
                        </div>
                        <Badge className={getSeverityColor(interaction.severity)}>{interaction.severity}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{interaction.effect}</p>
                      {interaction.mechanism && (
                        <p className="text-xs text-muted-foreground mt-1 italic">
                          {t('studies.extraction.mechanism', 'Mecanismo')}: {interaction.mechanism}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      )}

      {/* Synergies */}
      {synergies && synergies.length > 0 && (
        <Collapsible open={expandedSections.synergies} onOpenChange={() => toggleSection('synergies')}>
          <Card className="border-emerald-500/30">
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors py-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-emerald-500" />
                    <CardTitle className="text-base">
                      {t('studies.extraction.synergies', 'Sinergias')} ({synergies.length})
                    </CardTitle>
                  </div>
                  {expandedSections.synergies ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </div>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="pt-0">
                <div className="space-y-2">
                  {synergies.map((synergy, idx) => (
                    <div key={idx} className="p-3 bg-emerald-500/5 rounded-lg border border-emerald-500/20">
                      <div className="flex flex-wrap gap-1 mb-2">
                        {synergy.compounds.map((compound, cIdx) => (
                          <React.Fragment key={cIdx}>
                            <Badge variant="secondary">{compound}</Badge>
                            {cIdx < synergy.compounds.length - 1 && (
                              <span className="text-muted-foreground">+</span>
                            )}
                          </React.Fragment>
                        ))}
                      </div>
                      <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
                        → {synergy.enhanced_effect}
                      </p>
                      {synergy.mechanism && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {synergy.mechanism}
                        </p>
                      )}
                      {synergy.optimal_ratio && (
                        <Badge variant="outline" className="text-xs mt-2">
                          {t('studies.extraction.optimalRatio', 'Proporção ótima')}: {synergy.optimal_ratio}
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      )}
    </div>
  );
};

export default ExtractedDataVisualization;
