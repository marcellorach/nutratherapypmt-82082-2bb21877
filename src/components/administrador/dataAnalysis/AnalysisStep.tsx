
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Brain, Bot, MessageSquare, CheckCircle } from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";

const AnalysisStep: React.FC = () => {
  const [analyzing, setAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [step, setStep] = useState<'waiting' | 'processing' | 'completed'>('waiting');
  const [messages, setMessages] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState("gpt4o");
  
  const simulateAnalysis = () => {
    setAnalyzing(true);
    setProgress(0);
    setStep('processing');
    setMessages([]);
    
    const modelMessages = [
      "Inicializando análise populacional de dados de pets...",
      "Carregando 2.341 registros de pets...",
      "Analisando distribuição de espécies e raças...",
      "Processando 1.876 exames clínicos e laboratoriais...",
      "Identificando padrões em condições de saúde por idade e raça...",
      "Correlacionando tratamentos anteriores com resultados clínicos...",
      "Aplicando algoritmo de análise de comorbidades...",
      "Calculando estatísticas de prevalência de doenças por região...",
      "Gerando insights sobre eficácia de tratamentos anteriores...",
      "Criando recomendações de nutracêuticos com base em evidências...",
      "Estratificando recomendações por perfil e histórico clínico...",
      "Preparando resultados e visualização de dados...",
      "Análise completa! Processados 5.487 registros."
    ];
    
    let messageIndex = 0;
    
    const interval = setInterval(() => {
      if (messageIndex < modelMessages.length) {
        setMessages(prev => [...prev, modelMessages[messageIndex]]);
        messageIndex++;
      }
      
      setProgress(prev => {
        const increment = 100 / modelMessages.length;
        const newProgress = prev + increment;
        
        if (newProgress >= 100) {
          clearInterval(interval);
          setAnalyzing(false);
          setStep('completed');
          return 100;
        }
        
        return newProgress;
      });
    }, 1500);
  };
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Análise de IA</h2>
          <p className="text-gray-600">Processamento avançado dos dados com modelos de IA</p>
        </div>
      </div>
      
      <Tabs defaultValue="gpt4o" className="w-full">
        <TabsList className="grid w-full md:w-[400px] grid-cols-3">
          <TabsTrigger value="gpt4o">GPT-4o</TabsTrigger>
          <TabsTrigger value="claude">Claude 3</TabsTrigger>
          <TabsTrigger value="llama">Llama 3</TabsTrigger>
        </TabsList>
        
        <TabsContent value="gpt4o">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center">
                  <Bot className="mr-2 h-5 w-5 text-purple-500" />
                  Análise com GPT-4o
                </CardTitle>
                {step === 'completed' && (
                  <div className="flex items-center text-green-600 text-sm">
                    <CheckCircle className="mr-1 h-4 w-4" />
                    Análise Completa
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-sm text-gray-600">
                  O GPT-4o analisa dados clínicos, comportamentais e nutricionais para gerar recomendações personalizadas.
                </div>
                
                {step !== 'waiting' && (
                  <>
                    <div className="space-y-2">
                      <Progress value={progress} className="h-2 w-full" />
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>{step === 'completed' ? 'Concluído' : 'Processando...'}</span>
                        <span>{Math.round(progress)}%</span>
                      </div>
                    </div>
                    
                    <div className="h-80 overflow-y-auto rounded-md border border-gray-200 bg-black p-4 text-sm">
                      <div className="font-mono text-green-400">
                        {messages.map((message, index) => (
                          <div key={index} className="py-1">
                            <span className="text-blue-400">{">"}</span> {message}
                          </div>
                        ))}
                        {step === 'processing' && (
                          <div className="mt-1 flex items-center">
                            <span className="text-blue-400">{">"}</span> 
                            <span className="ml-1 h-4 w-2 animate-blink bg-green-400"></span>
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button 
                onClick={simulateAnalysis}
                disabled={analyzing}
              >
                {analyzing ? (
                  <span className="flex items-center">
                    <svg className="mr-2 h-4 w-4 animate-spin" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Analisando...
                  </span>
                ) : (
                  <>
                    <Brain className="mr-2 h-4 w-4" />
                    {step === 'completed' ? 'Executar Novamente' : 'Iniciar Análise'}
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="claude">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Bot className="mr-2 h-5 w-5 text-blue-500" />
                Análise com Claude 3
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-gray-500">
                <MessageSquare className="mx-auto mb-4 h-12 w-12 opacity-20" />
                <h3 className="text-lg font-medium mb-2">Análise Disponível</h3>
                <p className="max-w-md mx-auto text-sm">
                  Claude 3 Opus pode processar seus dados para identificar padrões complexos e gerar recomendações baseadas em evidências.
                </p>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button>
                <Brain className="mr-2 h-4 w-4" />
                Iniciar Análise
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="llama">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Bot className="mr-2 h-5 w-5 text-orange-500" />
                Análise com Llama 3
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-gray-500">
                <MessageSquare className="mx-auto mb-4 h-12 w-12 opacity-20" />
                <h3 className="text-lg font-medium mb-2">Análise Disponível</h3>
                <p className="max-w-md mx-auto text-sm">
                  Llama 3 pode processar seus dados para identificar padrões e gerar recomendações personalizadas.
                </p>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button>
                <Brain className="mr-2 h-4 w-4" />
                Iniciar Análise
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
      
      {step === 'completed' && (
        <Card className="mt-6 bg-green-50">
          <CardHeader>
            <CardTitle className="flex items-center text-green-700">
              <CheckCircle className="mr-2 h-5 w-5" />
              Análise Concluída com Sucesso
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-gray-700">
                A análise dos dados foi concluída com sucesso. Os resultados estão prontos para visualização.
              </p>
              
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-md border border-gray-200 bg-white p-4">
                  <h4 className="font-medium mb-2">Resumo da Análise</h4>
                  <ul className="text-sm space-y-1 text-gray-600">
                    <li>• 2.341 pets processados</li>
                    <li>• 1.876 exames analisados</li>
                    <li>• 1.270 tratamentos avaliados</li>
                    <li>• 843 recomendações geradas</li>
                  </ul>
                </div>
                
                <div className="rounded-md border border-gray-200 bg-white p-4">
                  <h4 className="font-medium mb-2">Próximos Passos</h4>
                  <ul className="text-sm space-y-1 text-gray-600">
                    <li>• Visualizar resultados por segmento</li>
                    <li>• Analisar correlações clínicas</li>
                    <li>• Avaliar recomendações de tratamento</li>
                    <li>• Gerar relatórios para veterinários</li>
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AnalysisStep;
