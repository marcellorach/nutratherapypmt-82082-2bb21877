import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, Brain, Save, Edit, Trash2 } from "lucide-react";
import { useTranslation } from 'react-i18next';

const PromptConfigurationTab: React.FC = () => {
  const { t } = useTranslation();
  
  const [prompts, setPrompts] = useState([
    {
      id: '1',
      name: t('admin.prompts.examples.analysisName'),
      description: t('admin.prompts.examples.analysisDescription'),
      content: t('admin.prompts.examples.analysisContent'),
      category: 'analysis',
      isActive: true
    },
    {
      id: '2',
      name: t('admin.prompts.examples.clinicalName'),
      description: t('admin.prompts.examples.clinicalDescription'),
      content: t('admin.prompts.examples.clinicalContent'),
      category: 'clinical',
      isActive: true
    }
  ]);
  
  const [editingPrompt, setEditingPrompt] = useState<string | null>(null);
  const [newPrompt, setNewPrompt] = useState({
    name: '',
    description: '',
    content: '',
    category: 'analysis'
  });
  const [isCreating, setIsCreating] = useState(false);
  const { toast } = useToast();

  const generateRandomPrompts = () => {
    const randomPrompts = [
      {
        id: String(Date.now()),
        name: t('admin.prompts.examples.evaluationName'),
        description: t('admin.prompts.examples.evaluationDescription'),
        content: t('admin.prompts.examples.evaluationContent'),
        category: 'evaluation',
        isActive: true
      }
    ];
    
    setPrompts(prev => [...prev, ...randomPrompts]);
    toast({
      title: t('admin.prompts.messages.generated'),
      description: t('admin.prompts.messages.generatedDescription'),
    });
  };

  const handleSavePrompt = (promptId: string, updatedContent: string) => {
    setPrompts(prev => prev.map(p => 
      p.id === promptId ? { ...p, content: updatedContent } : p
    ));
    setEditingPrompt(null);
    toast({
      title: t('admin.prompts.messages.saved'),
      description: t('admin.prompts.messages.savedDescription'),
    });
  };

  const handleCreatePrompt = () => {
    if (!newPrompt.name || !newPrompt.content) {
      toast({
        title: t('admin.prompts.messages.error'),
        description: t('admin.prompts.form.nameRequired'),
        variant: "destructive",
      });
      return;
    }

    const prompt = {
      ...newPrompt,
      id: String(Date.now()),
      isActive: true
    };

    setPrompts(prev => [...prev, prompt]);
    setNewPrompt({ name: '', description: '', content: '', category: 'analysis' });
    setIsCreating(false);
    
    toast({
      title: t('admin.prompts.messages.created'),
      description: t('admin.prompts.messages.createdDescription'),
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">{t('admin.prompts.title')}</h2>
        <div className="flex gap-2">
          <Button variant="outline" onClick={generateRandomPrompts}>
            <Brain className="h-4 w-4 mr-2" />
            {t('admin.prompts.generateExample')}
          </Button>
          <Button onClick={() => setIsCreating(true)}>
            <Plus className="h-4 w-4 mr-2" />
            {t('admin.prompts.newPrompt')}
          </Button>
        </div>
      </div>

      {/* Formulário de Criação */}
      {isCreating && (
        <Card>
          <CardHeader>
            <CardTitle>{t('admin.prompts.createTitle')}</CardTitle>
            <CardDescription>
              {t('admin.prompts.createDescription')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="prompt-name">{t('admin.prompts.form.name')}</Label>
                <Input
                  id="prompt-name"
                  value={newPrompt.name}
                  onChange={(e) => setNewPrompt(prev => ({ ...prev, name: e.target.value }))}
                  placeholder={t('admin.prompts.form.namePlaceholder')}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="prompt-category">{t('admin.prompts.form.category')}</Label>
                <select
                  id="prompt-category"
                  className="w-full p-2 border rounded-md"
                  value={newPrompt.category}
                  onChange={(e) => setNewPrompt(prev => ({ ...prev, category: e.target.value }))}
                >
                  <option value="analysis">{t('admin.prompts.categories.analysis')}</option>
                  <option value="clinical">{t('admin.prompts.categories.clinical')}</option>
                  <option value="evaluation">{t('admin.prompts.categories.evaluation')}</option>
                  <option value="recommendation">{t('admin.prompts.categories.recommendation')}</option>
                </select>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="prompt-description">{t('admin.prompts.form.description')}</Label>
              <Input
                id="prompt-description"
                value={newPrompt.description}
                onChange={(e) => setNewPrompt(prev => ({ ...prev, description: e.target.value }))}
                placeholder={t('admin.prompts.form.descriptionPlaceholder')}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="prompt-content">{t('admin.prompts.form.content')}</Label>
              <Textarea
                id="prompt-content"
                value={newPrompt.content}
                onChange={(e) => setNewPrompt(prev => ({ ...prev, content: e.target.value }))}
                placeholder={t('admin.prompts.form.contentPlaceholder')}
                rows={6}
              />
            </div>
            
            <div className="flex gap-2">
              <Button onClick={handleCreatePrompt}>
                <Save className="h-4 w-4 mr-2" />
                {t('admin.prompts.form.save')}
              </Button>
              <Button variant="outline" onClick={() => setIsCreating(false)}>
                {t('admin.prompts.form.cancel')}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lista de Prompts */}
      <div className="grid gap-4">
        {prompts.map((prompt) => (
          <Card key={prompt.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    {prompt.name}
                    <Badge variant={prompt.isActive ? "default" : "secondary"}>
                      {prompt.isActive ? t('admin.prompts.status.active') : t('admin.prompts.status.inactive')}
                    </Badge>
                    <Badge variant="outline">{t(`admin.prompts.categories.${prompt.category}`)}</Badge>
                  </CardTitle>
                  <CardDescription>{prompt.description}</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setEditingPrompt(prompt.id)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setPrompts(prev => prev.filter(p => p.id !== prompt.id));
                      toast({
                        title: t('admin.prompts.messages.removed'),
                        description: t('admin.prompts.messages.removedDescription'),
                      });
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {editingPrompt === prompt.id ? (
                <div className="space-y-4">
                  <Textarea
                    value={prompt.content}
                    onChange={(e) => {
                      setPrompts(prev => prev.map(p => 
                        p.id === prompt.id ? { ...p, content: e.target.value } : p
                      ));
                    }}
                    rows={6}
                  />
                  <div className="flex gap-2">
                    <Button onClick={() => handleSavePrompt(prompt.id, prompt.content)}>
                      <Save className="h-4 w-4 mr-2" />
                      {t('admin.prompts.form.saveChanges')}
                    </Button>
                    <Button variant="outline" onClick={() => setEditingPrompt(null)}>
                      {t('admin.prompts.form.cancel')}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="bg-gray-50 p-4 rounded-md">
                  <pre className="text-sm whitespace-pre-wrap">{prompt.content}</pre>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default PromptConfigurationTab;