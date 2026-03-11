import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Loader2, Save, RefreshCw, Database, Zap, AlertCircle, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useTranslation } from 'react-i18next';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface PromptConfig {
  id: string;
  config_key: string;
  config_value: string;
  description: string | null;
}

interface ModelConfig {
  id: string;
  config_key: string;
  config_value: string;
  description: string | null;
}

const PROMPT_KEYS = [
  { key: 'prompt_extraction_stage1_system', label: 'Stage 1 System', stage: 1, type: 'system' },
  { key: 'prompt_extraction_stage1_user', label: 'Stage 1 User', stage: 1, type: 'user' },
  { key: 'prompt_extraction_stage2_system', label: 'Stage 2 System', stage: 2, type: 'system' },
  { key: 'prompt_extraction_stage2_user', label: 'Stage 2 User', stage: 2, type: 'user' },
  { key: 'prompt_extraction_stage3_system', label: 'Stage 3 System', stage: 3, type: 'system' },
  { key: 'prompt_extraction_stage3_user', label: 'Stage 3 User', stage: 3, type: 'user' },
  { key: 'prompt_triplet_extraction_system', label: 'Triplet System', stage: 4, type: 'system' },
  { key: 'prompt_triplet_extraction_user', label: 'Triplet User', stage: 4, type: 'user' },
  { key: 'prompt_relations_auditor_system', label: 'Auditor System', stage: 5, type: 'system' },
];

const MODEL_KEYS = [
  { key: 'ai_model_extraction', label: 'Extraction Model', description: 'Model for PDF extraction (Stage 1-3)' },
  { key: 'ai_model_triplets', label: 'Triplet Model', description: 'Model for VetGraphRAG triplet generation' },
  { key: 'ai_model_chat', label: 'Chat Model', description: 'Model for chat/conversational tasks' },
  { key: 'ai_model_embeddings', label: 'Embeddings Model', description: 'Model for vector embeddings' },
  { key: 'ai_model_translate', label: 'Translation Model', description: 'Model for translation tasks' },
  { key: 'ai_model_relations_auditor', label: 'Relations Auditor Model', description: 'Model for Relations Auditor chat (google/gemini-3.1-pro-preview)' },
];

