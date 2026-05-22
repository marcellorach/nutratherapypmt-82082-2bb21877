import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  ExternalLink, BookOpen, FileText, ChevronDown, ChevronUp,
  Sigma, Gauge, Network, Wrench, AlertTriangle, MessageSquare,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import MetaStudyChatDialog from './MetaStudyChatDialog';

type Claim = { claim?: string; statement?: string; quote?: string; weight?: number; applies_to?: string };

export interface MetaStudyDetailed {
  id: string;
  title: string;
  authors?: string | null;
  year?: number | null;
  journal?: string | null;
  doi?: string | null;
  kind: string;
  summary?: string | null;
  source_url?: string | null;
  key_claims?: Claim[] | null;
  architectural_patterns?: Claim[] | null;
  methodological_recipes?: Claim[] | null;
  quantitative_parameters?: Claim[] | null;
  evaluation_metrics?: Claim[] | null;
  anti_patterns_pitfalls?: Claim[] | null;
  reliability_methodology?: number | null;
  reliability_evidence_base?: number | null;
  reliability_applicability?: number | null;
  reliability_reproducibility?: number | null;
  reliability_relevance?: number | null;
  reliability_overall?: number | null;
}

function reliabilityCls(score: number | null | undefined) {
  if (score == null) return 'bg-slate-100 text-slate-600 border-slate-300';
  if (score >= 4) return 'bg-emerald-100 text-emerald-700 border-emerald-300';
  if (score >= 2.5) return 'bg-amber-100 text-amber-700 border-amber-300';
  return 'bg-red-100 text-red-700 border-red-300';
}

const DIMS: Array<{ key: keyof MetaStudyDetailed; labelKey: string; fallback: string }> = [
  { key: 'reliability_methodology', labelKey: 'fundamentos.kanban.dim.methodology', fallback: 'Metodologia' },
  { key: 'reliability_evidence_base', labelKey: 'fundamentos.kanban.dim.evidenceBase', fallback: 'Base de evidência' },
  { key: 'reliability_applicability', labelKey: 'fundamentos.kanban.dim.applicability', fallback: 'Aplicabilidade' },
  { key: 'reliability_reproducibility', labelKey: 'fundamentos.kanban.dim.reproducibility', fallback: 'Reprodutibilidade' },
  { key: 'reliability_relevance', labelKey: 'fundamentos.kanban.dim.relevance', fallback: 'Relevância translacional' },
];

interface Section {
  key: keyof MetaStudyDetailed;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  labelKey: string;
  fallback: string;
}

const SECTIONS: Section[] = [
  { key: 'quantitative_parameters', icon: Sigma, color: 'text-indigo-700 bg-indigo-50 border-indigo-200', labelKey: 'fundamentos.excerpts.quant', fallback: 'Parâmetros & fórmulas' },
  { key: 'evaluation_metrics', icon: Gauge, color: 'text-emerald-700 bg-emerald-50 border-emerald-200', labelKey: 'fundamentos.excerpts.metrics', fallback: 'Métricas de avaliação' },
  { key: 'architectural_patterns', icon: Network, color: 'text-sky-700 bg-sky-50 border-sky-200', labelKey: 'fundamentos.excerpts.patterns', fallback: 'Padrões arquiteturais' },
  { key: 'methodological_recipes', icon: Wrench, color: 'text-amber-700 bg-amber-50 border-amber-200', labelKey: 'fundamentos.excerpts.recipes', fallback: 'Receitas metodológicas' },
  { key: 'anti_patterns_pitfalls', icon: AlertTriangle, color: 'text-red-700 bg-red-50 border-red-200', labelKey: 'fundamentos.excerpts.antiPatterns', fallback: 'Anti-padrões & armadilhas' },
];

const ClaimItem: React.FC<{ item: Claim }> = ({ item }) => {
  const main = item.statement || item.claim || '';
  return (
    <li className="space-y-1">
      {main && <div className="text-sm font-medium leading-snug">{main}</div>}
      {item.quote && (
        <blockquote className="text-xs italic text-muted-foreground border-l-2 border-primary/40 pl-2 leading-relaxed">
          “{item.quote}”
        </blockquote>
      )}
      <div className="flex items-center gap-1 flex-wrap">
        {item.applies_to && (
          <Badge variant="outline" className="text-[9px] py-0 font-normal">{item.applies_to}</Badge>
        )}
        {typeof item.weight === 'number' && (
          <Badge variant="outline" className="text-[9px] py-0 font-mono">w={item.weight}</Badge>
        )}
      </div>
    </li>
  );
};

