
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Brain, Check, X, Edit, Save } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { NtaiPromptConfig } from '@/types/ntai';
import { supabase } from '@/integrations/supabase/client';

interface AdminSettings {
  id?: string;
  ntai_prompts?: NtaiPromptConfig[];
  [key: string]: any;
}

const defaultPrompts: NtaiPromptConfig[] = [
  {
    id: "summary-prompt",
    name: "Extração de Resumo",
    description: "Extrai um resumo conciso do estudo, com no máximo 30 palavras, incluindo nota de relevância baseada em citações e prestígio da publicação",
    prompt: "Analise este estudo científico e extraia um resumo conciso de no máximo 30 palavras. Avalie também a relevância científica com base em citações, autores e prestígio da revista, fornecendo uma nota de 0 a 5.",
    systemPrompt: "Você é um especialista em análise de literatura científica sobre nutracêuticos em medicina veterinária. Sua tarefa é extrair informações essenciais e avaliar a qualidade científica dos estudos.",
    stage: "summary",
    active: true
  },
  {
    id: "nutraceuticals-prompt",
    name: "Extração de Nutracêuticos",
    description: "Identifica os nutracêuticos estudados e cria tags associadas",
    prompt: "Analise este estudo científico e identifique todos os nutracêuticos ou combinações de nutracêuticos mencionados. Para cada um, extraia o nome, dosagem (se disponível) e nível de confiança na identificação.",
    systemPrompt: "Você é um especialista em nutracêuticos para medicina veterinária. Sua tarefa é identificar com precisão os compostos nutracêuticos estudados.",
    stage: "nutraceuticals",
    active: true
  },
  {
    id: "conditions-prompt",
    name: "Extração de Condições",
    description: "Identifica as condições de saúde estudadas e avalia a eficácia dos nutracêuticos para cada uma",
    prompt: "Analise este estudo e identifique todas as condições de saúde mencionadas. Para cada condição, avalie a eficácia do nutracêutico estudado em uma escala de 0 a 5, onde 0 significa nenhum efeito e 5 significa eficácia excelente.",
    systemPrompt: "Você é um especialista em medicina veterinária focado na avaliação da eficácia de nutracêuticos para diferentes condições de saúde.",
    stage: "conditions",
    active: true
  },
  {
    id: "interactions-prompt",
    name: "Extração de Interações",
    description: "Identifica interações entre nutracêuticos ou com medicamentos",
    prompt: "Analise este estudo e identifique quaisquer interações mencionadas entre o nutracêutico principal e outros compostos, sejam nutracêuticos ou medicamentos. Classifique cada interação como positiva ou negativa, e atribua uma pontuação de impacto de 0 a 5.",
    systemPrompt: "Você é um especialista em farmacologia e nutrição veterinária, focado na identificação de interações entre compostos.",
    stage: "interactions",
    active: true
  },
  {
    id: "additional-prompt",
    name: "Extração de Informações Adicionais",
    description: "Extrai dados sobre população, duração, metodologia e resultados do estudo",
    prompt: "Extraia as seguintes informações do estudo: tipo de população (humanos, cães, gatos, roedores, etc.), tamanho da amostra, duração do estudo, principais resultados e metodologia utilizada.",
    systemPrompt: "Você é um especialista em metodologia científica para estudos veterinários, focado na extração precisa de dados metodológicos.",
    stage: "additional",
    active: true
  }
];

const PromptEditor: React.FC<{
  prompt: NtaiPromptConfig;
  onSave: (updatedPrompt: NtaiPromptConfig) => void;
  onCancel: () => void;
}> = ({ prompt, onSave, onCancel }) => {
  const [editedPrompt, setEditedPrompt] = useState<NtaiPromptConfig>({...prompt});
  
  const handleChange = (field: keyof NtaiPromptConfig, value: string) => {
    setEditedPrompt(prev => ({ ...prev, [field]: value }));
  };
  
  return (
    <div className="space-y-4 mt-4 border p-4 rounded-md bg-gray-50">
      <div className="space-y-2">
        <Label htmlFor="name">Nome</Label>
        <Input 
          id="name" 
          value={editedPrompt.name} 
          onChange={(e) => handleChange('name', e.target.value)} 
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="description">Descrição</Label>
        <Input 
          id="description" 
          value={editedPrompt.description} 
          onChange={(e) => handleChange('description', e.target.value)} 
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="systemPrompt">System Prompt</Label>
        <Textarea 
          id="systemPrompt" 
          value={editedPrompt.systemPrompt || ''} 
          onChange={(e) => handleChange('systemPrompt', e.target.value)}
          className="min-h-[100px]" 
        />
        <p className="text-xs text-gray-500">Instruções para o sistema sobre como se comportar e o que focar.</p>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="prompt">Prompt Principal</Label>
        <Textarea 
          id="prompt" 
          value={editedPrompt.prompt} 
          onChange={(e) => handleChange('prompt', e.target.value)}
          className="min-h-[200px]" 
        />
        <p className="text-xs text-gray-500">O prompt específico para esta etapa de processamento.</p>
      </div>
      
      <div className="flex gap-2 justify-end">
        <Button variant="outline" onClick={onCancel}>
          <X className="mr-2 h-4 w-4" /> Cancelar
        </Button>
        <Button onClick={() => onSave(editedPrompt)}>
          <Save className="mr-2 h-4 w-4" /> Salvar
        </Button>
      </div>
    </div>
  );
};

