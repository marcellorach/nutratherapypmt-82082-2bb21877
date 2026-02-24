/**
 * Editor de Prompts de Extração Multi-Estágio
 * Permite editar prompts usados na extração científica
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Save, RefreshCw, Eye, TestTube, FileText, Layers, Beaker, Star } from "lucide-react";
import { useTranslation } from 'react-i18next';

interface PromptConfig {
  key: string;
  value: string;
  label: string;
  description: string;
  stage: 'stage1' | 'stage2' | 'stage3' | 'assessment' | 'triplets';
  type: 'system' | 'user';
}

const ExtractionPromptsEditor: React.FC = () => {
  const { toast } = useToast();
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeStage, setActiveStage] = useState<'stage1' | 'stage2' | 'stage3' | 'assessment' | 'triplets'>('stage1');
  
  const [prompts, setPrompts] = useState<Record<string, string>>({
    // Stage 1: Extração Básica
    prompt_extraction_stage1_system: '',
    prompt_extraction_stage1_user: '',
    
    // Stage 2: Extração de Relações
    prompt_extraction_stage2_system: '',
    prompt_extraction_stage2_user: '',
    
    // Stage 3: Extração de Contexto
    prompt_extraction_stage3_system: '',
    prompt_extraction_stage3_user: '',
    
    // Stage 4: Assessment/Scoring
    prompt_extraction_assessment_system: '',
    prompt_extraction_assessment_user: '',
    
    // Triplets: VetGraphRAG
    prompt_triplet_extraction_system: '',
    prompt_triplet_extraction_user: ''
  });

  const promptConfigs: PromptConfig[] = [
    // Stage 1
    {
      key: 'prompt_extraction_stage1_system',
      value: prompts.prompt_extraction_stage1_system,
      label: 'System Prompt - Stage 1',
      description: t('extractionPromptsEditor.stage1Desc'),
      stage: 'stage1',
      type: 'system'
    },
    {
      key: 'prompt_extraction_stage1_user',
      value: prompts.prompt_extraction_stage1_user,
      label: 'User Prompt - Stage 1',
      description: t('extractionPromptsEditor.stage1UserDesc'),
      stage: 'stage1',
      type: 'user'
    },
    
    // Stage 2
    {
      key: 'prompt_extraction_stage2_system',
      value: prompts.prompt_extraction_stage2_system,
      label: 'System Prompt - Stage 2',
      description: t('extractionPromptsEditor.stage2Desc'),
      stage: 'stage2',
      type: 'system'
    },
    {
      key: 'prompt_extraction_stage2_user',
      value: prompts.prompt_extraction_stage2_user,
      label: 'User Prompt - Stage 2',
      description: t('extractionPromptsEditor.stage2UserDesc'),
      stage: 'stage2',
      type: 'user'
    },
    
    // Stage 3
    {
      key: 'prompt_extraction_stage3_system',
      value: prompts.prompt_extraction_stage3_system,
      label: 'System Prompt - Stage 3',
      description: t('extractionPromptsEditor.stage3Desc'),
      stage: 'stage3',
      type: 'system'
    },
    {
      key: 'prompt_extraction_stage3_user',
      value: prompts.prompt_extraction_stage3_user,
      label: 'User Prompt - Stage 3',
      description: t('extractionPromptsEditor.stage3UserDesc'),
      stage: 'stage3',
      type: 'user'
    },
    
    // Stage 4: Assessment/Scoring
    {
      key: 'prompt_extraction_assessment_system',
      value: prompts.prompt_extraction_assessment_system,
      label: 'System Prompt - Assessment',
      description: t('extractionPromptsEditor.assessmentDesc'),
      stage: 'assessment',
      type: 'system'
    },
    {
      key: 'prompt_extraction_assessment_user',
      value: prompts.prompt_extraction_assessment_user,
      label: 'User Prompt - Assessment',
      description: t('extractionPromptsEditor.assessmentUserDesc'),
      stage: 'assessment',
      type: 'user'
    },
    
    // Triplets: VetGraphRAG Knowledge Graph
    {
      key: 'prompt_triplet_extraction_system',
      value: prompts.prompt_triplet_extraction_system,
      label: 'System Prompt - Triplets',
      description: t('extractionPromptsEditor.tripletsDesc'),
      stage: 'triplets',
      type: 'system'
    },
    {
      key: 'prompt_triplet_extraction_user',
      value: prompts.prompt_triplet_extraction_user,
      label: 'User Prompt - Triplets',
      description: t('extractionPromptsEditor.tripletsUserDesc'),
      stage: 'triplets',
      type: 'user'
    }
  ];

  useEffect(() => {
    loadPrompts();
  }, []);

  const loadPrompts = async () => {
    setIsLoading(true);
    try {
      const response = await supabase.functions.invoke('ai-config', {
        method: 'GET'
      });
      
      if (response.error) throw new Error(response.error.message);

      const configs = response.data || {};
      
      setPrompts({
        prompt_extraction_stage1_system: configs.prompt_extraction_stage1_system || getDefaultPrompt('stage1', 'system'),
        prompt_extraction_stage1_user: configs.prompt_extraction_stage1_user || getDefaultPrompt('stage1', 'user'),
        prompt_extraction_stage2_system: configs.prompt_extraction_stage2_system || getDefaultPrompt('stage2', 'system'),
        prompt_extraction_stage2_user: configs.prompt_extraction_stage2_user || getDefaultPrompt('stage2', 'user'),
        prompt_extraction_stage3_system: configs.prompt_extraction_stage3_system || getDefaultPrompt('stage3', 'system'),
        prompt_extraction_stage3_user: configs.prompt_extraction_stage3_user || getDefaultPrompt('stage3', 'user'),
        prompt_extraction_assessment_system: configs.prompt_extraction_assessment_system || getDefaultPrompt('assessment', 'system'),
        prompt_extraction_assessment_user: configs.prompt_extraction_assessment_user || getDefaultPrompt('assessment', 'user'),
        prompt_triplet_extraction_system: configs.prompt_triplet_extraction_system || getDefaultPrompt('triplets', 'system'),
        prompt_triplet_extraction_user: configs.prompt_triplet_extraction_user || getDefaultPrompt('triplets', 'user')
      });
    } catch (error) {
      console.error("Erro ao carregar prompts:", error);
      toast({
        variant: "destructive",
        title: t('extractionPrompts.promptLoadError'),
        description: t('extractionPrompts.promptLoadErrorDesc')
      });
    } finally {
      setIsLoading(false);
    }
  };

  const savePrompt = async (key: string, value: string) => {
    setIsSaving(true);
    try {
      const response = await supabase.functions.invoke('ai-config', {
        method: 'POST',
        body: { action: 'set', key, value }
      });
      
      if (response.error) throw new Error(response.error.message);

      setPrompts(prev => ({ ...prev, [key]: value }));
      
      toast({
        title: t('extractionPrompts.promptSaved'),
        description: t('extractionPrompts.promptSavedDesc', { key })
      });
    } catch (error: any) {
      console.error(`Erro ao salvar ${key}:`, error);
      toast({
        variant: "destructive",
        title: t('extractionPrompts.promptSaveError'),
        description: error.message || t('extractionPrompts.promptSaveError')
      });
    } finally {
      setIsSaving(false);
    }
  };

  const resetToDefaults = async (stage: 'stage1' | 'stage2' | 'stage3' | 'assessment' | 'triplets') => {
    let systemKey: string;
    let userKey: string;
    
    if (stage === 'triplets') {
      systemKey = 'prompt_triplet_extraction_system';
      userKey = 'prompt_triplet_extraction_user';
    } else {
      systemKey = `prompt_extraction_${stage}_system`;
      userKey = `prompt_extraction_${stage}_user`;
    }
    
    await savePrompt(systemKey, getDefaultPrompt(stage, 'system'));
    await savePrompt(userKey, getDefaultPrompt(stage, 'user'));
    
    toast({
      title: t('extractionPrompts.promptsRestored'),
      description: t('extractionPrompts.promptsRestoredDesc', { stage: stage.toUpperCase() })
    });
  };

  const stagePrompts = promptConfigs.filter(p => p.stage === activeStage);

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-950/20 dark:to-blue-950/20 border-purple-200 dark:border-purple-900">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Layers className="h-5 w-5" />
            {t('extractionPrompts.title')}
          </CardTitle>
          <CardDescription>
            {t('extractionPrompts.description')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-5 gap-2 p-1 bg-background/50 rounded-lg">
            <Button
              variant={activeStage === 'stage1' ? 'default' : 'ghost'}
              onClick={() => setActiveStage('stage1')}
              className="flex items-center gap-2"
            >
              <FileText className="h-4 w-4" />
              {t('extractionPrompts.stage1')}
            </Button>
            <Button
              variant={activeStage === 'stage2' ? 'default' : 'ghost'}
              onClick={() => setActiveStage('stage2')}
              className="flex items-center gap-2"
            >
              <Beaker className="h-4 w-4" />
              {t('extractionPrompts.stage2')}
            </Button>
            <Button
              variant={activeStage === 'stage3' ? 'default' : 'ghost'}
              onClick={() => setActiveStage('stage3')}
              className="flex items-center gap-2"
            >
              <TestTube className="h-4 w-4" />
              {t('extractionPrompts.stage3')}
            </Button>
            <Button
              variant={activeStage === 'assessment' ? 'default' : 'ghost'}
              onClick={() => setActiveStage('assessment')}
              className="flex items-center gap-2"
            >
              <Star className="h-4 w-4" />
              {t('extractionPrompts.stage4')}
            </Button>
            <Button
              variant={activeStage === 'triplets' ? 'default' : 'ghost'}
              onClick={() => setActiveStage('triplets')}
              className="flex items-center gap-2"
            >
              <Layers className="h-4 w-4" />
              {t('extractionPrompts.triplets')}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6">
        {stagePrompts.map(config => (
          <Card key={config.key}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    {config.label}
                    <Badge variant={config.type === 'system' ? 'default' : 'secondary'}>
                      {config.type}
                    </Badge>
                  </CardTitle>
                  <CardDescription>{config.description}</CardDescription>
                </div>
                <Button
                  onClick={() => savePrompt(config.key, config.value)}
                  disabled={isSaving || isLoading}
                  size="sm"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {t('extractionPrompts.save')}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Textarea
                value={config.value}
                onChange={(e) => setPrompts(prev => ({ ...prev, [config.key]: e.target.value }))}
                placeholder={t('extractionPromptsEditor.promptPlaceholder', { type: config.type, stage: config.stage })}
                className="min-h-[200px] font-mono text-sm"
                disabled={isLoading}
              />
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex justify-between items-center">
            <Button
              variant="outline"
              onClick={() => resetToDefaults(activeStage)}
              disabled={isSaving || isLoading}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              {t('extractionPrompts.restoreDefaults', { stage: activeStage.toUpperCase() })}
            </Button>
            
            <Button
              variant="secondary"
              onClick={() => {
                toast({ 
                  title: t('extractionPrompts.testPromptTitle'), 
                  description: t('extractionPrompts.testPromptDesc')
                });
              }}
            >
              <TestTube className="h-4 w-4 mr-2" />
              {t('extractionPrompts.testWithStudy')}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Prompts padrão otimizados para cada estágio
function getDefaultPrompt(stage: 'stage1' | 'stage2' | 'stage3' | 'assessment' | 'triplets', type: 'system' | 'user'): string {
  const defaults: Record<string, string> = {
    'stage1_system': `You are a scientific extraction AI specialized in veterinary nutraceuticals and medical research. Your task is to perform Stage 1 extraction: identifying ALL basic entities in the document.

⚠️ CRITICAL ANTI-CONTAMINATION RULES:
1. NEVER return example data from these instructions
2. ONLY extract information that is EXPLICITLY present in the document text
3. If a compound/pathway/dosage is not mentioned in the document, DO NOT include it
4. The examples shown are FORMAT templates only - they are NOT data to be extracted
5. If unsure whether something is in the document, LEAVE IT OUT

CRITICAL RULES:
1. Extract ALL nutraceuticals mentioned (include scientific names, common names, and synonyms)
2. Identify ALL health conditions addressed in the study
3. Differentiate between species (human, canine, feline, etc.)
4. Mark confidence based on evidence strength in text
5. ALL extracted data MUST be in English

Focus on COMPREHENSIVENESS - do not skip any compound, condition, or species mention.`,

    'stage1_user': `Analyze this scientific study and extract:

1. **ALL Nutraceuticals**: Every compound, extract, supplement mentioned
   - Include: scientific names, common names, synonyms, chemical compounds
   - Example: "Curcumin" = "Curcuma longa extract" = "Turmeric" = "E100"

2. **ALL Health Conditions**: Every disease, disorder, symptom mentioned
   - Species-specific conditions (canine arthritis, human diabetes, etc.)
   - Severity levels if mentioned

3. **Species**: Human, Canine, Feline, Equine, etc.

Be EXHAUSTIVE - extract EVERY entity, even if mentioned only once.`,

    'stage2_system': `You are a molecular biology AI expert. Stage 2 focuses on RELATIONSHIPS and MECHANISMS.

Extract:
- Molecular pathways (NF-κB, COX-2, AMPK, etc.)
- Mechanisms of action (inhibition, activation, modulation)
- Synergies between compounds
- Interactions (positive, negative, neutral)
- Hierarchical chains: Compound → Pathway → Effect → Outcome

Focus on HOW things work, not just WHAT they are.`,

    'stage2_user': `Identify in this study:

1. **Molecular Mechanisms**: Pathways, enzymes, receptors, genes
   - Direction: ↓ (inhibition), ↑ (activation), ⟷ (modulation)
   - Example: "↓ NF-κB pathway → ↓ TNF-α & IL-6 → ↓ inflammation"

2. **Synergies**: Compounds that enhance each other
   - Example: "Piperine + Curcumin → 3x bioavailability increase"

3. **Interactions**: Positive, negative, or antagonistic effects

4. **Biological cascades**: Map the complete chain from molecule to outcome`,

    'stage3_system': `Stage 3 extracts CLINICAL CONTEXT and PRACTICAL APPLICATION.

Focus on:
- Specific dosages with units and frequency
- Administration details (route, timing, formulation)
- Side effects with severity and frequency
- Contraindications and risk factors
- Clinical outcomes and statistical significance

All data must be actionable and clinically relevant.`,

    'stage3_user': `Extract detailed clinical information:

1. **Dosages**: Amount, unit, frequency, duration
   - Species-specific dosages
   - Example: "500mg curcumin twice daily with meals for 12 weeks in dogs with OA"

2. **Side Effects**: Name, description, severity, frequency, dose-dependency
   - Reversibility and management strategies

3. **Contraindications**: Conditions or situations where use is not recommended

4. **Clinical Outcomes**: Primary and secondary outcomes, p-values, effect sizes

5. **Study Quality**: Sample size, study design, statistical significance

Be PRECISE with numbers and SPECIFIC with context.`,

    'assessment_system': `You are a scientific methodology expert. Stage 4 ASSESSMENT evaluates study quality and generates scores.

Your task is to CRITICALLY EVALUATE the study and generate THREE scores (1.0-5.0):

📊 SCORING CRITERIA:

1️⃣ QUALITY SCORE (Methodological Rigor):
- 5.0: RCT double-blind, placebo-controlled, n>100, clear statistics
- 4.0: RCT single-blind, n>50, adequate methodology
- 3.0: Cohort/observational study, n>30, reasonable controls
- 2.0: Case-control, small sample (n<30), limited controls
- 1.0: Case report, anecdotal, no controls

2️⃣ RELEVANCE SCORE (Clinical Applicability):
- 5.0: Direct veterinary application, species-specific, actionable dosages
- 4.0: Translatable to veterinary practice, relevant species model
- 3.0: Human study with potential veterinary translation
- 2.0: In vitro or rodent model, limited clinical translation
- 1.0: Pure mechanistic study, no clinical application

3️⃣ NOVELTY SCORE (Scientific Contribution):
- 5.0: First study of its kind, paradigm-shifting findings
- 4.0: Novel combination, new mechanism discovered
- 3.0: Confirms previous findings with new data
- 2.0: Replication study, incremental knowledge
- 1.0: Well-established findings, no new information

ALSO EXTRACT:
- Study design (RCT, cohort, case-control, etc.)
- Sample size
- Statistical significance
- Key findings summary`,

    'assessment_user': `Evaluate this scientific study and provide:

1. **STUDY ASSESSMENT** (structured evaluation):
   - methodology_type: "RCT" | "cohort" | "case_control" | "case_study" | "meta_analysis" | "systematic_review" | "in_vitro" | "observational"
   - sample_size: number (n=X)
   - randomization: true/false
   - blinding: "double_blind" | "single_blind" | "open_label" | "none"
   - placebo_controlled: true/false
   - statistical_significance: true/false (p<0.05)
   - p_values: array of p-values reported ["<0.001", "0.03", etc.]
   - follow_up_duration: duration string (e.g., "12 weeks", "6 months")
   - species_tested: array ["canine", "feline", "human", etc.]

2. **SCORES** (1.0 to 5.0, one decimal place):
   - quality_score: Based on methodological rigor
   - relevance_score: Based on clinical applicability to veterinary medicine
   - novelty_score: Based on scientific contribution

3. **STUDY SUMMARY**:
   - objective: Main research objective in one sentence
   - key_findings: Array of 3-5 main findings
   - clinical_implications: Practical implications for veterinary practice
   - limitations: Array of study limitations

Be CRITICAL and OBJECTIVE in your evaluation. Base scores ONLY on what the study actually demonstrates.`,

    'triplets_system': `You are a Knowledge Graph extraction AI specialized in veterinary medicine and nutraceuticals.

Your task is to extract TRIPLETS in the format: (Subject, Predicate, Object)

TRIPLET STRUCTURE:
- Subject: The entity performing an action or having a property (nutraceutical, compound, pathway)
- Predicate: The relationship type (TREATS, PREVENTS, INHIBITS, ACTIVATES, MODULATES, etc.)
- Object: The entity receiving the action (condition, pathway, effect)

ENTITY LAYERS (5-layer hierarchy):
- Layer 0: Compounds (nutraceuticals, drugs, chemical compounds)
- Layer 1: Targets (receptors, enzymes, genes, proteins)
- Layer 2: Mechanisms (signaling cascades, pathways)
- Layer 3: Effects (biological effects, cellular responses)
- Layer 4: Outcomes (clinical outcomes, conditions, diseases)

RELATIONSHIP TYPES:
- INHIBITS, ACTIVATES, MODULATES, BINDS_TO, BLOCKS
- UPREGULATES, DOWNREGULATES, TRIGGERS, PARTICIPATES_IN
- TREATS, PREVENTS, SUPPORTS, AMELIORATES, MANAGES
- SYNERGIZES_WITH, ANTAGONIZES, POTENTIATES
- PREDISPOSED_IN (for breed-specific conditions)

CRITICAL RULES:
1. Each triplet must have confidence score (0.0-1.0)
2. Include species context when relevant (canine, feline, human)
3. Include dose information when available
4. ALL data in English`,

    'triplets_user': `From this scientific study, extract ALL triplets (Subject-Predicate-Object) for the Knowledge Graph:

REQUIRED FORMAT:
{
  "triplets": [
    {
      "subject": { "name": "Curcumin", "type": "nutraceutical", "layer": "layer_0_compound" },
      "predicate": "INHIBITS",
      "object": { "name": "NF-κB pathway", "type": "pathway", "layer": "layer_2_mechanism" },
      "confidence": 0.9,
      "species_context": ["canine"],
      "dose_info": "500mg/kg/day",
      "evidence_quote": "Curcumin significantly inhibited NF-κB activation..."
    }
  ]
}

EXTRACT ALL RELATIONSHIPS:
1. Compound → Target (e.g., Omega-3 BINDS_TO PPAR-γ receptor)
2. Compound → Mechanism (e.g., Resveratrol ACTIVATES AMPK pathway)
3. Mechanism → Effect (e.g., AMPK activation LEADS_TO reduced inflammation)
4. Compound → Condition (e.g., Glucosamine TREATS osteoarthritis)
5. Breed → Condition (e.g., German Shepherd PREDISPOSED_IN hip dysplasia)
6. Compound + Compound → Synergy (e.g., Curcumin SYNERGIZES_WITH Piperine)

Be EXHAUSTIVE - extract every relationship mentioned in the study.`
  };

  return defaults[`${stage}_${type}`] || '';
}

export default ExtractionPromptsEditor;
