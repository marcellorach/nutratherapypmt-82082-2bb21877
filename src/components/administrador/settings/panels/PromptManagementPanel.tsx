
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

/**
 * Painel para gerenciamento de prompts do sistema
 * Este é um componente placeholder que será implementado futuramente
 */
const PromptManagementPanel: React.FC = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = React.useState('system');
  
  // Mock data de exemplo
  const [systemPrompt, setSystemPrompt] = React.useState(
    'Você é um assistente especialista em nutracêuticos para pets, capaz de recomendar suplementos...'
  );
  
  const [userPrompt, setUserPrompt] = React.useState(
    'Com base nas informações fornecidas sobre o pet, recomende nutracêuticos que possam...'
  );

  const handleSavePrompt = () => {
    // Simulação de salvamento
    toast({
      title: "Prompt salvo",
      description: "As alterações foram salvas com sucesso",
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gerenciamento de Prompts</CardTitle>
        <CardDescription>Configure os prompts utilizados pelo sistema de IA</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="system">Prompt do Sistema</TabsTrigger>
            <TabsTrigger value="user">Prompt do Usuário</TabsTrigger>
          </TabsList>
          
          <TabsContent value="system" className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Este prompt define o comportamento base do modelo de IA e é enviado no início de cada conversa.
              </p>
              <Textarea 
                value={systemPrompt}
                onChange={e => setSystemPrompt(e.target.value)}
                rows={10}
                className="font-mono text-sm"
              />
            </div>
          </TabsContent>
          
          <TabsContent value="user" className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Este prompt é combinado com os dados do pet para gerar recomendações personalizadas.
              </p>
              <Textarea 
                value={userPrompt}
                onChange={e => setUserPrompt(e.target.value)}
                rows={10}
                className="font-mono text-sm"
              />
            </div>
          </TabsContent>
        </Tabs>
        
        <div className="flex justify-end">
          <Button onClick={handleSavePrompt}>
            Salvar Alterações
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default PromptManagementPanel;
