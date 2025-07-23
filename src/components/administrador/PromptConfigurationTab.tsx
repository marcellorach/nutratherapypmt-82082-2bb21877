import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, Brain, Save, Edit, Trash2 } from "lucide-react";

const PromptConfigurationTab: React.FC = () => {
  const [prompts, setPrompts] = useState([
    {
      id: '1',
      name: 'Análise de Nutracêuticos',
      description: 'Prompt para análise inicial de nutracêuticos',
      content: 'Analise o seguinte nutracêutico considerando...',
      category: 'analysis',
      isActive: true
    },
    {
      id: '2',
      name: 'Recomendações Clínicas',
      description: 'Prompt para gerar recomendações clínicas',
      content: 'Com base nos dados clínicos apresentados...',
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
        name: 'Avaliação de Eficácia',
        description: 'Prompt para avaliar eficácia de composições',
        content: 'Avalie a eficácia da seguinte composição nutracêutica...',
        category: 'evaluation',
        isActive: true
      }
    ];
    
    setPrompts(prev => [...prev, ...randomPrompts]);
    toast({
      title: "Prompts gerados",
      description: "Novos prompts de exemplo foram adicionados.",
    });
  };

  const handleSavePrompt = (promptId: string, updatedContent: string) => {
    setPrompts(prev => prev.map(p => 
      p.id === promptId ? { ...p, content: updatedContent } : p
    ));
    setEditingPrompt(null);
    toast({
      title: "Prompt salvo",
      description: "O prompt foi atualizado com sucesso.",
    });
  };

  const handleCreatePrompt = () => {
    if (!newPrompt.name || !newPrompt.content) {
      toast({
        title: "Erro",
        description: "Nome e conteúdo são obrigatórios.",
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
      title: "Prompt criado",
      description: "Novo prompt foi adicionado com sucesso.",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Configuração de Prompts</h2>
        <div className="flex gap-2">
          <Button variant="outline" onClick={generateRandomPrompts}>
            <Brain className="h-4 w-4 mr-2" />
            Gerar Prompts Exemplo
          </Button>
          <Button onClick={() => setIsCreating(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Prompt
          </Button>
        </div>
      </div>

      {/* Formulário de Criação */}
      {isCreating && (
        <Card>
          <CardHeader>
            <CardTitle>Criar Novo Prompt</CardTitle>
            <CardDescription>
              Configure um novo prompt para a IA
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="prompt-name">Nome do Prompt</Label>
                <Input
                  id="prompt-name"
                  value={newPrompt.name}
                  onChange={(e) => setNewPrompt(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Nome do prompt"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="prompt-category">Categoria</Label>
                <select
                  id="prompt-category"
                  className="w-full p-2 border rounded-md"
                  value={newPrompt.category}
                  onChange={(e) => setNewPrompt(prev => ({ ...prev, category: e.target.value }))}
                >
                  <option value="analysis">Análise</option>
                  <option value="clinical">Clínico</option>
                  <option value="evaluation">Avaliação</option>
                  <option value="recommendation">Recomendação</option>
                </select>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="prompt-description">Descrição</Label>
              <Input
                id="prompt-description"
                value={newPrompt.description}
                onChange={(e) => setNewPrompt(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Descrição do prompt"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="prompt-content">Conteúdo do Prompt</Label>
              <Textarea
                id="prompt-content"
                value={newPrompt.content}
                onChange={(e) => setNewPrompt(prev => ({ ...prev, content: e.target.value }))}
                placeholder="Digite o conteúdo do prompt..."
                rows={6}
              />
            </div>
            
            <div className="flex gap-2">
              <Button onClick={handleCreatePrompt}>
                <Save className="h-4 w-4 mr-2" />
                Salvar Prompt
              </Button>
              <Button variant="outline" onClick={() => setIsCreating(false)}>
                Cancelar
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
                      {prompt.isActive ? "Ativo" : "Inativo"}
                    </Badge>
                    <Badge variant="outline">{prompt.category}</Badge>
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
                        title: "Prompt removido",
                        description: "O prompt foi excluído com sucesso.",
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
                      Salvar
                    </Button>
                    <Button variant="outline" onClick={() => setEditingPrompt(null)}>
                      Cancelar
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