
import React, { useState } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

const PromptManagementPanel: React.FC = () => {
  const { toast } = useToast();
  const [selectedModelType, setSelectedModelType] = useState("default");
  const [selectedPromptType, setSelectedPromptType] = useState("nutraceuticals");
  const [promptContent, setPromptContent] = useState("");
  
  // Dados de exemplo para os prompts
  const promptTypes = [
    { id: "nutraceuticals", name: "Nutracêuticos" },
    { id: "chronic_diseases", name: "Doenças Crônicas" },
    { id: "continuous_medication", name: "Medicação Contínua" },
    { id: "sporadic_medication", name: "Medicação Esporádica" },
    { id: "health_assistant", name: "Assistente de Saúde" }
  ];

  const modelTypes = [
    { id: "default", name: "Padrão" },
    { id: "system", name: "Sistema" }
  ];

  const handleSave = () => {
    // Simulando uma operação de salvamento
    toast({
      title: "Prompt salvo",
      description: `${selectedPromptType}_${selectedModelType}_prompt atualizado com sucesso.`,
    });
  };

  const handleLoadExistingPrompt = () => {
    // Simulando carregamento de um prompt existente
    setPromptContent(
      `Este é um prompt de exemplo para ${selectedPromptType} no modo ${selectedModelType}.\n\nAqui seriam carregadas as instruções específicas para o processamento deste tipo de conteúdo pelo modelo de IA.`
    );
  };

  // Carregar o prompt quando o tipo selecionado mudar
  React.useEffect(() => {
    handleLoadExistingPrompt();
  }, [selectedPromptType, selectedModelType]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Gerenciamento de Prompts IA</h3>
        <Button onClick={handleSave}>
          Salvar Alterações
        </Button>
      </div>
      
      <Card className="p-6">
        <div className="grid gap-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="promptType">Tipo de Prompt</Label>
              <Select 
                value={selectedPromptType} 
                onValueChange={setSelectedPromptType}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo de prompt" />
                </SelectTrigger>
                <SelectContent>
                  {promptTypes.map(type => (
                    <SelectItem key={type.id} value={type.id}>
                      {type.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="modelType">Tipo de Modelo</Label>
              <Select 
                value={selectedModelType} 
                onValueChange={setSelectedModelType}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo de modelo" />
                </SelectTrigger>
                <SelectContent>
                  {modelTypes.map(type => (
                    <SelectItem key={type.id} value={type.id}>
                      {type.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div>
            <Label htmlFor="promptContent">Conteúdo do Prompt</Label>
            <Textarea
              id="promptContent"
              value={promptContent}
              onChange={(e) => setPromptContent(e.target.value)}
              className="h-[400px] font-mono text-sm"
              placeholder="Digite o conteúdo do prompt..."
            />
          </div>
          
          <div className="text-sm text-gray-500">
            <p>Variáveis disponíveis:</p>
            <ul className="list-disc pl-5 mt-2">
              <li><code>{"{pet_name}"}</code> - Nome do pet</li>
              <li><code>{"{pet_age}"}</code> - Idade do pet</li>
              <li><code>{"{pet_breed}"}</code> - Raça do pet</li>
              <li><code>{"{pet_weight}"}</code> - Peso do pet</li>
              <li><code>{"{health_conditions}"}</code> - Condições de saúde do pet</li>
            </ul>
          </div>
        </div>
      </Card>
      
      <Card className="p-6">
        <h4 className="text-md font-medium mb-4">Histórico de Alterações</h4>
        <div className="space-y-2">
          {[1, 2, 3].map((item) => (
            <div key={item} className="text-sm p-3 border rounded-md flex justify-between items-center">
              <div>
                <span className="font-medium">{selectedPromptType}_prompt</span> 
                <span className="text-gray-500"> - Alterado em {new Date().toLocaleDateString()}</span>
              </div>
              <Button variant="outline" size="sm">
                Restaurar
              </Button>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default PromptManagementPanel;
