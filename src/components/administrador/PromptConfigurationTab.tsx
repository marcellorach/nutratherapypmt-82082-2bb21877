import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Brain, Plus, Trash2, Edit2, Save, X, Wand2, Layers, Layers3 } from "lucide-react";
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import ExtractionPromptsEditor from './configuracoes/ExtractionPromptsEditor';
import SystemPromptsCatalog from './configuracoes/SystemPromptsCatalog';

interface Prompt {
  id: string;
  name: string;
  description: string;
  content: string;
  category: string;
  active: boolean;
}

const PromptConfigurationTab: React.FC = () => {
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [editingPromptId, setEditingPromptId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const { t } = useTranslation();

  const [newPrompt, setNewPrompt] = useState<Omit<Prompt, 'id'>>({
    name: '',
    description: '',
    content: '',
    category: 'analysis',
    active: true
  });

  useEffect(() => {
    loadPromptsFromDatabase();
  }, []);

  const loadPromptsFromDatabase = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-config', { method: 'GET' });
      if (error) throw error;

      const loadedPrompts: Prompt[] = [];
      if (data) {
        Object.keys(data).forEach(key => {
          if (key.startsWith('prompt_')) {
            try {
              const promptData = typeof data[key] === 'string' ? JSON.parse(data[key]) : data[key];
              loadedPrompts.push({ id: key.replace('prompt_', ''), ...promptData });
            } catch (e) {
              console.error(`Error parsing prompt ${key}:`, e);
            }
          }
        });
      }
      setPrompts(loadedPrompts);
    } catch (error) {
      console.error('Error loading prompts:', error);
      toast({
        title: t('admin.prompts.messages.error'),
        description: t('admin.prompts.messages.errorLoading'),
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const generateRandomPrompts = () => {
    const examples: Omit<Prompt, 'id'>[] = [
      {
        name: "Análise de Deficiências Nutricionais",
        description: "Identifica deficiências nutricionais com base em exames laboratoriais",
        content: "Você é um especialista em nutrição veterinária. Analise os seguintes resultados de exames e identifique possíveis deficiências nutricionais que podem ser corrigidas com nutracêuticos do nosso catálogo.",
        category: "analysis",
        active: true
      },
      {
        name: "Prevenção por Raça",
        description: "Recomendações preventivas baseadas em predisposições genéticas",
        content: "Com base na raça, idade e histórico familiar do pet, identifique as doenças degenerativas mais comuns para este perfil e sugira nutracêuticos preventivos do nosso catálogo.",
        category: "prevention",
        active: true
      },
      {
        name: "Otimização de Performance",
        description: "Melhoria de performance para pets ativos ou de competição",
        content: "Para pets atletas ou de competição, analise o regime de exercícios e sugira suplementos que possam melhorar performance, recuperação muscular e resistência.",
        category: "performance",
        active: true
      }
    ];

    examples.forEach(async (example, index) => {
      const promptId = `${example.category}_${Date.now()}_${index}`;
      const configKey = `prompt_${promptId}`;
      try {
        await supabase.functions.invoke('ai-config', {
          method: 'POST',
          body: { action: 'set', key: configKey, value: JSON.stringify(example) }
        });
      } catch (error) {
        console.error(`Error saving prompt ${configKey}:`, error);
      }
    });

    setTimeout(() => {
      loadPromptsFromDatabase();
      toast({
        title: t('admin.prompts.messages.generated'),
        description: t('admin.prompts.messages.generatedDescription')
      });
    }, 1000);
  };

  const handleSavePrompt = async (promptId: string) => {
    const configKey = `prompt_${promptId}`;
    const prompt = prompts.find(p => p.id === promptId);
    if (!prompt) return;

    try {
      const updatedPrompt = { ...prompt, content: editContent };
      await supabase.functions.invoke('ai-config', {
        method: 'POST',
        body: {
          action: 'set',
          key: configKey,
          value: JSON.stringify({
            name: updatedPrompt.name,
            description: updatedPrompt.description,
            content: updatedPrompt.content,
            category: updatedPrompt.category,
            active: updatedPrompt.active
          })
        }
      });

      setPrompts(prompts.map(p => p.id === promptId ? updatedPrompt : p));
      setEditingPromptId(null);
      toast({
        title: t('admin.prompts.messages.saved'),
        description: t('admin.prompts.messages.savedDescription')
      });
    } catch (error) {
      console.error('Error saving prompt:', error);
      toast({
        title: t('admin.prompts.messages.error'),
        description: t('admin.prompts.messages.errorSaving'),
        variant: "destructive"
      });
    }
  };

  const handleCreatePrompt = async () => {
    if (!newPrompt.name || !newPrompt.content) {
      toast({
        title: t('admin.prompts.messages.requiredFields'),
        description: t('admin.prompts.messages.requiredFieldsDesc'),
        variant: "destructive"
      });
      return;
    }

    const promptId = `${newPrompt.category}_${Date.now()}`;
    const configKey = `prompt_${promptId}`;

    try {
      await supabase.functions.invoke('ai-config', {
        method: 'POST',
        body: { action: 'set', key: configKey, value: JSON.stringify(newPrompt) }
      });

      await loadPromptsFromDatabase();
      setIsCreating(false);
      setNewPrompt({ name: '', description: '', content: '', category: 'analysis', active: true });

      toast({
        title: t('admin.prompts.messages.created'),
        description: t('admin.prompts.messages.createdDescription')
      });
    } catch (error) {
      console.error('Error creating prompt:', error);
      toast({
        title: t('admin.prompts.messages.error'),
        description: t('admin.prompts.messages.errorCreating'),
        variant: "destructive"
      });
    }
  };

  const handleDeletePrompt = async (promptId: string) => {
    const configKey = `prompt_${promptId}`;
    try {
      const { error } = await supabase.from('ai_configurations').delete().eq('config_key', configKey);
      if (error) throw error;

      setPrompts(prompts.filter(p => p.id !== promptId));
      toast({
        title: t('admin.prompts.messages.removed'),
        description: t('admin.prompts.messages.removedDescription')
      });
    } catch (error) {
      console.error('Error deleting prompt:', error);
      toast({
        title: t('admin.prompts.messages.error'),
        description: t('admin.prompts.messages.errorDeleting'),
        variant: "destructive"
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">{t('admin.prompts.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <Tabs defaultValue="recomendacoes" className="w-full">
      <TabsList className="grid w-full grid-cols-3 mb-6">
        <TabsTrigger value="recomendacoes" className="flex items-center gap-2">
          <Brain className="h-4 w-4" />
          {t('admin.prompts.recommendationTab')}
        </TabsTrigger>
        <TabsTrigger value="extracao" className="flex items-center gap-2">
          <Layers className="h-4 w-4" />
          {t('admin.prompts.extractionTab')}
        </TabsTrigger>
        <TabsTrigger value="system" className="flex items-center gap-2">
          <Layers3 className="h-4 w-4" />
          System Prompts
        </TabsTrigger>
      </TabsList>

      <TabsContent value="recomendacoes">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-bold">{t('admin.prompts.recommendationTitle')}</h2>
            <p className="text-muted-foreground">{t('admin.prompts.recommendationDesc')}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={generateRandomPrompts} className="flex items-center gap-2">
              <Wand2 className="h-4 w-4" />
              {t('admin.prompts.generateExample')}
            </Button>
            <Button onClick={() => setIsCreating(true)} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              {t('admin.prompts.newPrompt')}
            </Button>
          </div>
        </div>

        {isCreating && (
          <Card className="mb-6 border-primary">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-primary" />
                {t('admin.prompts.createTitle')}
              </CardTitle>
              <CardDescription>{t('admin.prompts.createDescription')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="new-name">{t('admin.prompts.form.name')}</Label>
                <Input
                  id="new-name"
                  value={newPrompt.name}
                  onChange={(e) => setNewPrompt({ ...newPrompt, name: e.target.value })}
                  placeholder={t('admin.prompts.form.namePlaceholder')}
                />
              </div>
              <div>
                <Label htmlFor="new-description">{t('admin.prompts.form.description')}</Label>
                <Input
                  id="new-description"
                  value={newPrompt.description}
                  onChange={(e) => setNewPrompt({ ...newPrompt, description: e.target.value })}
                  placeholder={t('admin.prompts.form.descriptionPlaceholder')}
                />
              </div>
              <div>
                <Label htmlFor="new-category">{t('admin.prompts.form.category')}</Label>
                <select
                  id="new-category"
                  value={newPrompt.category}
                  onChange={(e) => setNewPrompt({ ...newPrompt, category: e.target.value })}
                  className="w-full border rounded-md p-2"
                >
                  <option value="analysis">{t('admin.prompts.categories.analysis')}</option>
                  <option value="prevention">{t('admin.prompts.categories.recommendation', 'Prevention')}</option>
                  <option value="performance">Performance</option>
                  <option value="nutrition">{t('admin.prompts.categories.clinical', 'Nutrition')}</option>
                </select>
              </div>
              <div>
                <Label htmlFor="new-content">{t('admin.prompts.form.content')}</Label>
                <Textarea
                  id="new-content"
                  value={newPrompt.content}
                  onChange={(e) => setNewPrompt({ ...newPrompt, content: e.target.value })}
                  placeholder={t('admin.prompts.form.contentPlaceholder')}
                  rows={8}
                  className="font-mono text-sm"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsCreating(false)}>
                  <X className="h-4 w-4 mr-2" />
                  {t('admin.prompts.form.cancel')}
                </Button>
                <Button onClick={handleCreatePrompt}>
                  <Save className="h-4 w-4 mr-2" />
                  {t('admin.prompts.form.save')}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 gap-6">
          {prompts.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center">
                <Brain className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground mb-4">{t('admin.prompts.noPrompts')}</p>
                <Button onClick={generateRandomPrompts} variant="outline">
                  <Wand2 className="h-4 w-4 mr-2" />
                  {t('admin.prompts.generateExamples')}
                </Button>
              </CardContent>
            </Card>
          ) : (
            prompts.map((prompt) => (
              <Card key={prompt.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="flex items-center gap-2">
                        <Brain className="h-5 w-5 text-primary" />
                        {prompt.name}
                        <Badge variant={prompt.active ? "default" : "secondary"}>
                          {prompt.active ? t('admin.prompts.status.active') : t('admin.prompts.status.inactive')}
                        </Badge>
                        <Badge variant="outline">{prompt.category}</Badge>
                      </CardTitle>
                      <CardDescription>{prompt.description}</CardDescription>
                    </div>
                    <div className="flex gap-2">
                      {editingPromptId === prompt.id ? (
                        <>
                          <Button variant="outline" size="sm" onClick={() => handleSavePrompt(prompt.id)}>
                            <Save className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => setEditingPromptId(null)}>
                            <X className="h-4 w-4" />
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button variant="outline" size="sm" onClick={() => { setEditingPromptId(prompt.id); setEditContent(prompt.content); }}>
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button variant="destructive" size="sm" onClick={() => handleDeletePrompt(prompt.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {editingPromptId === prompt.id ? (
                    <Textarea value={editContent} onChange={(e) => setEditContent(e.target.value)} rows={10} className="font-mono text-sm" />
                  ) : (
                    <div className="bg-muted p-4 rounded-md max-h-60 overflow-y-auto">
                      <p className="text-sm font-mono whitespace-pre-wrap">{prompt.content}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </TabsContent>

      <TabsContent value="extracao">
        <ExtractionPromptsEditor />
      </TabsContent>

      <TabsContent value="system">
        <SystemPromptsCatalog />
      </TabsContent>
    </Tabs>
  );
};

export default PromptConfigurationTab;
