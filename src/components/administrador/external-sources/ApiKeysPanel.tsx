import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Key, ExternalLink, ChevronDown, ChevronUp, Save, Trash2, Activity, Loader2, CheckCircle2, AlertCircle, XCircle, Circle } from 'lucide-react';
import { useApiKeys } from '@/hooks/useApiKeys';
import { useToast } from '@/hooks/use-toast';
import type { SourceStatus } from './SourceStatusCard';

interface Props { sources: SourceStatus[] }

interface Slot {
  secret: string;
  source_id: string;
  name: string;
  docs: string;
  required: boolean;
  feeds: string[];
}

// Static map of what each key feeds (kept here so UI is informative even when
// the status edge function hasn't reported feeds[] yet).
const FEEDS: Record<string, string[]> = {
  NLM_UMLS_API_KEY: ['Ontology mapping (UMLS/SNOMED)', 'health_conditions.snomed_code', 'health_conditions.umls_cui'],
  NCBI_API_KEY: ['PubMed E-utilities search', 'Study ingestion pipeline', 'KG evidence gap-fill'],
  PERPLEXITY_API_KEY: ['External search panel', 'AI auditor chat'],
  OPENAI_API_KEY: ['Embeddings (study chunks)', 'Fallback LLM calls'],
  GOOGLE_AI_API_KEY: ['Gemini triplet extraction', 'Gemini scientific assessment'],
};

const ApiKeysPanel: React.FC<Props> = ({ sources }) => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { list, save, remove, test } = useApiKeys();

  const slots: Slot[] = useMemo(() => {
    const seen = new Set<string>();
    return sources
      .filter(s => s.secret_name && !seen.has(s.secret_name!) && seen.add(s.secret_name!))
      .map(s => ({
        secret: s.secret_name!,
        source_id: s.id,
        name: s.name,
        docs: s.docs_url,
        required: s.requires_key,
        feeds: FEEDS[s.secret_name!] ?? [],
      }));
  }, [sources]);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Key className="h-4 w-4" /> {t('externalSources.apiKeys.title')}
        </CardTitle>
        <p className="text-xs text-muted-foreground">{t('externalSources.apiKeys.description')}</p>
      </CardHeader>
      <CardContent className="space-y-2">
        {slots.map(slot => (
          <ApiKeySlot
            key={slot.secret}
            slot={slot}
            row={list.data?.find(r => r.key_name === slot.secret) ?? null}
            onSave={(value) => save.mutateAsync({ key_name: slot.secret, source_id: slot.source_id, value })
              .then(() => toast({ title: t('externalSources.apiKeys.saved') }))
              .catch(e => toast({ title: t('externalSources.apiKeys.error'), description: e.message, variant: 'destructive' }))}
            onDelete={() => remove.mutateAsync(slot.secret)
              .then(() => toast({ title: t('externalSources.apiKeys.removed') }))
              .catch(e => toast({ title: t('externalSources.apiKeys.error'), description: e.message, variant: 'destructive' }))}
            onTest={() => test.mutateAsync(slot.secret)
              .then(r => toast({
                title: r.ok ? t('externalSources.apiKeys.testOk') : t('externalSources.apiKeys.testFail'),
                description: r.message,
                variant: r.ok ? 'default' : 'destructive',
              }))
              .catch(e => toast({ title: t('externalSources.apiKeys.error'), description: e.message, variant: 'destructive' }))}
            saving={save.isPending}
            testing={test.isPending}
            removing={remove.isPending}
          />
        ))}
      </CardContent>
    </Card>
  );
};

interface SlotProps {
  slot: Slot;
  row: { is_set: boolean; last_tested_at: string | null; last_test_status: string | null; last_test_message: string | null } | null;
  onSave: (value: string) => void;
  onDelete: () => void;
  onTest: () => void;
  saving: boolean;
  testing: boolean;
  removing: boolean;
}

