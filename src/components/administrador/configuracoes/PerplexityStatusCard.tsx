import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RefreshCw, CheckCircle2, XCircle, AlertCircle, Sparkles, Save } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface SupportedModel { id: string; label: string; description?: string }

interface HealthState {
  status: 'idle' | 'checking' | 'ok' | 'error' | 'missing';
  latency_ms?: number;
  model?: string;
  error?: string;
  hint?: string;
  http_status?: number;
  checked_at?: string;
  supported_models?: SupportedModel[];
}

const FALLBACK_MODELS: SupportedModel[] = [
  { id: 'sonar', label: 'Sonar', description: 'Fast, lightweight' },
  { id: 'sonar-pro', label: 'Sonar Pro', description: 'Multi-step reasoning, 2× citations' },
  { id: 'sonar-reasoning', label: 'Sonar Reasoning', description: 'Chain-of-thought + search' },
  { id: 'sonar-reasoning-pro', label: 'Sonar Reasoning Pro', description: 'Advanced reasoning (default)' },
  { id: 'sonar-deep-research', label: 'Sonar Deep Research', description: 'Multi-query expert research' },
];

const PerplexityStatusCard: React.FC = () => {
  const { toast } = useToast();
  const [state, setState] = useState<HealthState>({ status: 'idle', supported_models: FALLBACK_MODELS });
  const [selectedModel, setSelectedModel] = useState<string>('sonar-reasoning-pro');
  const [savedModel, setSavedModel] = useState<string>('sonar-reasoning-pro');
  const [isSavingModel, setIsSavingModel] = useState(false);

  // Load currently saved model from ai_configurations.
  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('ai_configurations')
        .select('config_value')
        .eq('config_key', 'perplexity_gap_fill_model')
        .maybeSingle();
      if (data?.config_value) {
        const raw = typeof data.config_value === 'string'
          ? data.config_value.replace(/^"|"$/g, '')
          : String(data.config_value);
        if (raw) {
          setSavedModel(raw);
          setSelectedModel(raw);
        }
      }
    })();
  }, []);

  const runCheck = useCallback(async (modelOverride?: string) => {
    setState((s) => ({ ...s, status: 'checking' }));
    try {
      const { data, error } = await supabase.functions.invoke('perplexity-health', {
        body: { model: modelOverride ?? selectedModel },
      });
      if (error) throw error;
      const supported: SupportedModel[] = data?.supported_models ?? FALLBACK_MODELS;
      if (!data.configured) {
        setState({ status: 'missing', error: data.error, supported_models: supported });
        return;
      }
      if (!data.connected) {
        setState({
          status: 'error',
          error: data.error,
          hint: data.hint,
          http_status: data.status,
          latency_ms: data.latency_ms,
          model: data.model,
          supported_models: supported,
        });
        return;
      }
      setState({
        status: 'ok',
        latency_ms: data.latency_ms,
        model: data.model,
        checked_at: data.checked_at,
        supported_models: supported,
      });
    } catch (e) {
      setState({
        status: 'error',
        error: e instanceof Error ? e.message : String(e),
        supported_models: FALLBACK_MODELS,
      });
    }
  }, [selectedModel]);

  useEffect(() => { runCheck(); }, []); // initial check

  const saveModel = async () => {
    setIsSavingModel(true);
    try {
      const { error } = await supabase
        .from('ai_configurations')
        .upsert({
          config_key: 'perplexity_gap_fill_model',
          config_value: JSON.stringify(selectedModel),
          description: 'Perplexity model used by KG Evidence Gap-Fill',
          is_active: true,
        }, { onConflict: 'config_key' });
      if (error) throw error;
      setSavedModel(selectedModel);
      toast({ title: '✅ Modelo salvo', description: `Próximas chamadas do KG Gap-Fill usarão "${selectedModel}".` });
    } catch (e) {
      toast({
        variant: 'destructive',
        title: 'Erro ao salvar modelo',
        description: e instanceof Error ? e.message : String(e),
      });
    } finally {
      setIsSavingModel(false);
    }
  };

  const StatusBadge = () => {
    if (state.status === 'checking') return <Badge variant="secondary"><RefreshCw className="h-3 w-3 mr-1 animate-spin" /> Verificando…</Badge>;
    if (state.status === 'ok') return <Badge className="bg-green-600 hover:bg-green-600"><CheckCircle2 className="h-3 w-3 mr-1" /> Conectado</Badge>;
    if (state.status === 'missing') return <Badge variant="outline" className="border-amber-500 text-amber-600"><AlertCircle className="h-3 w-3 mr-1" /> Não configurado</Badge>;
    if (state.status === 'error') return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" /> Falha{state.http_status ? ` ${state.http_status}` : ''}</Badge>;
    return <Badge variant="outline">—</Badge>;
  };

  const supported = state.supported_models ?? FALLBACK_MODELS;
  const modelDirty = selectedModel !== savedModel;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-violet-500" />
          Perplexity – Saúde da Conexão
        </CardTitle>
        <CardDescription>
          Health-check ao vivo do Perplexity Sonar usado no preenchimento de evidências (KG Gap-Fill).
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between p-3 border border-border rounded-lg bg-card">
          <div className="flex items-center gap-3">
            <span className="text-2xl">✨</span>
            <div>
              <p className="font-medium text-foreground">Perplexity Sonar</p>
              <p className="text-xs text-muted-foreground">
                {state.status === 'ok'
                  ? `Modelo: ${state.model} · Latência: ${state.latency_ms} ms`
                  : state.status === 'error' || state.status === 'missing'
                  ? state.error ?? 'Erro desconhecido'
                  : 'Provedor de busca acadêmica grounded'}
              </p>
              {state.hint && state.status === 'error' && (
                <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">💡 {state.hint}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <StatusBadge />
            <Button size="sm" variant="outline" onClick={() => runCheck()} disabled={state.status === 'checking'}>
              <RefreshCw className={`h-4 w-4 mr-1 ${state.status === 'checking' ? 'animate-spin' : ''}`} />
              Testar
            </Button>
          </div>
        </div>

        {/* Model selector for KG Gap-Fill */}
        <div className="p-3 border border-border rounded-lg bg-card space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-foreground">Modelo para KG Gap-Fill</p>
              <p className="text-xs text-muted-foreground">
                Escolha o modelo Sonar usado pelo pipeline de busca de evidências.
                Salvo: <code className="text-foreground">{savedModel}</code>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Select value={selectedModel} onValueChange={setSelectedModel}>
              <SelectTrigger className="flex-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {supported.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    <div className="flex flex-col">
                      <span className="font-medium">{m.label}</span>
                      {m.description && <span className="text-xs text-muted-foreground">{m.description}</span>}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button size="sm" variant="outline" onClick={() => runCheck(selectedModel)} disabled={state.status === 'checking'}>
              <RefreshCw className={`h-4 w-4 mr-1 ${state.status === 'checking' ? 'animate-spin' : ''}`} />
              Testar este modelo
            </Button>
            <Button size="sm" onClick={saveModel} disabled={!modelDirty || isSavingModel}>
              <Save className="h-4 w-4 mr-1" />
              {isSavingModel ? 'Salvando…' : 'Salvar'}
            </Button>
          </div>
        </div>

        {state.status === 'missing' && (
          <div className="text-xs text-muted-foreground p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 rounded">
            A chave <code>PERPLEXITY_API_KEY</code> não está disponível no backend. Use a aba <strong>Perplexity</strong> para configurá-la.
          </div>
        )}
        {state.status === 'error' && state.http_status && (
          <div className="text-xs p-3 bg-destructive/10 border border-destructive/40 rounded space-y-1">
            <p className="font-medium text-destructive">HTTP {state.http_status} · modelo testado: {state.model}</p>
            <p className="text-muted-foreground break-all">{state.error}</p>
          </div>
        )}
        {state.checked_at && state.status === 'ok' && (
          <p className="text-xs text-muted-foreground text-right">
            Última verificação: {new Date(state.checked_at).toLocaleString()}
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default PerplexityStatusCard;