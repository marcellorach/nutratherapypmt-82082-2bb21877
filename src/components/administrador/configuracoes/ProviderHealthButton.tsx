import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Generic "Testar conexão" button for any LLM provider.
 * Calls the `provider-health` edge function which validates the API key,
 * pings the actual chat endpoint, and surfaces detailed HTTP error info
 * (auth failure, model out of scope, rate-limit, etc.).
 */

type Provider = 'openai' | 'claude' | 'gemini' | 'grok' | 'perplexity';

interface Props {
  provider: Provider;
  model?: string;
  /** disable when the user has no key entered locally */
  disabledHint?: string;
}

interface Result {
  status: 'idle' | 'checking' | 'ok' | 'error' | 'missing';
  http_status?: number;
  message?: string;
  hint?: string;
  latency_ms?: number;
  model?: string;
}

const ProviderHealthButton: React.FC<Props> = ({ provider, model, disabledHint }) => {
  const [result, setResult] = useState<Result>({ status: 'idle' });

  const run = async () => {
    setResult({ status: 'checking' });
    try {
      const { data, error } = await supabase.functions.invoke('provider-health', {
        body: { provider, model },
      });
      if (error) throw error;
      if (!data.configured) {
        setResult({ status: 'missing', message: data.error });
        return;
      }
      if (!data.connected) {
        setResult({
          status: 'error',
          http_status: data.status,
          message: data.error,
          hint: data.hint,
          latency_ms: data.latency_ms,
          model: data.model,
        });
        return;
      }
      setResult({
        status: 'ok',
        latency_ms: data.latency_ms,
        model: data.model,
      });
    } catch (e) {
      setResult({ status: 'error', message: e instanceof Error ? e.message : String(e) });
    }
  };

  return (
    <div className="space-y-2 mt-4 pt-4 border-t border-border">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium text-foreground">Testar conexão</span>
          {result.status === 'ok' && (
            <Badge className="bg-green-600 hover:bg-green-600">
              <CheckCircle2 className="h-3 w-3 mr-1" /> OK · {result.latency_ms} ms · {result.model}
            </Badge>
          )}
          {result.status === 'missing' && (
            <Badge variant="outline" className="border-amber-500 text-amber-600">
              <AlertCircle className="h-3 w-3 mr-1" /> Chave ausente no backend
            </Badge>
          )}
          {result.status === 'error' && (
            <Badge variant="destructive">
              <XCircle className="h-3 w-3 mr-1" /> Falha{result.http_status ? ` ${result.http_status}` : ''}
            </Badge>
          )}
        </div>
        <Button size="sm" variant="outline" onClick={run} disabled={result.status === 'checking'}>
          <RefreshCw className={`h-4 w-4 mr-1 ${result.status === 'checking' ? 'animate-spin' : ''}`} />
          Testar
        </Button>
      </div>
      {disabledHint && result.status === 'idle' && (
        <p className="text-xs text-muted-foreground">{disabledHint}</p>
      )}
      {(result.status === 'error' || result.status === 'missing') && result.message && (
        <div className="text-xs p-3 bg-destructive/10 border border-destructive/40 rounded space-y-1">
          {result.http_status && (
            <p className="font-medium text-destructive">
              HTTP {result.http_status}{result.model ? ` · modelo: ${result.model}` : ''}
            </p>
          )}
          <p className="text-muted-foreground break-all">{result.message}</p>
          {result.hint && <p className="text-amber-600 dark:text-amber-400">💡 {result.hint}</p>}
        </div>
      )}
    </div>
  );
};

export default ProviderHealthButton;