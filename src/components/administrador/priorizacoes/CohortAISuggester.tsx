import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Loader2, Wand2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';
import { useRoleView } from '@/contexts/RoleViewContext';

export interface SuggestedCohort {
  title: string;
  rationale: string;
  suggested_criteria: {
    breeds?: string;
    age_range?: string;
    weight_range?: string;
    conditions?: string;
    current_meds?: string;
    exclusion?: string;
    target_n?: string;
  };
  discoverable: string;
  kind: 'prevention' | 'treatment_validation' | 'exploratory';
  impact_score: number;
  viability_score: number;
}

interface Props {
  onUseSuggestion: (s: SuggestedCohort) => void;
}

const KIND_LABEL: Record<SuggestedCohort['kind'], string> = {
  prevention: 'Prevenção',
  treatment_validation: 'Validação de tratamento',
  exploratory: 'Exploratório',
};

const KIND_COLOR: Record<SuggestedCohort['kind'], string> = {
  prevention: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  treatment_validation: 'bg-blue-50 text-blue-700 border-blue-200',
  exploratory: 'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200',
};

const CohortAISuggester: React.FC<Props> = ({ onUseSuggestion }) => {
  const [loading, setLoading] = useState(false);
  const [cohorts, setCohorts] = useState<SuggestedCohort[]>([]);
  const { viewId } = useRoleView();
  // Tag de modelo é dado interno — só Arquiteto da Plataforma vê.
  const showModelTag = viewId === 'platform_architect';

  const fetchSuggestions = async () => {
    setLoading(true);
    try {
      // Sinais simples (placeholder enquanto não temos Meta-KG conectado aqui).
      // O edge function aceita qualquer JSON; o LLM lê e infere.
      const signals = {
        platform_focus: 'metabolic and degenerative diseases in canines',
        kg_gaps_hint: 'breed × condition pairs with <3 high-confidence triplets',
        known_underrepresented_breeds: ['Shih Tzu', 'Maltese', 'SRD (mixed)'],
        chronic_focus: ['osteoarthritis', 'chronic kidney disease', 'cognitive dysfunction', 'hepatic dysfunction'],
        petlove_strengths: 'longitudinal records, exam history, breed-stratified consultations',
      };
      const { data, error } = await supabase.functions.invoke('suggest-cohort-ideas', {
        body: { signals },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setCohorts(data?.cohorts ?? []);
      if (!data?.cohorts?.length) {
        toast({ title: 'IA retornou vazio', description: 'Tente novamente.', variant: 'destructive' });
      }
    } catch (e: any) {
      console.error(e);
      toast({
        title: 'Erro ao gerar sugestões',
        description: e?.message ?? 'Desconhecido',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-dashed border-primary/40 bg-primary/5">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="flex-1 min-w-[280px]">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              Sugestões ativas (IA)
            </h3>
            <p className="text-xs text-gray-600 mt-1">
              A Senex AI lê sinais da plataforma (gaps do Meta-KG, conflitos, condições sub-representadas)
              e propõe 5 cohorts que o parceiro clínico poderia compartilhar.
              {showModelTag && (
                <>
                  {' '}Modelo: <code className="text-[10px] bg-white px-1 rounded">google/gemini-3.5-flash</code>.
                </>
              )}
            </p>
          </div>
          <Button size="sm" onClick={fetchSuggestions} disabled={loading}>
            {loading ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Wand2 className="h-3.5 w-3.5 mr-1.5" />}
            {loading ? 'Gerando…' : (cohorts.length ? 'Gerar novamente' : 'Gerar 5 sugestões')}
          </Button>
        </div>

        {cohorts.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
            {cohorts.map((c, i) => {
              const score = Math.round((c.impact_score + c.viability_score) / 2);
              return (
                <Card key={i} className="bg-white">
                  <CardContent className="p-3 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="text-sm font-semibold leading-tight">{c.title}</h4>
                      <Badge variant="outline" className="text-[10px] shrink-0 font-mono">
                        {score}
                      </Badge>
                    </div>
                    <Badge variant="outline" className={`text-[10px] ${KIND_COLOR[c.kind]}`}>
                      {KIND_LABEL[c.kind]}
                    </Badge>
                    <p className="text-xs text-gray-700 leading-snug">{c.rationale}</p>
                    <div className="text-[11px] text-gray-600 bg-gray-50 rounded p-2 space-y-0.5">
                      <div><b>Critérios:</b> {c.suggested_criteria.breeds || '—'} · {c.suggested_criteria.age_range || '—'} · {c.suggested_criteria.conditions || '—'} · N≈{c.suggested_criteria.target_n}</div>
                    </div>
                    <p className="text-[11px] italic text-emerald-700">
                      <b>Descobrível:</b> {c.discoverable}
                    </p>
                    <div className="flex justify-between items-center pt-1">
                      <div className="text-[10px] text-gray-500">
                        Impacto {c.impact_score} · Viabilidade {c.viability_score}
                      </div>
                      <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => onUseSuggestion(c)}>
                        Usar esta sugestão →
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CohortAISuggester;