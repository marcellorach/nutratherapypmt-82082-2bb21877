import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Brain, Plus, Trash2, Edit2, Save, X, Wand2 } from "lucide-react";
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';

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

  // Carregar prompts do banco na inicialização
  useEffect(() => {
    loadPromptsFromDatabase();
  }, []);

  const loadPromptsFromDatabase = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-config', {
        method: 'GET'
      });

      if (error) throw error;

      // Filtrar apenas as chaves que começam com "prompt_"
      const loadedPrompts: Prompt[] = [];
      if (data) {
        Object.keys(data).forEach(key => {
          if (key.startsWith('prompt_')) {
            try {
              const promptData = typeof data[key] === 'string' 
                ? JSON.parse(data[key]) 
                : data[key];
              
              loadedPrompts.push({
                id: key.replace('prompt_', ''),
                ...promptData
              });
            } catch (e) {
              console.error(`Erro ao parsear prompt ${key}:`, e);
            }
          }
        });
      }

      setPrompts(loadedPrompts);
    } catch (error) {
      console.error('Erro ao carregar prompts:', error);
      toast({
        title: "Erro ao carregar prompts",
        description: "Não foi possível carregar os prompts salvos.",
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
        content: "Você é um especialista em nutrição veterinária. Analise os seguintes resultados de exames e identifique possíveis deficiências nutricionais que podem ser corrigidas com nutracêuticos do nosso catálogo. Considere: níveis de vitaminas, minerais, proteínas e marcadores inflamatórios.",
        category: "analysis",
        active: true
      },
      {
        name: "Prevenção por Raça",
        description: "Recomendações preventivas baseadas em predisposições genéticas",
        content: "Com base na raça, idade e histórico familiar do pet, identifique as doenças degenerativas mais comuns para este perfil e sugira nutracêuticos preventivos do nosso catálogo. Foque em: displasia, problemas cardíacos, condições dermatológicas e sensibilidades digestivas.",
        category: "prevention",
        active: true
      },
      {
        name: "Otimização de Performance",
        description: "Melhoria de performance para pets ativos ou de competição",
        content: "Para pets atletas ou de competição, analise o regime de exercícios e sugira suplementos que possam melhorar performance, recuperação muscular e resistência. Considere: aminoácidos, antioxidantes, suporte articular e energia.",
        category: "performance",
        active: true
      }
    ];

    // Salvar cada exemplo no banco
    examples.forEach(async (example, index) => {
      const promptId = `${example.category}_${Date.now()}_${index}`;
      const configKey = `prompt_${promptId}`;
      
      try {
        await supabase.functions.invoke('ai-config', {
          method: 'POST',
          body: {
            action: 'set',
            key: configKey,
            value: JSON.stringify(example)
          }
        });
      } catch (error) {
        console.error(`Erro ao salvar prompt ${configKey}:`, error);
      }
    });

    // Recarregar após salvar
    setTimeout(() => {
      loadPromptsFromDatabase();
      toast({
        title: "Prompts de exemplo gerados!",
        description: `${examples.length} prompts foram adicionados ao banco de dados.`
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

      setPrompts(prompts.map(p => 
        p.id === promptId ? updatedPrompt : p
      ));
      
      setEditingPromptId(null);
      toast({
        title: "Prompt atualizado!",
        description: "As alterações foram salvas no banco de dados."
      });
    } catch (error) {
      console.error('Erro ao salvar prompt:', error);
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar as alterações.",
        variant: "destructive"
      });
    }
  };

  const handleCreatePrompt = async () => {
    if (!newPrompt.name || !newPrompt.content) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha pelo menos o nome e o conteúdo do prompt.",
        variant: "destructive"
      });
      return;
    }

    const promptId = `${newPrompt.category}_${Date.now()}`;
    const configKey = `prompt_${promptId}`;

    try {
      await supabase.functions.invoke('ai-config', {
        method: 'POST',
        body: {
          action: 'set',
          key: configKey,
          value: JSON.stringify(newPrompt)
        }
      });

      // Recarregar prompts
      await loadPromptsFromDatabase();

      setIsCreating(false);
      setNewPrompt({
        name: '',
        description: '',
        content: '',
        category: 'analysis',
        active: true
      });

      toast({
        title: "Prompt criado!",
        description: "O novo prompt foi salvo no banco de dados."
      });
    } catch (error) {
      console.error('Erro ao criar prompt:', error);
      toast({
        title: "Erro ao criar prompt",
        description: "Não foi possível salvar o novo prompt.",
        variant: "destructive"
      });
    }
  };

  const handleDeletePrompt = async (promptId: string) => {
    const configKey = `prompt_${promptId}`;
    
    try {
      // Deletar do banco usando a tabela ai_configurations
      const { error } = await supabase
        .from('ai_configurations')
        .delete()
        .eq('config_key', configKey);

      if (error) throw error;

      setPrompts(prompts.filter(p => p.id !== promptId));
      
      toast({
        title: "Prompt deletado",
        description: "O prompt foi removido do banco de dados."
      });
    } catch (error) {
      console.error('Erro ao deletar prompt:', error);
      toast({
        title: "Erro ao deletar",
        description: "Não foi possível remover o prompt.",
        variant: "destructive"
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando prompts...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold">Configuração de Prompts da IA</h2>
          <p className="text-muted-foreground">Gerencie os prompts utilizados pelo sistema de IA</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={generateRandomPrompts}
            className="flex items-center gap-2"
          >
            <Wand2 className="h-4 w-4" />
            Gerar Exemplos
          </Button>
          <Button 
            onClick={() => setIsCreating(true)}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Novo Prompt
          </Button>
        </div>
      </div>

      {isCreating && (
        <Card className="mb-6 border-primary">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-primary" />
              Criar Novo Prompt
            </CardTitle>
            <CardDescription>Preencha os campos abaixo para criar um novo prompt</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="new-name">Nome do Prompt</Label>
              <Input
                id="new-name"
                value={newPrompt.name}
                onChange={(e) => setNewPrompt({ ...newPrompt, name: e.target.value })}
                placeholder="Ex: Análise de Exames"
              />
            </div>
            
            <div>
              <Label htmlFor="new-description">Descrição</Label>
              <Input
                id="new-description"
                value={newPrompt.description}
                onChange={(e) => setNewPrompt({ ...newPrompt, description: e.target.value })}
                placeholder="Breve descrição do que este prompt faz"
              />
            </div>

            <div>
              <Label htmlFor="new-category">Categoria</Label>
              <select
                id="new-category"
                value={newPrompt.category}
                onChange={(e) => setNewPrompt({ ...newPrompt, category: e.target.value })}
                className="w-full border rounded-md p-2"
              >
                <option value="analysis">Análise</option>
                <option value="prevention">Prevenção</option>
                <option value="performance">Performance</option>
                <option value="nutrition">Nutrição</option>
              </select>
            </div>

            <div>
              <Label htmlFor="new-content">Conteúdo do Prompt</Label>
              <Textarea
                id="new-content"
                value={newPrompt.content}
                onChange={(e) => setNewPrompt({ ...newPrompt, content: e.target.value })}
                placeholder="Insira o prompt completo aqui..."
                rows={8}
                className="font-mono text-sm"
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsCreating(false)}>
                <X className="h-4 w-4 mr-2" />
                Cancelar
              </Button>
              <Button onClick={handleCreatePrompt}>
                <Save className="h-4 w-4 mr-2" />
                Salvar Prompt
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
              <p className="text-muted-foreground mb-4">
                Nenhum prompt configurado ainda.
              </p>
              <Button onClick={generateRandomPrompts} variant="outline">
                <Wand2 className="h-4 w-4 mr-2" />
                Gerar Prompts de Exemplo
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
                        {prompt.active ? 'Ativo' : 'Inativo'}
                      </Badge>
                      <Badge variant="outline">{prompt.category}</Badge>
                    </CardTitle>
                    <CardDescription>{prompt.description}</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    {editingPromptId === prompt.id ? (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSavePrompt(prompt.id)}
                        >
                          <Save className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditingPromptId(null)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditingPromptId(prompt.id);
                            setEditContent(prompt.content);
                          }}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeletePrompt(prompt.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {editingPromptId === prompt.id ? (
                  <Textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    rows={10}
                    className="font-mono text-sm"
                  />
                ) : (
                  <div className="bg-muted p-4 rounded-md max-h-60 overflow-y-auto">
                    <p className="text-sm font-mono whitespace-pre-wrap">
                      {prompt.content}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </>
  );
};

export default PromptConfigurationTab;