const PromptCard: React.FC<{
  prompt: NtaiPromptConfig;
  onEdit: () => void;
}> = ({ prompt, onEdit }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-primary" />
          {prompt.name}
          {prompt.active ? (
            <Badge variant="outline" className="ml-2 bg-green-100 text-green-800 text-xs">
              Ativo
            </Badge>
          ) : (
            <Badge variant="outline" className="ml-2 bg-gray-100 text-gray-800 text-xs">
              Inativo
            </Badge>
          )}
        </CardTitle>
        <CardDescription>{prompt.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="bg-gray-100 p-4 rounded-md mb-4 h-40 overflow-y-auto">
          <p className="text-sm font-mono text-gray-700 whitespace-pre-wrap">
            {prompt.prompt}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onEdit}>
            <Edit className="mr-2 h-4 w-4" />
            Editar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

const NtaiPromptsTab: React.FC = () => {
  const [prompts, setPrompts] = useState<NtaiPromptConfig[]>([]);
  const [editingPromptId, setEditingPromptId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("summary");
  const { toast } = useToast();
  
  useEffect(() => {
    const loadPrompts = async () => {
      try {
        // Tenta buscar do banco de dados
        const { data: adminSettings, error } = await supabase
          .from('admin_settings')
          .select('*')
          .single();
        
        if (error || !adminSettings) {
          console.log("Usando prompts padrão:", defaultPrompts);
          setPrompts(defaultPrompts);
        } else {
          const settings = adminSettings as AdminSettings;
          if (settings.ntai_prompts) {
            console.log("Prompts carregados do banco:", settings.ntai_prompts);
            setPrompts(settings.ntai_prompts);
          } else {
            console.log("Usando prompts padrão (não encontrados no banco):", defaultPrompts);
            setPrompts(defaultPrompts);
          }
        }
      } catch (error) {
        console.error("Erro ao carregar prompts:", error);
        setPrompts(defaultPrompts);
      }
    };
    
    loadPrompts();
  }, []);
  
  const handleSavePrompt = async (updatedPrompt: NtaiPromptConfig) => {
    try {
      const updatedPrompts = prompts.map((p) =>
        p.id === updatedPrompt.id ? updatedPrompt : p
      );
      setPrompts(updatedPrompts);
      
      // Salvar prompts no banco de dados
      const { error } = await supabase
        .from('admin_settings')
        .upsert({ 
          id: 'ntai-settings',
          ntai_prompts: updatedPrompts
        });
      
      if (error) throw error;
      
      setEditingPromptId(null);
      toast({
        title: "Prompt atualizado",
        description: `O prompt "${updatedPrompt.name}" foi atualizado com sucesso.`,
      });
    } catch (error) {
      console.error("Erro ao salvar prompt:", error);
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar as alterações.",
        variant: "destructive",
      });
    }
  };
  
  const filteredPrompts = prompts.filter(prompt => prompt.stage === activeTab);
  
  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold">Configuração de Prompts NTAI</h2>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="summary">Resumo</TabsTrigger>
          <TabsTrigger value="nutraceuticals">Nutracêuticos</TabsTrigger>
          <TabsTrigger value="conditions">Condições</TabsTrigger>
          <TabsTrigger value="interactions">Interações</TabsTrigger>
          <TabsTrigger value="additional">Informações Adicionais</TabsTrigger>
        </TabsList>
        
        <TabsContent value={activeTab}>
          <div className="mb-6">
            <p className="text-gray-600">
              Configure os prompts utilizados para extrair informações específicas dos estudos científicos durante a análise NTAI.
            </p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
            {filteredPrompts.map((prompt) => (
              <React.Fragment key={prompt.id}>
                {editingPromptId === prompt.id ? (
                  <PromptEditor
                    prompt={prompt}
                    onSave={handleSavePrompt}
                    onCancel={() => setEditingPromptId(null)}
                  />
                ) : (
                  <PromptCard
                    prompt={prompt}
                    onEdit={() => setEditingPromptId(prompt.id)}
                  />
                )}
              </React.Fragment>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </>
  );
};

export default NtaiPromptsTab;