const PromptManagementPanel: React.FC = () => {
  const { toast } = useToast();
  const { t } = useTranslation();
  
  const [activeTab, setActiveTab] = useState('stage1');
  const [prompts, setPrompts] = useState<Record<string, PromptConfig>>({});
  const [models, setModels] = useState<Record<string, ModelConfig>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [editedValues, setEditedValues] = useState<Record<string, string>>({});
  const [hasChanges, setHasChanges] = useState<Record<string, boolean>>({});
  
  // Load prompts and models from database
  const loadConfigurations = async () => {
    setLoading(true);
    try {
      const allKeys = [
        ...PROMPT_KEYS.map(p => p.key),
        ...MODEL_KEYS.map(m => m.key),
      ];
      
      const { data, error } = await supabase
        .from('ai_configurations')
        .select('id, config_key, config_value, description')
        .in('config_key', allKeys);
      
      if (error) throw error;
      
      const promptsMap: Record<string, PromptConfig> = {};
      const modelsMap: Record<string, ModelConfig> = {};
      const editedMap: Record<string, string> = {};
      
      data?.forEach((item) => {
        // Parse JSONB value - remove extra quotes if present
        let rawValue = item.config_value;
        let value: string;
        
        if (typeof rawValue === 'string') {
          value = rawValue.replace(/^"(.*)"$/, '$1');
        } else if (rawValue === null || rawValue === undefined) {
          value = '';
        } else {
          value = String(rawValue);
        }
        
        const config: PromptConfig = {
          id: item.id,
          config_key: item.config_key,
          config_value: value,
          description: item.description,
        };
        
        if (item.config_key.startsWith('prompt_')) {
          promptsMap[item.config_key] = config;
        } else if (item.config_key.startsWith('ai_model_')) {
          modelsMap[item.config_key] = config;
        }
        
        editedMap[item.config_key] = value;
      });
      
      setPrompts(promptsMap);
      setModels(modelsMap);
      setEditedValues(editedMap);
      setHasChanges({});
    } catch (error: any) {
      console.error('Error loading configurations:', error);
      toast({
        title: t('common.error', 'Error'),
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    loadConfigurations();
  }, []);
  
  const handleValueChange = (key: string, newValue: string) => {
    setEditedValues(prev => ({ ...prev, [key]: newValue }));
    
    const originalValue = prompts[key]?.config_value || models[key]?.config_value || '';
    setHasChanges(prev => ({ ...prev, [key]: newValue !== originalValue }));
  };
  
  const handleSave = async (key: string) => {
    setSaving(key);
    try {
      const newValue = editedValues[key];
      
      // Update in database - store as JSONB (the raw string)
      const { error } = await supabase
        .from('ai_configurations')
        .update({ config_value: newValue, updated_at: new Date().toISOString() })
        .eq('config_key', key);
      
      if (error) throw error;
      
      // Update local state
      if (prompts[key]) {
        setPrompts(prev => ({
          ...prev,
          [key]: { ...prev[key], config_value: newValue }
        }));
      } else if (models[key]) {
        setModels(prev => ({
          ...prev,
          [key]: { ...prev[key], config_value: newValue }
        }));
      }
      
      setHasChanges(prev => ({ ...prev, [key]: false }));
      
      toast({
        title: t('common.success', 'Success'),
        description: `${key} saved successfully`,
      });
    } catch (error: any) {
      console.error('Error saving configuration:', error);
      toast({
        title: t('common.error', 'Error'),
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setSaving(null);
    }
  };
  
  const getStageDescription = (stage: number) => {
    switch (stage) {
      case 1: return 'Basic entity identification: nutraceuticals, conditions, species';
      case 2: return 'Mechanisms and relationships: pathways, enzymes, interactions';
      case 3: return 'Clinical outcomes: dosages, efficacy scores, biomarkers';
      case 4: return 'VetGraphRAG triplet generation for knowledge graph';
      case 5: return 'Relations Auditor: conversational analysis of nutraceutical-condition relationships with Mermaid diagrams (gemini-3.1-pro-preview)';
      default: return '';
    }
  };
  
  const renderPromptEditor = (promptKey: typeof PROMPT_KEYS[0]) => {
    const prompt = prompts[promptKey.key];
    const value = editedValues[promptKey.key] || '';
    const changed = hasChanges[promptKey.key];
    const isSaving = saving === promptKey.key;
    
    return (
      <div key={promptKey.key} className="space-y-3 border rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge variant={promptKey.type === 'system' ? 'default' : 'secondary'}>
              {promptKey.type === 'system' ? 'System' : 'User'}
            </Badge>
            <span className="font-medium">{promptKey.label}</span>
            {changed && (
              <Badge variant="outline" className="text-amber-500 border-amber-500">
                Modified
              </Badge>
            )}
          </div>
          <Button
            size="sm"
            onClick={() => handleSave(promptKey.key)}
            disabled={!changed || isSaving}
          >
            {isSaving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-1" />
            )}
            Save
          </Button>
        </div>
        
        {prompt?.description && (
          <p className="text-xs text-muted-foreground">{prompt.description}</p>
        )}
        
        <Textarea
          value={value}
          onChange={e => handleValueChange(promptKey.key, e.target.value)}
          rows={12}
          className="font-mono text-xs"
          placeholder={`Enter ${promptKey.label} prompt...`}
        />
        
        <div className="text-xs text-muted-foreground">
          Characters: {value.length} | Key: <code className="bg-muted px-1 rounded">{promptKey.key}</code>
        </div>
      </div>
    );
  };
  
  const renderModelEditor = (modelKey: typeof MODEL_KEYS[0]) => {
    const model = models[modelKey.key];
    const value = editedValues[modelKey.key] || '';
    const changed = hasChanges[modelKey.key];
    const isSaving = saving === modelKey.key;
    
    return (
      <div key={modelKey.key} className="flex items-center gap-4 p-3 border rounded-lg">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-medium">{modelKey.label}</span>
            {changed && (
              <Badge variant="outline" className="text-amber-500 border-amber-500 text-xs">
                Modified
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground">{modelKey.description}</p>
        </div>
        
        <Input
          value={value}
          onChange={e => handleValueChange(modelKey.key, e.target.value)}
          className="w-64 font-mono text-sm"
          placeholder="gemini-3-pro-preview"
        />
        
        <Button
          size="sm"
          onClick={() => handleSave(modelKey.key)}
          disabled={!changed || isSaving}
        >
          {isSaving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
        </Button>
      </div>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Models Configuration */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                AI Models Configuration
              </CardTitle>
              <CardDescription>Configure which AI models are used for each task</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={loadConfigurations}>
              <RefreshCw className="h-4 w-4 mr-1" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Recommended models: <code className="bg-muted px-1 rounded">gemini-3-pro-preview</code> for extraction/triplets, <code className="bg-muted px-1 rounded">text-embedding-004</code> for embeddings
            </AlertDescription>
          </Alert>
          
          {MODEL_KEYS.map(modelKey => renderModelEditor(modelKey))}
        </CardContent>
      </Card>

      {/* Extraction Prompts */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Extraction Prompts Configuration
              </CardTitle>
              <CardDescription>
                Configure the prompts used by the NTAI extraction pipeline (stored in ai_configurations table)
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="stage1">Stage 1</TabsTrigger>
              <TabsTrigger value="stage2">Stage 2</TabsTrigger>
              <TabsTrigger value="stage3">Stage 3</TabsTrigger>
              <TabsTrigger value="triplets">Triplets</TabsTrigger>
              <TabsTrigger value="auditor">Auditor</TabsTrigger>
            </TabsList>
            
            <TabsContent value="stage1" className="space-y-4 mt-4">
              <Alert>
                <CheckCircle2 className="h-4 w-4" />
                <AlertDescription>{getStageDescription(1)}</AlertDescription>
              </Alert>
              {PROMPT_KEYS.filter(p => p.stage === 1).map(renderPromptEditor)}
            </TabsContent>
            
            <TabsContent value="stage2" className="space-y-4 mt-4">
              <Alert>
                <CheckCircle2 className="h-4 w-4" />
                <AlertDescription>{getStageDescription(2)}</AlertDescription>
              </Alert>
              {PROMPT_KEYS.filter(p => p.stage === 2).map(renderPromptEditor)}
            </TabsContent>
            
            <TabsContent value="stage3" className="space-y-4 mt-4">
              <Alert>
                <CheckCircle2 className="h-4 w-4" />
                <AlertDescription>{getStageDescription(3)}</AlertDescription>
              </Alert>
              {PROMPT_KEYS.filter(p => p.stage === 3).map(renderPromptEditor)}
            </TabsContent>
            
            <TabsContent value="triplets" className="space-y-4 mt-4">
              <Alert>
                <CheckCircle2 className="h-4 w-4" />
                <AlertDescription>{getStageDescription(4)}</AlertDescription>
              </Alert>
              {PROMPT_KEYS.filter(p => p.stage === 4).map(renderPromptEditor)}
            </TabsContent>
            
            <TabsContent value="auditor" className="space-y-4 mt-4">
              <Alert>
                <CheckCircle2 className="h-4 w-4" />
                <AlertDescription>{getStageDescription(5)}</AlertDescription>
              </Alert>
              {PROMPT_KEYS.filter(p => p.stage === 5).map(renderPromptEditor)}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default PromptManagementPanel;
