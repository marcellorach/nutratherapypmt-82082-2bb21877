import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Cpu, Zap, Save, RefreshCw } from "lucide-react";

const AVAILABLE_MODELS = [
  { id: 'gemini-3-pro-preview', name: 'Gemini 3 Pro Preview', description: 'Latest generation, advanced reasoning', recommended: true },
  { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', description: 'Fast and balanced' },
  { id: 'gemini-2.0-flash-exp', name: 'Gemini 2.0 Flash Experimental', description: 'Experimental features' },
  { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', description: 'Powerful, slower' },
];

const EMBEDDING_MODELS = [
  { id: 'text-embedding-004', name: 'Text Embedding 004', description: 'Latest embedding model', recommended: true },
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
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [config, setConfig] = useState<AIModelConfig>({
    extraction: 'gemini-3-pro-preview',
    triplets: 'gemini-3-pro-preview',
    chat: 'gemini-3-pro-preview',
    translate: 'gemini-3-pro-preview',
    embeddings: 'text-embedding-004',
  });

  useEffect(() => {
    loadConfig();
  }, []);

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
          // Handle JSON string values
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
        title: "Configuration saved",
        description: "AI model settings have been updated successfully.",
      });
    } catch (error) {
      console.error('Error saving AI config:', error);
      toast({
        title: "Error saving configuration",
        description: "Failed to save AI model settings.",
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
    { key: 'extraction' as const, label: 'PDF Extraction', icon: '📄', description: 'Entity extraction from scientific studies' },
    { key: 'triplets' as const, label: 'Triplet Generation', icon: '🔗', description: 'Knowledge graph triplet extraction' },
    { key: 'chat' as const, label: 'Document Chat', icon: '💬', description: 'RAG-based document Q&A' },
    { key: 'translate' as const, label: 'Translation', icon: '🌍', description: 'Medical term translation' },
  ];

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6 flex items-center justify-center">
          <RefreshCw className="h-5 w-5 animate-spin mr-2" />
          Loading configuration...
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Cpu className="h-5 w-5" />
          AI Model Configuration
        </CardTitle>
        <CardDescription>
          Configure which Google AI model to use for each task. All models use your Google AI API key.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="bg-blue-50 dark:bg-blue-950/30 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="h-4 w-4 text-blue-600" />
            <span className="font-medium text-blue-900 dark:text-blue-100">Provider: Google AI</span>
          </div>
          <p className="text-sm text-blue-700 dark:text-blue-300">
            Using your configured Google AI API key for all AI operations.
          </p>
        </div>

        <div className="space-y-4">
          <h4 className="text-sm font-medium text-muted-foreground">Generative Models</h4>
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
                <Select
                  value={config[task.key]}
                  onValueChange={(value) => updateModel(task.key, value)}
                >
                  <SelectTrigger className="w-[220px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {AVAILABLE_MODELS.map(model => (
                      <SelectItem key={model.id} value={model.id}>
                        <div className="flex items-center gap-2">
                          {model.name}
                          {model.recommended && (
                            <Badge variant="secondary" className="text-xs">Recommended</Badge>
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
          <h4 className="text-sm font-medium text-muted-foreground">Embedding Models</h4>
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div className="flex items-center gap-3">
              <span className="text-xl">🔢</span>
              <div>
                <p className="font-medium">Embeddings</p>
                <p className="text-xs text-muted-foreground">Vector embeddings for semantic search</p>
              </div>
            </div>
            <Select
              value={config.embeddings}
              onValueChange={(value) => updateModel('embeddings', value)}
            >
              <SelectTrigger className="w-[220px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {EMBEDDING_MODELS.map(model => (
                  <SelectItem key={model.id} value={model.id}>
                    <div className="flex items-center gap-2">
                      {model.name}
                      {model.recommended && (
                        <Badge variant="secondary" className="text-xs">Recommended</Badge>
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
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Configuration
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default AIModelSelector;
