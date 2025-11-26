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
import { Save, RefreshCw, Eye, TestTube, FileText, Layers, Beaker } from "lucide-react";

interface PromptConfig {
  key: string;
  value: string;
  label: string;
  description: string;
  stage: 'stage1' | 'stage2' | 'stage3';
  type: 'system' | 'user';
}

const ExtractionPromptsEditor: React.FC = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeStage, setActiveStage] = useState<'stage1' | 'stage2' | 'stage3'>('stage1');
  
  const [prompts, setPrompts] = useState<Record<string, string>>({
    // Stage 1: Extração Básica
    prompt_extraction_stage1_system: '',
    prompt_extraction_stage1_user: '',
    
    // Stage 2: Extração de Relações
    prompt_extraction_stage2_system: '',
    prompt_extraction_stage2_user: '',
    
    // Stage 3: Extração de Contexto
    prompt_extraction_stage3_system: '',
    prompt_extraction_stage3_user: ''
  });

  const promptConfigs: PromptConfig[] = [
    // Stage 1
    {
      key: 'prompt_extraction_stage1_system',
      value: prompts.prompt_extraction_stage1_system,
      label: 'System Prompt - Stage 1',
      description: 'Instruções gerais para extração básica de entidades',
      stage: 'stage1',
      type: 'system'
    },
    {
      key: 'prompt_extraction_stage1_user',
      value: prompts.prompt_extraction_stage1_user,
      label: 'User Prompt - Stage 1',
      description: 'Solicitação específica para identificar nutracêuticos, condições e compostos',
      stage: 'stage1',
      type: 'user'
    },
    
    // Stage 2
    {
      key: 'prompt_extraction_stage2_system',
      value: prompts.prompt_extraction_stage2_system,
      label: 'System Prompt - Stage 2',
      description: 'Instruções para extração de mecanismos e pathways moleculares',
      stage: 'stage2',
      type: 'system'
    },
    {
      key: 'prompt_extraction_stage2_user',
      value: prompts.prompt_extraction_stage2_user,
      label: 'User Prompt - Stage 2',
      description: 'Solicitação para identificar sinergias, interações e cascatas moleculares',
      stage: 'stage2',
      type: 'user'
    },
    
    // Stage 3
    {
      key: 'prompt_extraction_stage3_system',
      value: prompts.prompt_extraction_stage3_system,
      label: 'System Prompt - Stage 3',
      description: 'Instruções para extração de contexto clínico e dosagens',
      stage: 'stage3',
      type: 'system'
    },
    {
      key: 'prompt_extraction_stage3_user',
      value: prompts.prompt_extraction_stage3_user,
      label: 'User Prompt - Stage 3',
      description: 'Solicitação para extrair dosagens, efeitos colaterais e contexto de aplicação',
      stage: 'stage3',
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
        prompt_extraction_stage3_user: configs.prompt_extraction_stage3_user || getDefaultPrompt('stage3', 'user')
      });
    } catch (error) {
      console.error("Erro ao carregar prompts:", error);
      toast({
        variant: "destructive",
        title: "Erro ao carregar prompts",
        description: "Não foi possível carregar os prompts de extração."
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
        title: "✅ Prompt salvo",
        description: `Prompt ${key} atualizado com sucesso.`
      });
    } catch (error: any) {
      console.error(`Erro ao salvar ${key}:`, error);
      toast({
        variant: "destructive",
        title: "Erro ao salvar prompt",
        description: error.message || "Ocorreu um erro ao salvar o prompt."
      });
    } finally {
      setIsSaving(false);
    }
  };

  const resetToDefaults = async (stage: 'stage1' | 'stage2' | 'stage3') => {
    const systemKey = `prompt_extraction_${stage}_system`;
    const userKey = `prompt_extraction_${stage}_user`;
    
    await savePrompt(systemKey, getDefaultPrompt(stage, 'system'));
    await savePrompt(userKey, getDefaultPrompt(stage, 'user'));
    
    toast({
      title: "✅ Prompts restaurados",
      description: `Prompts do ${stage.toUpperCase()} restaurados para valores padrão.`
    });
  };

  const stagePrompts = promptConfigs.filter(p => p.stage === activeStage);

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-950/20 dark:to-blue-950/20 border-purple-200 dark:border-purple-900">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Layers className="h-5 w-5" />
            Prompts de Extração Científica Multi-Estágio
          </CardTitle>
          <CardDescription>
            Configure os prompts usados em cada estágio da extração de dados científicos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-2 p-1 bg-background/50 rounded-lg">
            <Button
              variant={activeStage === 'stage1' ? 'default' : 'ghost'}
              onClick={() => setActiveStage('stage1')}
              className="flex items-center gap-2"
            >
              <FileText className="h-4 w-4" />
              Stage 1: Básico
            </Button>
            <Button
              variant={activeStage === 'stage2' ? 'default' : 'ghost'}
              onClick={() => setActiveStage('stage2')}
              className="flex items-center gap-2"
            >
              <Beaker className="h-4 w-4" />
              Stage 2: Relações
            </Button>
            <Button
              variant={activeStage === 'stage3' ? 'default' : 'ghost'}
              onClick={() => setActiveStage('stage3')}
              className="flex items-center gap-2"
            >
              <TestTube className="h-4 w-4" />
              Stage 3: Contexto
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
                  Salvar
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Textarea
                value={config.value}
                onChange={(e) => setPrompts(prev => ({ ...prev, [config.key]: e.target.value }))}
                placeholder={`Prompt ${config.type} para ${config.stage}...`}
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
              Restaurar Padrões do {activeStage.toUpperCase()}
            </Button>
            
            <Button
              variant="secondary"
              onClick={() => {
                toast({ 
                  title: "🔬 Teste de Prompts", 
                  description: "Navegue até a aba 'Estudos' para fazer upload de um PDF e testar a extração com os prompts atuais."
                });
              }}
            >
              <TestTube className="h-4 w-4 mr-2" />
              Testar com Estudo Real
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Prompts padrão otimizados para cada estágio
function getDefaultPrompt(stage: 'stage1' | 'stage2' | 'stage3', type: 'system' | 'user'): string {
  const defaults: Record<string, string> = {
    'stage1_system': `You are a scientific extraction AI specialized in veterinary nutraceuticals and medical research. Your task is to perform Stage 1 extraction: identifying ALL basic entities in the document.

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

Be PRECISE with numbers and SPECIFIC with context.`
  };

  return defaults[`${stage}_${type}`] || '';
}

export default ExtractionPromptsEditor;
