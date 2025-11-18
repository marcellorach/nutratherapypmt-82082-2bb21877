
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Shield, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import ApiKeyForm from './configuracoes/ApiKeyForm';
import ConsumoPainel from './configuracoes/ConsumoPainel';
import ConfiguracoesAvisosIA from './configuracoes/ConfiguracoesAvisosIA';
import ApiStatusItem from './configuracoes/ApiStatusItem';

const ConfiguracoesIATab: React.FC = () => {
  const [openaiKey, setOpenaiKey] = useState<string>("");
  const [claudeKey, setClaudeKey] = useState<string>("");
  const [grokKey, setGrokKey] = useState<string>("");
  const [unstructuredKey, setUnstructuredKey] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const fetchKeys = async () => {
    setIsLoading(true);
    try {
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
        setUnstructuredKey(configs.unstructured_api_key || "");
      }

    } catch (error) {
      console.error("Erro ao buscar configurações:", error);
      toast({
        variant: "destructive",
        title: "Erro ao carregar configurações",
        description: "Não foi possível carregar as chaves API. Tente novamente mais tarde."
      });
      
      setOpenaiKey(localStorage.getItem('openai_api_key') || "");
      setClaudeKey(localStorage.getItem('claude_api_key') || "");
      setGrokKey(localStorage.getItem('grok_api_key') || "");
      setUnstructuredKey(localStorage.getItem('unstructured_api_key') || "");

    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchKeys();
  }, []);

  const saveConfigToSupabase = async (key: string, value: string) => {
    try {
      // SECURITY: Validar formato da chave API antes de salvar
      if (key === 'openai_api_key' && !value.startsWith('sk-')) {
        throw new Error('Formato de chave API da OpenAI inválido. Deve começar com "sk-"');
      }
      if (key === 'claude_api_key' && !value.startsWith('sk-ant-')) {
        throw new Error('Formato de chave API do Claude inválido. Deve começar com "sk-ant-"');
      }
      if (key === 'grok_api_key' && value.length < 10) {
        throw new Error('Chave API do Grok deve ter pelo menos 10 caracteres');
      }
      if (key === 'unstructured_api_key' && value.length < 20) {
        throw new Error('Chave API do Unstructured.io deve ter pelo menos 20 caracteres');
      }

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

  const saveOpenAIKey = async (key: string) => {
    setIsSaving(true);
    try {
      await saveConfigToSupabase('openai_api_key', key);
      setOpenaiKey(key);
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
      localStorage.setItem('grok_api_key', key);
    } finally {
      setIsSaving(false);
    }
  };

  const saveUnstructuredKey = async (key: string) => {
    setIsSaving(true);
    try {
      await saveConfigToSupabase('unstructured_api_key', key);
      setUnstructuredKey(key);
      localStorage.setItem('unstructured_api_key', key);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <div className="mb-6">
        <h2 className="text-xl font-bold">Configurações de Inteligência Artificial</h2>
        <p className="text-gray-500">Configuração de chaves API para os serviços de IA</p>
      </div>

      <ConfiguracoesAvisosIA />
      
      <div className="grid grid-cols-1 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield size={18} /> Chaves API
            </CardTitle>
            <CardDescription>
              Configure as chaves para cada serviço de IA que deseja utilizar
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="openai" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="openai">OpenAI</TabsTrigger>
                <TabsTrigger value="claude">Claude</TabsTrigger>
                <TabsTrigger value="grok">Grok</TabsTrigger>
                <TabsTrigger value="unstructured">Unstructured</TabsTrigger>
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
              
              <TabsContent value="unstructured" className="space-y-4 pt-4">
                {/* Card explicativo sobre Unstructured */}
                <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900">
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center gap-2">
                      📘 Como funciona o Unstructured.io
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm space-y-2">
                    <p className="text-foreground">
                      <strong>Diferente das LLMs:</strong> Unstructured.io é um serviço de <strong>parsing de documentos</strong>, não uma IA generativa.
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                      <li>Extrai texto, tabelas e imagens de PDFs</li>
                      <li>Identifica estrutura (títulos, parágrafos, listas)</li>
                      <li>NÃO aceita prompts customizados</li>
                      <li>Usado ANTES de enviar dados para OpenAI/Claude</li>
                    </ul>
                    <div className="mt-4 p-2 bg-background rounded border border-blue-300 dark:border-blue-800">
                      <p className="text-xs font-mono text-foreground">
                        PDF → <strong>Unstructured</strong> → JSON estruturado → <strong>OpenAI</strong> → Análise
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <ApiKeyForm
                  serviceName="Unstructured.io" 
                  saveKey={saveUnstructuredKey}
                  initialKey={unstructuredKey}
                  placeholder="usa-xxxxxxxxxxxx"
                  isLoading={isLoading || isSaving}
                />
                <div className="text-sm text-gray-500 mt-4">
                  <a 
                    href="https://unstructured.io/api-key-hosted" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:underline"
                  >
                    Obter uma chave API do Unstructured.io →
                  </a>
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

        {/* Painel de Status das APIs */}
        <Card>
          <CardHeader>
            <CardTitle>Status das Conexões</CardTitle>
            <CardDescription>Verifique se suas chaves API estão funcionando</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <ApiStatusItem 
              service="OpenAI" 
              isConfigured={!!openaiKey} 
              icon="🤖"
            />
            <ApiStatusItem 
              service="Claude" 
              isConfigured={!!claudeKey} 
              icon="🧠"
            />
            <ApiStatusItem 
              service="Grok" 
              isConfigured={!!grokKey} 
              icon="⚡"
            />
            <ApiStatusItem 
              service="Unstructured" 
              isConfigured={!!unstructuredKey} 
              icon="📄"
              description="Parsing de PDFs e documentos"
            />
          </CardContent>
        </Card>
        
        <ConsumoPainel />
      </div>
    </>
  );
};

export default ConfiguracoesIATab;
