import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, CheckCircle2, XCircle, AlertCircle, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface HealthState {
  status: 'idle' | 'checking' | 'ok' | 'error' | 'missing';
  latency_ms?: number;
  model?: string;
  error?: string;
  checked_at?: string;
}

const PerplexityStatusCard: React.FC = () => {
  const [state, setState] = useState<HealthState>({ status: 'idle' });

  const runCheck = useCallback(async () => {
    setState({ status: 'checking' });
    try {
      const { data, error } = await supabase.functions.invoke('perplexity-health', { method: 'POST' });
      if (error) throw error;
      if (!data.configured) {
        setState({ status: 'missing', error: data.error });
        return;
      }
      if (!data.connected) {
        setState({ status: 'error', error: data.error, latency_ms: data.latency_ms });
        return;
      }
      setState({
        status: 'ok',
        latency_ms: data.latency_ms,
        model: data.model,
        checked_at: data.checked_at,
      });
    } catch (e) {
      setState({ status: 'error', error: e instanceof Error ? e.message : String(e) });
    }
  }, []);

  useEffect(() => { runCheck(); }, [runCheck]);

  const StatusBadge = () => {
    if (state.status === 'checking') return <Badge variant="secondary"><RefreshCw className="h-3 w-3 mr-1 animate-spin" /> Verificando…</Badge>;
    if (state.status === 'ok') return <Badge className="bg-green-600 hover:bg-green-600"><CheckCircle2 className="h-3 w-3 mr-1" /> Conectado</Badge>;
    if (state.status === 'missing') return <Badge variant="outline" className="border-amber-500 text-amber-600"><AlertCircle className="h-3 w-3 mr-1" /> Não configurado</Badge>;
    if (state.status === 'error') return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" /> Falha</Badge>;
    return <Badge variant="outline">—</Badge>;
  };

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
            </div>
          </div>
          <div className="flex items-center gap-3">
            <StatusBadge />
            <Button size="sm" variant="outline" onClick={runCheck} disabled={state.status === 'checking'}>
              <RefreshCw className={`h-4 w-4 mr-1 ${state.status === 'checking' ? 'animate-spin' : ''}`} />
              Testar
            </Button>
          </div>
        </div>

        {state.status === 'missing' && (
          <div className="text-xs text-muted-foreground p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 rounded">
            A chave <code>PERPLEXITY_API_KEY</code> não está disponível no backend. Use a aba <strong>Perplexity</strong> para configurá-la.
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