
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

// Mock data for engines & prompts
const enginesMock = [
  {
    id: "1",
    name: "NTAI Engine",
    description: "Núcleo de Tratamento de Análises Integradas - Processa análises científicas para extrair correlações estruturadas",
    status: "active",
    version: "1.2.0",
    updated: "2024-04-15"
  },
  {
    id: "2",
    name: "Meta-análise Engine",
    description: "Processa meta-análises de estudos científicos para consolidar evidências",
    status: "active",
    version: "0.9.5",
    updated: "2024-04-10"
  }
];

// Mock prompts
const promptsMock = [
  {
    id: "1",
    name: "Extração de Correlações NTAI",
    content: `Você é um assistente especializado na análise e extração de informações de estudos científicos sobre nutracêuticos para animais de estimação. Sua tarefa é:

1. Extrair todos os nutracêuticos mencionados e seus efeitos
2. Identificar correlações entre nutracêuticos e condições médicas
3. Quantificar o nível de evidência científica (1-5)
4. Identificar possíveis efeitos colaterais e interações
5. Apresentar os dados em formato estruturado para integração ao sistema NTAI`,
    model: "gpt-4o",
    created: "2024-04-01",
    updated: "2024-04-18"
  },
  {
    id: "2",
    name: "Análise de Meta-sumário",
    content: `Analise este meta-sumário de estudos científicos e extraia:

1. Principais conclusões consolidadas
2. Nível de confiança estatística (p-value quando disponível)
3. Tamanho acumulado da amostra
4. Principais hipóteses confirmadas e refutadas
5. Recomendações para dosagens e regimes de tratamento
6. Potenciais vieses identificados nos estudos`,
    model: "gpt-4o",
    created: "2024-03-25",
    updated: "2024-04-10"
  }
];

