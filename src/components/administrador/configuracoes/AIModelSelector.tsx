import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Cpu, Zap, Save, RefreshCw } from "lucide-react";
import { useTranslation } from 'react-i18next';

const AVAILABLE_MODELS = [
  { id: 'google/gemini-3.5-flash', name: 'Gemini 3.5 Flash', descKey: 'GA · 1M ctx · supera 3.1 Pro em vários benchmarks · mais barato', recommended: true },
  { id: 'google/gemini-3.1-pro-preview', name: 'Gemini 3.1 Pro', descKey: 'Deep reasoning · usar quando 3.5 Flash não satisfaz' },
  { id: 'google/gemini-3.1-flash-lite-preview', name: 'Gemini 3.1 Flash Lite', descKey: 'Budget · alto volume / baixa complexidade' },
  { id: 'google/gemini-2.5-pro', name: 'Gemini 2.5 Pro', descKey: 'Geração anterior · fallback de compatibilidade' },
];

const EMBEDDING_MODELS = [
  { id: 'gemini-embedding-001', name: 'Gemini Embedding 001 (768d)', descKey: 'GA · substitui text-embedding-004 (deprecated Jan/2026)', recommended: true },
];

interface AIModelConfig {
  extraction: string;
  triplets: string;
  chat: string;
  translate: string;
  embeddings: string;
}

const AIModelSelector: React.FC = () => {
  const { toast } = useToast();
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [config, setConfig] = useState<AIModelConfig>({
    extraction: 'google/gemini-3.5-flash',
    triplets: 'google/gemini-3.5-flash',
    chat: 'google/gemini-3.5-flash',
    translate: 'google/gemini-3.5-flash',
    embeddings: 'gemini-embedding-001',
  });

  useEffect(() => { loadConfig(); }, []);

  const loadConfig = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('ai_configurations')
        .select('config_key, config_value')
        .like('config_key', 'ai_model_%');
      if (error) throw error;
      const newConfig = { ...config };
      data?.forEach(item => {
        const key = item.config_key.replace('ai_model_', '') as keyof AIModelConfig;
        if (key in newConfig) {
          const value = typeof item.config_value === 'string' 
            ? item.config_value.replace(/"/g, '') 
            : String(item.config_value);
          newConfig[key] = value;
        }
      });
      setConfig(newConfig);
    } catch (error) {
      console.error('Error loading AI config:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveConfig = async () => {
    setIsSaving(true);
    try {
      const updates = Object.entries(config).map(([key, value]) => ({
        config_key: `ai_model_${key}`,
        config_value: JSON.stringify(value),
        description: `Model for ${key} tasks`,
        is_active: true,
      }));
      for (const update of updates) {
        const { error } = await supabase
          .from('ai_configurations')
          .upsert(update, { onConflict: 'config_key' });
        if (error) throw error;
      }
      toast({
        title: t('aiModelSelector.configSaved'),
        description: t('aiModelSelector.configSavedDesc'),
      });
    } catch (error) {
      console.error('Error saving AI config:', error);
      toast({
        title: t('aiModelSelector.configSaveError'),
        description: t('aiModelSelector.configSaveErrorDesc'),
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const updateModel = (task: keyof AIModelConfig, model: string) => {
    setConfig(prev => ({ ...prev, [task]: model }));
  };

  const tasks = [
    { key: 'extraction' as const, label: t('aiModelSelector.tasks.extraction'), icon: '📄', description: t('aiModelSelector.tasks.extractionDesc') },
    { key: 'triplets' as const, label: t('aiModelSelector.tasks.triplets'), icon: '🔗', description: t('aiModelSelector.tasks.tripletsDesc') },
    { key: 'chat' as const, label: t('aiModelSelector.tasks.chat'), icon: '💬', description: t('aiModelSelector.tasks.chatDesc') },
    { key: 'translate' as const, label: t('aiModelSelector.tasks.translate'), icon: '🌍', description: t('aiModelSelector.tasks.translateDesc') },
  ];

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6 flex items-center justify-center">
          <RefreshCw className="h-5 w-5 animate-spin mr-2" />
          {t('aiModelSelector.loadingConfig')}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Cpu className="h-5 w-5" />
          {t('aiModelSelector.title')}
        </CardTitle>
        <CardDescription>
          {t('aiModelSelector.description')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="bg-blue-50 dark:bg-blue-950/30 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="h-4 w-4 text-blue-600" />
            <span className="font-medium text-blue-900 dark:text-blue-100">{t('aiModelSelector.provider')}</span>
          </div>
          <p className="text-sm text-blue-700 dark:text-blue-300">
            {t('aiModelSelector.providerDesc')}
          </p>
        </div>

        <div className="space-y-4">
          <h4 className="text-sm font-medium text-muted-foreground">{t('aiModelSelector.generativeModels')}</h4>
          <div className="grid gap-4">
            {tasks.map(task => (
              <div key={task.key} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <span className="text-xl">{task.icon}</span>
                  <div>
                    <p className="font-medium">{task.label}</p>
                    <p className="text-xs text-muted-foreground">{task.description}</p>
                  </div>
                </div>
                <Select value={config[task.key]} onValueChange={(value) => updateModel(task.key, value)}>
                  <SelectTrigger className="w-[220px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {AVAILABLE_MODELS.map(model => (
                      <SelectItem key={model.id} value={model.id}>
                        <div className="flex items-center gap-2">
                          {model.name}
                          {model.recommended && (
                            <Badge variant="secondary" className="text-xs">{t('aiModelSelector.recommended')}</Badge>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <h4 className="text-sm font-medium text-muted-foreground">{t('aiModelSelector.embeddingModels')}</h4>
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div className="flex items-center gap-3">
              <span className="text-xl">🔢</span>
              <div>
                <p className="font-medium">{t('aiModelSelector.embeddings')}</p>
                <p className="text-xs text-muted-foreground">{t('aiModelSelector.embeddingsDesc')}</p>
              </div>
            </div>
            <Select value={config.embeddings} onValueChange={(value) => updateModel('embeddings', value)}>
              <SelectTrigger className="w-[220px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {EMBEDDING_MODELS.map(model => (
                  <SelectItem key={model.id} value={model.id}>
                    <div className="flex items-center gap-2">
                      {model.name}
                      {model.recommended && (
                        <Badge variant="secondary" className="text-xs">{t('aiModelSelector.recommended')}</Badge>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t">
          <Button onClick={saveConfig} disabled={isSaving}>
            {isSaving ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                {t('aiModelSelector.savingConfig')}
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                {t('aiModelSelector.saveConfig')}
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default AIModelSelector;
