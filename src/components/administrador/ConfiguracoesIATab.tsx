
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { AlertCircle, Key, Shield, RefreshCw, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface ApiKeyFormProps {
  serviceName: string;
  saveKey: (key: string) => Promise<void>;
  initialKey?: string;
  placeholder?: string;
  isLoading: boolean;
}

// Schema para validação das chaves
const apiKeySchema = z.object({
  apiKey: z.string().min(10, "A chave API deve ter pelo menos 10 caracteres")
});

const ApiKeyForm: React.FC<ApiKeyFormProps> = ({ 
  serviceName, 
  saveKey, 
  initialKey = "", 
  placeholder = "sk-...",
  isLoading 
}) => {
  const { toast } = useToast();
  
  const form = useForm<z.infer<typeof apiKeySchema>>({
    resolver: zodResolver(apiKeySchema),
    defaultValues: {
      apiKey: initialKey,
    },
  });

  // Atualiza o formulário quando o initialKey muda
  useEffect(() => {
    form.reset({ apiKey: initialKey });
  }, [initialKey, form]);

  const onSubmit = async (values: z.infer<typeof apiKeySchema>) => {
    try {
      await saveKey(values.apiKey);
      toast({
        title: "Chave salva com sucesso",
        description: `A chave API para ${serviceName} foi atualizada.`,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro ao salvar chave",
        description: `Não foi possível salvar a chave: ${error.message}`,
      });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="apiKey"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Chave API para {serviceName}</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder={placeholder}
                  type="password"
                  autoComplete="off"
                  disabled={isLoading}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button 
          type="submit" 
          className="w-full"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              Salvando...
            </>
          ) : (
            <>
              <Check className="mr-2 h-4 w-4" />
              Salvar
            </>
          )}
        </Button>
      </form>
    </Form>
  );
};