const EnginesConvencoesTab: React.FC = () => {
  const [activeTab, setActiveTab] = useState('engines'); 
  const [selectedEngine, setSelectedEngine] = useState<string | null>(null);
  const [selectedPrompt, setSelectedPrompt] = useState<string | null>(null);
  
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold tracking-tight">Engines & Convenções</h2>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList>
          <TabsTrigger value="engines">Engines & Prompts</TabsTrigger>
          <TabsTrigger value="convencoes">Convenções de Design</TabsTrigger>
        </TabsList>
        
        <TabsContent value="engines" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Engines</CardTitle>
                <CardDescription>Motores de processamento para análises científicas</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {enginesMock.map(engine => (
                    <div 
                      key={engine.id}
                      className={`p-3 border rounded-md cursor-pointer hover:bg-slate-50 ${
                        selectedEngine === engine.id ? 'ring-2 ring-blue-400 bg-blue-50' : ''
                      }`}
                      onClick={() => setSelectedEngine(engine.id)}
                    >
                      <div className="flex justify-between">
                        <h3 className="font-medium">{engine.name}</h3>
                        <span className="text-xs px-2 py-0.5 bg-green-100 text-green-800 rounded-full">
                          {engine.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{engine.description}</p>
                      <div className="flex justify-between mt-2 text-xs text-gray-500">
                        <span>Versão: {engine.version}</span>
                        <span>Atualizado: {engine.updated}</span>
                      </div>
                    </div>
                  ))}
                  
                  <Button variant="outline" className="w-full">
                    Adicionar novo engine
                  </Button>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Prompts</CardTitle>
                <CardDescription>Instruções de processamento para os engines</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {promptsMock.map(prompt => (
                    <div 
                      key={prompt.id}
                      className={`p-3 border rounded-md cursor-pointer hover:bg-slate-50 ${
                        selectedPrompt === prompt.id ? 'ring-2 ring-blue-400 bg-blue-50' : ''
                      }`}
                      onClick={() => setSelectedPrompt(prompt.id)}
                    >
                      <h3 className="font-medium">{prompt.name}</h3>
                      <div className="mt-2 text-sm text-gray-600 max-h-24 overflow-y-auto">
                        <pre className="text-xs whitespace-pre-wrap">
                          {prompt.content.length > 200 
                            ? `${prompt.content.substring(0, 200)}...` 
                            : prompt.content}
                        </pre>
                      </div>
                      <div className="flex justify-between mt-2 text-xs text-gray-500">
                        <span>Modelo: {prompt.model}</span>
                        <span>Atualizado: {prompt.updated}</span>
                      </div>
                    </div>
                  ))}
                  
                  <Button variant="outline" className="w-full">
                    Adicionar novo prompt
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {(selectedEngine || selectedPrompt) && (
            <Card>
              <CardHeader>
                <CardTitle>
                  {selectedEngine && enginesMock.find(e => e.id === selectedEngine)?.name}
                  {selectedPrompt && promptsMock.find(p => p.id === selectedPrompt)?.name}
                </CardTitle>
                <CardDescription>
                  {selectedEngine && "Configurações do Engine"}
                  {selectedPrompt && "Edição do Prompt"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {selectedPrompt && (
                  <div className="space-y-4">
                    <textarea 
                      className="w-full h-64 p-3 border rounded"
                      defaultValue={promptsMock.find(p => p.id === selectedPrompt)?.content}
                    />
                    <div className="flex justify-end space-x-2">
                      <Button variant="outline">Cancelar</Button>
                      <Button>Salvar Alterações</Button>
                    </div>
                  </div>
                )}
                
                {selectedEngine && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">Nome do Engine</label>
                        <input 
                          type="text" 
                          className="w-full p-2 border rounded"
                          defaultValue={enginesMock.find(e => e.id === selectedEngine)?.name}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Versão</label>
                        <input 
                          type="text" 
                          className="w-full p-2 border rounded"
                          defaultValue={enginesMock.find(e => e.id === selectedEngine)?.version}
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-1">Descrição</label>
                      <textarea 
                        className="w-full h-24 p-2 border rounded"
                        defaultValue={enginesMock.find(e => e.id === selectedEngine)?.description}
                      />
                    </div>
                    
                    <div className="flex justify-end space-x-2">
                      <Button variant="outline">Cancelar</Button>
                      <Button>Salvar Alterações</Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="convencoes">
          <Card>
            <CardHeader>
              <CardTitle>Convenções de Design</CardTitle>
              <CardDescription>Diretrizes e padrões para o desenvolvimento do sistema</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="border rounded-md p-4">
                  <h3 className="font-medium mb-2">Elementos Visuais</h3>
                  <ul className="list-disc pl-5 space-y-1">
                    <li className="text-sm">Design clean e minimalista inspirado no design Google</li>
                    <li className="text-sm">Elementos finos e elegantes, predominantemente em preto</li>
                    <li className="text-sm">Paleta de cores pastéis diferenciadas (não apenas tons da mesma cor)</li>
                    <li className="text-sm">Tipografia clara e legível em todas as interfaces</li>
                  </ul>
                </div>
                
                <div className="border rounded-md p-4">
                  <h3 className="font-medium mb-2">Navegação e Usabilidade</h3>
                  <ul className="list-disc pl-5 space-y-1">
                    <li className="text-sm">Interfaces específicas para cada perfil de usuário</li>
                    <li className="text-sm">Sistema de níveis de informação (básico → detalhado → científico)</li>
                    <li className="text-sm">Acesso rápido a histórico e recomendações</li>
                    <li className="text-sm">Fluxos intuitivos para cada persona</li>
                  </ul>
                </div>
                
                <div className="border rounded-md p-4">
                  <h3 className="font-medium mb-2">Elementos Funcionais</h3>
                  <ul className="list-disc pl-5 space-y-1">
                    <li className="text-sm">Elementos gráficos funcionais e informativos (não apenas decorativos)</li>
                    <li className="text-sm">Visualizações expansíveis com diferentes níveis de detalhamento</li>
                    <li className="text-sm">Indicadores visuais de progressão do tratamento</li>
                    <li className="text-sm">Representações visuais das correlações entre nutracêuticos e condições de saúde</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EnginesConvencoesTab;
