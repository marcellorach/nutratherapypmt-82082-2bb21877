
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from '@/components/ui/switch';
import { Slider } from "@/components/ui/slider";

interface EnginesPanelProps {
  section: 'knowledge-base' | 'data-processing' | 'research' | 'predictive-analysis';
}

const MODELS = [
  { value: 'gpt-4o-mini', label: 'GPT-4o Mini - Rápido e econômico' },
  { value: 'gpt-4o', label: 'GPT-4o - Alta performance' },
  { value: 'gpt-4-vision', label: 'GPT-4 Vision - Processamento de imagens' },
  { value: 'gpt-4-turbo', label: 'GPT-4 Turbo - Alta velocidade e performance' },
  { value: 'ora-linuxvete', label: 'ORA Biomedical - Interpretação Veterinária' },
];

const SECTION_PROMPTS: Record<string, string> = {
  'knowledge-base': 'Você é um assistente especializado em conhecimento nutracêutico veterinário. Sua tarefa é extrair informações precisas sobre nutracêuticos, suas propriedades, interações e aplicações clínicas de estudos científicos.',
  'data-processing': 'Você é um analista de dados especializado em processamento de estudos científicos veterinários. Sua tarefa é identificar padrões, correlações e insights em dados de pesquisas sobre nutracêuticos para aplicações veterinárias.',
  'research': 'Você é um pesquisador especializado em desenvolvimento de nutracêuticos veterinários. Sua tarefa é analisar tendências de pesquisa, identificar lacunas de conhecimento e propor novas linhas de investigação.',
  'predictive-analysis': 'Você é um modelo preditivo especializado em nutracêuticos veterinários. Sua tarefa é prever eficácia, efeitos colaterais e interações medicamentosas com base em dados históricos e perfis clínicos.'
};

const EnginesPromptsPanel: React.FC<EnginesPanelProps> = ({ section }) => {
  const [selectedModel, setSelectedModel] = useState('gpt-4o');
  const [systemPrompt, setSystemPrompt] = useState(SECTION_PROMPTS[section]);
  const [temperature, setTemperature] = useState([0.7]);
  const [isActive, setIsActive] = useState(true);
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Configuração de Engine</CardTitle>
          <CardDescription>
            Configure a engine de IA utilizada para esta seção
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="model-selector">Modelo de IA</Label>
              <Switch 
                checked={isActive} 
                onCheckedChange={setIsActive} 
                id="active-switch"
              />
            </div>
            <Select value={selectedModel} onValueChange={setSelectedModel}>
              <SelectTrigger id="model-selector">
                <SelectValue placeholder="Selecione um modelo" />
              </SelectTrigger>
              <SelectContent>
                {MODELS.map(model => (
                  <SelectItem key={model.value} value={model.value}>
                    {model.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="temperature">Temperatura: {temperature[0].toFixed(1)}</Label>
            <Slider
              id="temperature"
              min={0}
              max={1}
              step={0.1}
              value={temperature}
              onValueChange={setTemperature}
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>Mais preciso</span>
              <span>Mais criativo</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="system-prompt">Prompt de Sistema</Label>
            <ScrollArea className="h-[200px] w-full rounded-md border">
              <Textarea
                id="system-prompt"
                className="min-h-[200px] resize-none border-0"
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
                placeholder="Insira um prompt para guiar o comportamento da IA"
              />
            </ScrollArea>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline">Restaurar Padrão</Button>
          <Button>Salvar Configurações</Button>
        </CardFooter>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Prompts Especializados</CardTitle>
          <CardDescription>
            Configure prompts específicos para diferentes operações dentro desta seção
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="border rounded-md p-4">
              <Label htmlFor="extract-prompt" className="font-semibold">Extração de Dados</Label>
              <Textarea
                id="extract-prompt"
                className="mt-2"
                placeholder="Prompt para extração de dados específicos"
              />
            </div>
            
            <div className="border rounded-md p-4">
              <Label htmlFor="analyze-prompt" className="font-semibold">Análise de Resultados</Label>
              <Textarea
                id="analyze-prompt"
                className="mt-2"
                placeholder="Prompt para análise de resultados"
              />
            </div>
            
            <div className="border rounded-md p-4">
              <Label htmlFor="summarize-prompt" className="font-semibold">Sumarização</Label>
              <Textarea
                id="summarize-prompt"
                className="mt-2"
                placeholder="Prompt para sumarização de resultados"
              />
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button className="w-full">Salvar Todos os Prompts</Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default EnginesPromptsPanel;