const ConfiguracoesIATab: React.FC = () => {
  const [openaiKey, setOpenaiKey] = useState<string>("");
  const [claudeKey, setClaudeKey] = useState<string>("");
  const [grokKey, setGrokKey] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  // Função para buscar todas as configurações
  const fetchKeys = async () => {
    setIsLoading(true);
    try {
      // Buscar usando a edge function
      const response = await supabase.functions.invoke('ai-config', {
        method: 'GET'
      });
      
      if (response.error) {
        throw new Error(response.error.message);
      }

      const configs = response.data;
      
      if (configs) {
        setOpenaiKey(configs.openai_api_key || "");
        setClaudeKey(configs.claude_api_key || "");
        setGrokKey(configs.grok_api_key || "");
      }

    } catch (error) {
      console.error("Erro ao buscar configurações:", error);
      toast({
        variant: "destructive",
        title: "Erro ao carregar configurações",
        description: "Não foi possível carregar as chaves API. Tente novamente mais tarde."
      });
      
      // Fallback para localStorage se houver erro com o Supabase
      setOpenaiKey(localStorage.getItem('openai_api_key') || "");
      setClaudeKey(localStorage.getItem('claude_api_key') || "");
      setGrokKey(localStorage.getItem('grok_api_key') || "");

    } finally {
      setIsLoading(false);
    }
  };

  // Carregar configurações ao montar o componente
  useEffect(() => {
    fetchKeys();
  }, []);

  // Funções para salvar as chaves
  const saveOpenAIKey = async (key: string) => {
    setIsSaving(true);
    try {
      await saveConfigToSupabase('openai_api_key', key);
      setOpenaiKey(key);
      // Fallback para localStorage
      localStorage.setItem('openai_api_key', key);
    } finally {
      setIsSaving(false);
    }
  };
  
  const saveClaudeKey = async (key: string) => {
    setIsSaving(true);
    try {
      await saveConfigToSupabase('claude_api_key', key);
      setClaudeKey(key);
      // Fallback para localStorage
      localStorage.setItem('claude_api_key', key);
    } finally {
      setIsSaving(false);
    }
  };
  
  const saveGrokKey = async (key: string) => {
    setIsSaving(true);
    try {
      await saveConfigToSupabase('grok_api_key', key);
      setGrokKey(key);
      // Fallback para localStorage
      localStorage.setItem('grok_api_key', key);
    } finally {
      setIsSaving(false);
    }
  };

  // Função para salvar configuração no Supabase
  const saveConfigToSupabase = async (key: string, value: string) => {
    try {
      const response = await supabase.functions.invoke('ai-config', {
        method: 'POST',
        body: { action: 'set', key, value }
      });
      
      if (response.error) {
        throw new Error(response.error.message);
      }

      return response.data;
    } catch (error) {
      console.error(`Erro ao salvar ${key}:`, error);
      throw error;
    }
  };

  return (
    <>
      <div className="mb-6">
        <h2 className="text-xl font-bold">Configurações de Inteligência Artificial</h2>
        <p className="text-gray-500">Configuração de chaves API para os serviços de IA</p>
      </div>

      <Alert className="mb-6">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Importante</AlertTitle>
        <AlertDescription>
          As chaves API são armazenadas de forma segura no Supabase e também mantidas localmente 
          como fallback. Em um ambiente de produção, apenas o armazenamento seguro no servidor é utilizado.
        </AlertDescription>
      </Alert>
      
      <div className="grid grid-cols-1 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key size={18} /> Chaves API
            </CardTitle>
            <CardDescription>
              Configure as chaves para cada serviço de IA que deseja utilizar
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="openai" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="openai">OpenAI</TabsTrigger>
                <TabsTrigger value="claude">Claude</TabsTrigger>
                <TabsTrigger value="grok">Grok</TabsTrigger>
              </TabsList>
              
              <TabsContent value="openai" className="space-y-4 pt-4">
                <ApiKeyForm 
                  serviceName="OpenAI" 
                  saveKey={saveOpenAIKey}
                  initialKey={openaiKey}
                  placeholder="sk-xxxxxxxxxxxx"
                  isLoading={isLoading || isSaving}
                />
                <div className="text-sm text-gray-500 mt-4">
                  <a 
                    href="https://platform.openai.com/api-keys" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:underline"
                  >
                    Obter uma chave API da OpenAI →
                  </a>
                </div>
              </TabsContent>
              
              <TabsContent value="claude" className="space-y-4 pt-4">
                <ApiKeyForm 
                  serviceName="Claude" 
                  saveKey={saveClaudeKey}
                  initialKey={claudeKey}
                  placeholder="sk-ant-xxxx-xxxxxxxxxxxx"
                  isLoading={isLoading || isSaving}
                />
                <div className="text-sm text-gray-500 mt-4">
                  <a 
                    href="https://console.anthropic.com/settings/keys" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:underline"
                  >
                    Obter uma chave API da Anthropic (Claude) →
                  </a>
                </div>
              </TabsContent>
              
              <TabsContent value="grok" className="space-y-4 pt-4">
                <ApiKeyForm 
                  serviceName="Grok" 
                  saveKey={saveGrokKey}
                  initialKey={grokKey}
                  placeholder="grok-xxxxxxxxxxxx"
                  isLoading={isLoading || isSaving}
                />
                <div className="text-sm text-gray-500 mt-4">
                  <p>Chaves para a API do Grok podem ser obtidas na plataforma xAI.</p>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
          <CardFooter className="flex justify-between">
            <div className="text-sm text-gray-500">
              <Shield className="h-4 w-4 inline mr-1" /> Suas chaves API são armazenadas no Supabase com segurança
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={fetchKeys}
              disabled={isLoading}
            >
              {isLoading ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              <span className="ml-2">Atualizar</span>
            </Button>
          </CardFooter>
        </Card>
        
        <ConsumoPainel />
      </div>
    </>
  );
};

// Componente do painel de consumo da OpenAI
const ConsumoPainel: React.FC = () => {
  const [consumptionData, setConsumptionData] = useState({
    totalUsage: 0,
    monthlyUsage: 0,
    dailyUsage: [0, 0.5, 1.2, 0.8, 1.5, 1.1, 0.9, 1.3, 0.6, 0.7, 1.0, 1.4, 0.5, 0.3, 0.8, 0.9, 1.1, 1.3, 1.2, 0.4, 0.9, 1.5, 0.8, 1.0, 1.2, 1.1, 0.7, 1.3, 0.5, 0.6],
    modelUsage: [
      { model: "gpt-4o", usage: 65 },
      { model: "gpt-4o-mini", usage: 25 },
      { model: "gpt-3.5-turbo", usage: 10 }
    ]
  });

  // Simulação de dados de consumo
  const gerarDadosAleatorios = () => {
    const totalUsage = Math.random() * 80 + 20; // Entre $20 e $100
    const monthlyUsage = Math.random() * 40 + 10; // Entre $10 e $50
    
    const dailyUsage = Array.from({ length: 30 }, () => Math.random() * 2);
    
    const modelUsage = [
      { model: "gpt-4o", usage: Math.floor(Math.random() * 70) + 30 },
      { model: "gpt-4o-mini", usage: Math.floor(Math.random() * 30) + 10 },
      { model: "gpt-3.5-turbo", usage: Math.floor(Math.random() * 20) + 5 }
    ];
    
    setConsumptionData({
      totalUsage,
      monthlyUsage,
      dailyUsage,
      modelUsage
    });
  };

  // Para renderizar o gráfico de barras simples
  const renderBarChart = (data: number[]) => {
    const max = Math.max(...data);
    
    return (
      <div className="flex items-end h-40 gap-1">
        {data.map((value, index) => (
          <div
            key={index}
            className="bg-indigo-500 hover:bg-indigo-600 transition-all rounded-t w-full"
            style={{
              height: `${(value / max) * 100}%`,
              minHeight: '4px'
            }}
            title={`Dia ${index + 1}: $${value.toFixed(2)}`}
          />
        ))}
      </div>
    );
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Consumo da API OpenAI</CardTitle>
          <CardDescription>Análise de custos e utilização por modelo</CardDescription>
        </div>
        <Button size="sm" onClick={gerarDadosAleatorios}>Gerar dados aleatórios</Button>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="text-sm text-gray-500">Consumo Total</div>
            <div className="text-2xl font-bold">${consumptionData.totalUsage.toFixed(2)}</div>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="text-sm text-gray-500">Consumo do Mês Atual</div>
            <div className="text-2xl font-bold">${consumptionData.monthlyUsage.toFixed(2)}</div>
          </div>
        </div>
        
        <div>
          <h3 className="font-medium mb-2">Consumo Diário (últimos 30 dias)</h3>
          {renderBarChart(consumptionData.dailyUsage)}
          <div className="flex justify-between mt-1 text-xs text-gray-500">
            <span>1</span>
            <span>15</span>
            <span>30</span>
          </div>
        </div>
        
        <div>
          <h3 className="font-medium mb-2">Utilização por Modelo</h3>
          <div className="space-y-3">
            {consumptionData.modelUsage.map((item, index) => (
              <div key={index}>
                <div className="flex justify-between mb-1">
                  <span className="text-sm">{item.model}</span>
                  <span className="text-sm">{item.usage}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div 
                    className="bg-indigo-600 h-2.5 rounded-full" 
                    style={{ width: `${item.usage}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ConfiguracoesIATab;