const MetaStudyDetailedCard: React.FC<{ study: MetaStudyDetailed }> = ({ study }) => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [chat, setChat] = useState(false);

  const totalExcerpts = SECTIONS.reduce((acc, s) => acc + ((study[s.key] as Claim[] | null)?.length || 0), 0);
  const doiUrl = study.doi ? `https://doi.org/${study.doi.replace(/^https?:\/\/(dx\.)?doi\.org\//, '')}` : null;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-base leading-snug">{study.title}</CardTitle>
            <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1.5 flex-wrap">
              {study.authors && <span className="line-clamp-1">{study.authors}</span>}
              {study.year && <span>· {study.year}</span>}
              {study.journal && (
                <span className="italic">· {study.journal}</span>
              )}
              <Badge variant="outline" className="text-[10px]">{study.kind}</Badge>
            </div>
          </div>
          <Popover>
            <PopoverTrigger asChild>
              <button>
                <Badge variant="outline" className={`${reliabilityCls(study.reliability_overall)} cursor-pointer`}>
                  ★ {study.reliability_overall != null ? Number(study.reliability_overall).toFixed(1) : '—'}/5
                </Badge>
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-2">
              <div className="text-xs font-semibold mb-1.5">
                {t('fundamentos.kanban.reliabilityTitle', 'Confiabilidade do estudo (0–5)')}
              </div>
              <div className="space-y-1">
                {DIMS.map(d => {
                  const v = study[d.key] as number | null | undefined;
                  return (
                    <div key={d.key as string} className="flex items-center justify-between text-[11px]">
                      <span className="text-muted-foreground">{t(d.labelKey, d.fallback)}</span>
                      <span className="font-mono">{v != null ? Number(v).toFixed(1) : '—'}</span>
                    </div>
                  );
                })}
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {/* Linha de links / ações */}
        <div className="flex items-center gap-1.5 flex-wrap mt-2">
          {study.source_url && (
            <a
              href={study.source_url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-[11px] text-primary hover:underline px-2 py-0.5 rounded border border-primary/30 bg-primary/5"
            >
              <ExternalLink className="h-3 w-3" />
              {t('fundamentos.source', 'Fonte')}
            </a>
          )}
          {doiUrl && (
            <a
              href={doiUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-[11px] text-primary hover:underline px-2 py-0.5 rounded border border-primary/30 bg-primary/5"
              title={study.doi || ''}
            >
              <FileText className="h-3 w-3" />
              DOI
            </a>
          )}
          <button
            onClick={() => setChat(true)}
            className="inline-flex items-center gap-1 text-[11px] text-primary hover:underline px-2 py-0.5 rounded border border-primary/30 bg-primary/5"
          >
            <MessageSquare className="h-3 w-3" />
            {t('fundamentos.kanban.card.chatShort', 'chat')}
          </button>
        </div>
      </CardHeader>

      <CardContent className="text-sm space-y-3 pt-0">
        {study.summary && (
          <p className="text-muted-foreground leading-relaxed">{study.summary}</p>
        )}

        {/* Claims-chave: agora com quote + weight destacados */}
        {study.key_claims && study.key_claims.length > 0 && (
          <div>
            <div className="flex items-center gap-1.5 mb-1.5">
              <BookOpen className="h-3.5 w-3.5 text-purple-600" />
              <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {t('fundamentos.keyClaims', 'Claims-chave')}
              </span>
              <Badge variant="outline" className="text-[9px] py-0">{study.key_claims.length}</Badge>
            </div>
            <ul className="space-y-2.5 pl-1">
              {study.key_claims.map((c, i) => <ClaimItem key={i} item={c} />)}
            </ul>
          </div>
        )}

        {/* Excertos detalhados (quantitativo, métricas, padrões, receitas, anti-padrões) */}
        {totalExcerpts > 0 && (
          <Collapsible open={open} onOpenChange={setOpen}>
            <CollapsibleTrigger asChild>
              <Button variant="outline" size="sm" className="w-full justify-between h-8 text-xs">
                <span className="flex items-center gap-1.5">
                  <Sigma className="h-3.5 w-3.5 text-indigo-600" />
                  {t('fundamentos.excerpts.title', 'Citações & excertos detalhados')}
                  <Badge variant="secondary" className="text-[9px] py-0 ml-1">{totalExcerpts}</Badge>
                </span>
                {open ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-2 space-y-3">
              {SECTIONS.map(sec => {
                const items = (study[sec.key] as Claim[] | null) || [];
                if (items.length === 0) return null;
                const Icon = sec.icon;
                return (
                  <div key={sec.key as string} className={`rounded-md border p-2.5 ${sec.color}`}>
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <Icon className="h-3.5 w-3.5" />
                      <span className="text-[11px] font-semibold uppercase tracking-wide">
                        {t(sec.labelKey, sec.fallback)}
                      </span>
                      <Badge variant="outline" className="text-[9px] py-0 bg-white/60">{items.length}</Badge>
                    </div>
                    <ul className="space-y-2 pl-1 text-foreground">
                      {items.map((c, i) => <ClaimItem key={i} item={c} />)}
                    </ul>
                  </div>
                );
              })}
            </CollapsibleContent>
          </Collapsible>
        )}
      </CardContent>

      {chat && (
        <MetaStudyChatDialog
          open={chat}
          onOpenChange={setChat}
          metaStudyId={study.id}
          title={study.title}
        />
      )}
    </Card>
  );
};

export default MetaStudyDetailedCard;