
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Shield, RefreshCw, Layers } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import ApiKeyForm, { ValidationResult } from './configuracoes/ApiKeyForm';
import ConsumoPainel from './configuracoes/ConsumoPainel';
import ConfiguracoesAvisosIA from './configuracoes/ConfiguracoesAvisosIA';
import ApiStatusItem from './configuracoes/ApiStatusItem';
import ExtractionPromptsEditor from './configuracoes/ExtractionPromptsEditor';
import ConfigurationsSummary from './configuracoes/ConfigurationsSummary';
import Neo4jStatusCard from './configuracoes/Neo4jStatusCard';
import AIModelSelector from './configuracoes/AIModelSelector';
import PerplexityStatusCard from './configuracoes/PerplexityStatusCard';
import ProviderHealthButton from './configuracoes/ProviderHealthButton';

const ConfiguracoesIATab: React.FC = () => {
  const [openaiKey, setOpenaiKey] = useState<string>("");
  const [claudeKey, setClaudeKey] = useState<string>("");
  const [grokKey, setGrokKey] = useState<string>("");
  const [unstructuredKey, setUnstructuredKey] = useState<string>("");
  const [googleGeminiKey, setGoogleGeminiKey] = useState<string>("");
  const [perplexityKey, setPerplexityKey] = useState<string>("");
  const [perplexitySecretAvailable, setPerplexitySecretAvailable] = useState<boolean>(false);
  const [neo4jUri, setNeo4jUri] = useState<string>("");
  const [neo4jUsername, setNeo4jUsername] = useState<string>("");
  const [neo4jPassword, setNeo4jPassword] = useState<string>("");
  const [promptSystemTriplet, setPromptSystemTriplet] = useState<string>("");
  const [promptUserTriplet, setPromptUserTriplet] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
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
        setGoogleGeminiKey(configs.google_gemini_api_key || "");
        setPerplexityKey(configs.perplexity_api_key || "");
        setNeo4jUri(configs.neo4j_uri || "");
        setNeo4jUsername(configs.neo4j_username || "");
        setNeo4jPassword(configs.neo4j_password || "");
        setPromptSystemTriplet(configs.prompt_triplet_extraction_system || "");
        setPromptUserTriplet(configs.prompt_triplet_extraction_user || "");
      }

    } catch (error) {
      console.error("Erro ao buscar configurações:", error);
      toast({
        variant: "destructive",
        title: "Erro ao carregar configurações",
        description: "Não foi possível carregar as chaves API. Tente novamente mais tarde."
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchKeys();
  }, []);

  // Check if Perplexity is configured via connector secret (PERPLEXITY_API_KEY)
  useEffect(() => {
    (async () => {
      try {
        const { data } = await supabase.functions.invoke('perplexity-health', { body: {} });
        if (data?.configured) setPerplexitySecretAvailable(true);
      } catch {
        // ignore – fallback to DB key
      }
    })();
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
      if (key === 'google_gemini_api_key' && value.length < 30) {
        throw new Error('Chave API do Google Gemini deve ter pelo menos 30 caracteres');
      }
      if (key === 'perplexity_api_key' && (!value.startsWith('pplx-') || value.length < 20)) {
        throw new Error('Chave API do Perplexity inválida. Deve começar com "pplx-" e ter pelo menos 20 caracteres');
      }
      if (key === 'neo4j_uri' && !value.startsWith('neo4j+s://') && !value.startsWith('neo4j://')) {
        throw new Error('URI do Neo4j deve começar com "neo4j+s://" ou "neo4j://"');
      }
      if (key === 'neo4j_username' && value.length < 1) {
        throw new Error('Username do Neo4j não pode estar vazio');
      }
      if (key === 'neo4j_password' && value.length < 8) {
        throw new Error('Password do Neo4j deve ter pelo menos 8 caracteres');
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
    } finally {
      setIsSaving(false);
    }
  };
  
  const saveClaudeKey = async (key: string) => {
    setIsSaving(true);
    try {
      await saveConfigToSupabase('claude_api_key', key);
      setClaudeKey(key);
    } finally {
      setIsSaving(false);
    }
  };
  
  const saveGrokKey = async (key: string) => {
    setIsSaving(true);
    try {
      await saveConfigToSupabase('grok_api_key', key);
      setGrokKey(key);
    } finally {
      setIsSaving(false);
    }
  };

  const saveUnstructuredKey = async (key: string) => {
    setIsSaving(true);
    try {
      await saveConfigToSupabase('unstructured_api_key', key);
      setUnstructuredKey(key);
    } finally {
      setIsSaving(false);
    }
  };

  const saveGoogleGeminiKey = async (key: string) => {
    setIsSaving(true);
    try {
      await saveConfigToSupabase('google_gemini_api_key', key);
      setGoogleGeminiKey(key);
    } finally {
      setIsSaving(false);
    }
  };

  const savePerplexityKey = async (key: string) => {
    setIsSaving(true);
    try {
      await saveConfigToSupabase('perplexity_api_key', key);
      setPerplexityKey(key);
    } finally {
      setIsSaving(false);
    }
  };

  const saveNeo4jUri = async (uri: string) => {
    setIsSaving(true);
    try {
      await saveConfigToSupabase('neo4j_uri', uri);
      setNeo4jUri(uri);
    } finally {
      setIsSaving(false);
    }
  };

  const saveNeo4jUsername = async (username: string) => {
    setIsSaving(true);
    try {
      await saveConfigToSupabase('neo4j_username', username);
      setNeo4jUsername(username);
    } finally {
      setIsSaving(false);
    }
  };

  const saveNeo4jPassword = async (password: string) => {
    setIsSaving(true);
    try {
      await saveConfigToSupabase('neo4j_password', password);
      setNeo4jPassword(password);
    } finally {
      setIsSaving(false);
    }
  };

  // Validadores customizados para Neo4j
  const validateNeo4jUri = (value: string): ValidationResult => {
    if (!value || value.trim() === '') {
      return { isValid: false, status: 'idle' };
    }
    
    if (value.startsWith('neo4j+s://') || value.startsWith('neo4j://')) {
      // Verifica formato do domínio
      const domain = value.replace(/^neo4j\+?s?:\/\//, '');
      if (domain.includes('.databases.neo4j.io')) {
        return { 
          isValid: true, 
          status: 'valid', 
          message: '✓ Formato correto do Neo4j Aura' 
        };
      }
      return { 
        isValid: true, 
        status: 'warning', 
        message: '⚠ URI válida mas não parece ser Neo4j Aura' 
      };
    }
    
    return { 
      isValid: false, 
      status: 'invalid', 
      message: '✗ URI deve começar com neo4j+s:// ou neo4j://' 
    };
  };

  const validateNeo4jUsername = (value: string): ValidationResult => {
    if (!value || value.trim() === '') {
      return { isValid: false, status: 'idle' };
    }
    
    if (value.length < 3) {
      return { 
        isValid: false, 
        status: 'invalid', 
        message: '✗ Username muito curto (mínimo 3 caracteres)' 
      };
    }
    
    if (value === 'neo4j') {
      return { 
        isValid: true, 
        status: 'valid', 
        message: '✓ Username padrão Neo4j' 
      };
    }
    
    if (value.includes(' ') || value.includes('@')) {
      return { 
        isValid: false, 
        status: 'invalid', 
        message: '✗ Username não deve conter espaços ou @' 
      };
    }
    
    return { 
      isValid: true, 
      status: 'valid', 
      message: '✓ Formato válido' 
    };
  };

  const validateNeo4jPassword = (value: string): ValidationResult => {
    if (!value || value.trim() === '') {
      return { isValid: false, status: 'idle' };
    }
    
    if (value.length < 8) {
      return { 
        isValid: false, 
        status: 'invalid', 
        message: '✗ Password deve ter pelo menos 8 caracteres' 
      };
    }
    
    if (value.length >= 16) {
      return { 
        isValid: true, 
        status: 'valid', 
        message: '✓ Password forte' 
      };
    }
    
    return { 
      isValid: true, 
      status: 'warning', 
      message: '⚠ Password válida mas curta (recomendado 16+ caracteres)' 
    };
  };

  const testNeo4jConnection = async () => {
    setIsTesting(true);
    try {
      const response = await supabase.functions.invoke('ai-config', {
        method: 'POST',
        body: { action: 'test-neo4j' }
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      const result = response.data;

      if (result.success) {
        toast({
          title: "✅ Conexão bem-sucedida!",
          description: `Conectado ao Neo4j: ${result.uri}`,
        });
      } else {
        toast({
          variant: "destructive",
          title: "❌ Falha na conexão",
          description: result.error || "Não foi possível conectar ao Neo4j",
        });
      }
    } catch (error: any) {
      console.error("Erro ao testar conexão Neo4j:", error);
      toast({
        variant: "destructive",
        title: "Erro no teste de conexão",
        description: error.message || "Ocorreu um erro ao testar a conexão",
      });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <>
      <div className="mb-6">
        <h2 className="text-xl font-bold">AI Configuration Settings</h2>
        <p className="text-gray-500">Configure API keys and AI models for services</p>
      </div>

      <ConfiguracoesAvisosIA />
      
      <div className="grid grid-cols-1 gap-6">
        {/* AI Model Selector - NEW */}
        <AIModelSelector />

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield size={18} /> API Keys
            </CardTitle>
            <CardDescription>
              Configure the keys for each AI service you want to use
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="openai" className="w-full">
              <TabsList className="grid w-full grid-cols-8">
                <TabsTrigger value="openai">OpenAI</TabsTrigger>
                <TabsTrigger value="claude">Claude</TabsTrigger>
                <TabsTrigger value="grok">Grok</TabsTrigger>
                <TabsTrigger value="google-gemini">Google Gemini</TabsTrigger>
                <TabsTrigger value="perplexity">Perplexity</TabsTrigger>
                <TabsTrigger value="neo4j">Neo4j</TabsTrigger>
                <TabsTrigger value="unstructured">Unstructured</TabsTrigger>
                <TabsTrigger value="prompts">Prompts</TabsTrigger>
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
                <ProviderHealthButton provider="openai" />
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
                <ProviderHealthButton provider="claude" />
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
                <ProviderHealthButton provider="grok" />
              </TabsContent>

              <TabsContent value="google-gemini" className="space-y-4 pt-4">
                <ApiKeyForm 
                  serviceName="Google Gemini" 
                  saveKey={saveGoogleGeminiKey}
                  initialKey={googleGeminiKey}
                  placeholder="AIzaSyxxxxxxxxxxxxxxxxxxxxxxxxx"
                  isLoading={isLoading || isSaving}
                />
                <div className="text-sm text-gray-500 mt-4">
                  <a 
                    href="https://aistudio.google.com/app/apikey" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:underline"
                  >
                    Obter uma chave API do Google AI Studio →
                  </a>
                </div>
                
                <Card className="bg-purple-50 dark:bg-purple-950/20 border-purple-200 dark:border-purple-900 mt-4">
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center gap-2">
                      🔍 Para que serve o Google Gemini?
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm space-y-2">
                    <p className="text-foreground">
                      <strong>Processamento NTAI Lab:</strong> Usa <strong>Gemini File Search</strong> para análise contextual de PDFs científicos.
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                      <li>Upload direto de PDFs para o Google AI</li>
                      <li>RAG automático (sem precisar de vector database)</li>
                      <li>Extração estruturada de entidades com citations</li>
                      <li>Substitui pipeline complexo (Unstructured + Embeddings + Vector DB)</li>
                    </ul>
                    <div className="mt-4 p-2 bg-background rounded border border-purple-300 dark:border-purple-800">
                      <p className="text-xs font-mono text-foreground">
                        📄 PDF → 🔍 Gemini File Search → 📊 JSON estruturado → 💾 Supabase
                      </p>
                    </div>
                  </CardContent>
                </Card>
                <ProviderHealthButton provider="gemini" />
              </TabsContent>

              <TabsContent value="perplexity" className="space-y-4 pt-4">
                <Card className="bg-violet-50 dark:bg-violet-950/20 border-violet-200 dark:border-violet-900">
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center gap-2">
                      ✨ Para que serve o Perplexity?
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm space-y-2">
                    <p className="text-foreground">
                      <strong>Busca acadêmica grounded:</strong> usado no <strong>KG Evidence Gap-Fill</strong> para preencher pares (composto × condição) ausentes no Knowledge Graph com evidência citável.
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                      <li>Modelo Sonar (Academic) com citações reais</li>
                      <li>PMIDs validados via NCBI antes de salvar</li>
                      <li>Fallback para PubMed + Gemini se sem evidência</li>
                      <li>Triplets criados como pending (curadoria manual)</li>
                    </ul>
                    <div className="mt-4 p-2 bg-background rounded border border-violet-300 dark:border-violet-800">
                      <p className="text-xs font-mono text-foreground">
                        Gap → 🔎 Perplexity Sonar → ✅ PMID válido → 💾 Triplet pending
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <ApiKeyForm
                  serviceName="Perplexity"
                  saveKey={savePerplexityKey}
                  initialKey={perplexityKey}
                  placeholder="pplx-xxxxxxxxxxxxxxxxxxxxxxxx"
                  isLoading={isLoading || isSaving}
                />
                <div className="text-sm text-gray-500 mt-4">
                  <a
                    href="https://www.perplexity.ai/settings/api"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:underline"
                  >
                    Obter uma chave API do Perplexity →
                  </a>
                </div>
                <p className="text-xs text-muted-foreground">
                  Dica: se a chave já está provisionada via conector (secret PERPLEXITY_API_KEY no backend), o card de saúde abaixo já mostrará Conectado — não é necessário inserir aqui.
                </p>
                <ProviderHealthButton provider="perplexity" />
              </TabsContent>

              <TabsContent value="neo4j" className="space-y-4 pt-4">
                <Card className="bg-purple-50 dark:bg-purple-950/20 border-purple-200 dark:border-purple-900 mb-4">
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center gap-2">
                      🔵 Para que serve o Neo4j?
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm space-y-2">
                    <p className="text-foreground">
                      <strong>Knowledge Graph para GraphRAG veterinário:</strong> Armazena e consulta triplas estruturadas (Nutraceutical → TREATS → Condition).
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                      <li>Grafo hierárquico 3-tier (documento → chunk → entidade)</li>
                      <li>U-Retrieval: Top-down (summaries) + Bottom-up (detalhes)</li>
                      <li>Validação de triplas via KGARevion pattern (Generate-Review-Revise)</li>
                      <li>Complementa pgvector (Supabase) para hybrid search</li>
                      <li>Predisposições raciais: (:Breed)-[:PREDISPOSED_TO]→(:Condition)</li>
                    </ul>
                    <div className="mt-4 p-2 bg-background rounded border border-purple-300 dark:border-purple-800">
                      <p className="text-xs font-mono text-foreground">
                        📊 Triple Graph + 🔍 Vector Search = 🎯 GraphRAG Híbrido
                      </p>
                    </div>
                    <div className="text-sm text-gray-500 mt-4">
                      <a 
                        href="https://neo4j.com/cloud/platform/aura-graph-database/" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-500 hover:underline"
                      >
                        Criar instância gratuita no Neo4j AuraDB →
                      </a>
                    </div>
                  </CardContent>
                </Card>

                <ApiKeyForm 
                  serviceName="Neo4j URI" 
                  saveKey={saveNeo4jUri}
                  initialKey={neo4jUri}
                  placeholder="neo4j+s://xxxxx.databases.neo4j.io"
                  isLoading={isLoading || isSaving}
                  validator={validateNeo4jUri}
                  showVisualValidation={true}
                />
                <ApiKeyForm 
                  serviceName="Neo4j Username" 
                  saveKey={saveNeo4jUsername}
                  initialKey={neo4jUsername}
                  placeholder="neo4j"
                  isLoading={isLoading || isSaving}
                  minLength={3}
                  validator={validateNeo4jUsername}
                  showVisualValidation={true}
                />
                <ApiKeyForm 
                  serviceName="Neo4j Password" 
                  saveKey={saveNeo4jPassword}
                  initialKey={neo4jPassword}
                  placeholder="••••••••••••"
                  isLoading={isLoading || isSaving}
                  validator={validateNeo4jPassword}
                  showVisualValidation={true}
                />
                
                <div className="mt-6 pt-6 border-t border-border">
                  <Button 
                    onClick={testNeo4jConnection}
                    disabled={isTesting || !neo4jUri || !neo4jUsername || !neo4jPassword}
                    className="w-full"
                    variant="outline"
                  >
                    {isTesting ? (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                        Testando conexão...
                      </>
                    ) : (
                      <>
                        <Shield className="mr-2 h-4 w-4" />
                        Testar Conexão Neo4j
                      </>
                    )}
                  </Button>
                  <p className="text-xs text-muted-foreground mt-2 text-center">
                    {!neo4jUri || !neo4jUsername || !neo4jPassword 
                      ? "Configure todas as credenciais antes de testar" 
                      : "Clique para verificar se as credenciais estão corretas"}
                  </p>
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

              <TabsContent value="prompts" className="space-y-4 pt-4">
                <ExtractionPromptsEditor />
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
              service="Google Gemini" 
              isConfigured={!!googleGeminiKey} 
              icon="🔍"
              description="File Search + Structured Output"
            />
            <ApiStatusItem
              service="Perplexity"
              isConfigured={!!perplexityKey}
              icon="✨"
              description="Sonar Academic – KG Gap-Fill"
            />
            <ApiStatusItem 
              service="Unstructured" 
              isConfigured={!!unstructuredKey} 
              icon="📄"
              description="Parsing de PDFs e documentos"
            />
            <ApiStatusItem 
              service="Neo4j" 
              isConfigured={!!neo4jUri && !!neo4jUsername && !!neo4jPassword} 
              icon="🔵"
              description="GraphRAG + Knowledge Graph"
            />
          </CardContent>
        </Card>
        
        <ConfigurationsSummary />
        
        <Neo4jStatusCard />

        <PerplexityStatusCard />
        
        <ConsumoPainel />
      </div>
    </>
  );
};

export default ConfiguracoesIATab;
