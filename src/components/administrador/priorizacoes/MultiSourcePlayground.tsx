import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Sparkles, Network } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import SourcePanel from '@/components/clinical/SourcePanel';
import { resolveMultiSource, type ResolverOutput } from '@/services/multi-source-resolver';
import { toast } from '@/components/ui/use-toast';

interface CohortOpt { id: string; name: string }

const MultiSourcePlayground: React.FC = () => {
  const { t } = useTranslation();
  const [question, setQuestion] = useState('Curcumina é segura para Golden Retriever com elevação leve de ALT?');
  const [cohortId, setCohortId] = useState<string>('');
  const [cohorts, setCohorts] = useState<CohortOpt[]>([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ResolverOutput | null>(null);

  useEffect(() => {
    supabase
      .from('synthetic_cohorts')
      .select('id, name')
      .eq('status', 'ready')
      .order('created_at', { ascending: false })
      .then(({ data }) => setCohorts((data ?? []) as CohortOpt[]));
  }, []);

  const investigate = async () => {
    if (!question.trim()) return;
    setLoading(true);
    setResult(null);
    try {
      const r = await resolveMultiSource({ question: question.trim(), cohortId: cohortId || null });
      setResult(r);
    } catch (e: any) {
      toast({ title: 'Erro', description: e?.message ?? 'Falha ao consultar fontes', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card className="border-dashed bg-indigo-50/40 border-indigo-200">
        <CardContent className="p-3 text-xs text-indigo-900 flex items-start gap-2">
          <Network className="h-4 w-4 shrink-0 mt-0.5" />
          <div>
            <b>{t('prioritization.multiSource.title')}.</b> {t('prioritization.multiSource.subtitle')}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4 space-y-3">
          <div>
            <label className="text-xs font-semibold text-gray-600 block mb-1">
              {t('prioritization.multiSource.questionPlaceholder')}
            </label>
            <Textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              rows={2}
              placeholder={t('prioritization.multiSource.questionPlaceholder') ?? ''}
            />
          </div>

          {cohorts.length > 0 && (
            <div>
              <label className="text-xs font-semibold text-gray-600 block mb-1">
                {t('prioritization.multiSource.sources.cohort')}
              </label>
              <select
                value={cohortId}
                onChange={(e) => setCohortId(e.target.value)}
                className="w-full text-sm border rounded px-2 py-1.5"
              >
                <option value="">— qualquer cohort sintético —</option>
                {cohorts.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          )}

          <Button onClick={investigate} disabled={loading || !question.trim()}>
            {loading
              ? <><Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> {t('prioritization.multiSource.investigating')}</>
              : <><Sparkles className="h-4 w-4 mr-1.5" /> {t('prioritization.multiSource.investigate')}</>}
          </Button>
        </CardContent>
      </Card>

      {result && <SourcePanel result={result} />}
    </div>
  );
};

export default MultiSourcePlayground;