const ApiKeySlot: React.FC<SlotProps> = ({ slot, row, onSave, onDelete, onTest, saving, testing, removing }) => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState('');

  const isSet = row?.is_set ?? false;
  const status = !isSet ? 'empty' : row?.last_test_status === 'ok' ? 'ok' : row?.last_test_status === 'error' ? 'error' : 'pending';

  const StatusIcon = status === 'ok' ? CheckCircle2 : status === 'pending' ? AlertCircle : status === 'error' ? XCircle : Circle;
  const statusColor = status === 'ok' ? 'text-emerald-600' : status === 'pending' ? 'text-amber-600' : status === 'error' ? 'text-red-600' : 'text-muted-foreground';

  return (
    <Collapsible open={open} onOpenChange={setOpen} className="border rounded-md">
      <CollapsibleTrigger asChild>
        <button className="w-full p-3 flex items-center justify-between gap-3 hover:bg-muted/50 transition-colors text-left">
          <div className="flex items-center gap-2 min-w-0">
            <StatusIcon className={`h-4 w-4 flex-shrink-0 ${statusColor}`} />
            <div className="min-w-0">
              <div className="text-sm font-medium truncate">{slot.name}</div>
              <code className="text-[10px] font-mono text-muted-foreground truncate">{slot.secret}</code>
            </div>
            {!slot.required && <Badge variant="outline" className="text-[10px]">{t('externalSources.apiKeys.optional')}</Badge>}
          </div>
          {open ? <ChevronUp className="h-4 w-4 flex-shrink-0" /> : <ChevronDown className="h-4 w-4 flex-shrink-0" />}
        </button>
      </CollapsibleTrigger>

      <CollapsibleContent className="p-3 pt-0 border-t space-y-3">
        {slot.feeds.length > 0 && (
          <div>
            <div className="text-xs font-medium mb-1">{t('externalSources.apiKeys.feeds')}</div>
            <ul className="text-xs text-muted-foreground list-disc list-inside space-y-0.5">
              {slot.feeds.map(f => <li key={f}>{f}</li>)}
            </ul>
          </div>
        )}

        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" className="h-7 text-xs" asChild>
            <a href={slot.docs} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-3 w-3 mr-1" /> {t('externalSources.apiKeys.generate')}
            </a>
          </Button>
        </div>

        <div className="flex items-end gap-2">
          <div className="flex-1">
            <label className="text-xs font-medium block mb-1">
              {isSet ? t('externalSources.apiKeys.replaceLabel') : t('externalSources.apiKeys.newLabel')}
            </label>
            <Input
              type="password"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={t('externalSources.apiKeys.placeholder')}
              className="h-8 text-xs"
            />
          </div>
          <Button
            size="sm"
            className="h-8"
            disabled={value.length < 4 || saving}
            onClick={() => { onSave(value); setValue(''); }}
          >
            {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
            <span className="ml-1 text-xs">{t('externalSources.apiKeys.save')}</span>
          </Button>
        </div>

        {isSet && (
          <div className="flex items-center gap-2 flex-wrap">
            <Button size="sm" variant="outline" className="h-7 text-xs" onClick={onTest} disabled={testing}>
              {testing ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Activity className="h-3 w-3 mr-1" />}
              {t('externalSources.apiKeys.test')}
            </Button>
            <Button size="sm" variant="ghost" className="h-7 text-xs text-red-600 hover:text-red-700" onClick={onDelete} disabled={removing}>
              <Trash2 className="h-3 w-3 mr-1" /> {t('externalSources.apiKeys.delete')}
            </Button>
            {row?.last_tested_at && (
              <span className="text-[10px] text-muted-foreground ml-auto">
                {t('externalSources.apiKeys.lastTest')}: {new Date(row.last_tested_at).toLocaleString()}
                {row.last_test_message ? ` — ${row.last_test_message}` : ''}
              </span>
            )}
          </div>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
};

export default ApiKeysPanel;