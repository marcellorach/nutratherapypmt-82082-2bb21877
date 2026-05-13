import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { X, RotateCcw, FlaskConical, Pill, MessageSquare, ChevronDown, ChevronUp, Send, Loader2, BookOpen, GitBranch, Network, Maximize2, ExternalLink, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import ReactMarkdown from 'react-markdown';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { predicateBadgeColors, predicateSymbols } from './utils/predicateStyles';

export interface CompoundDosage {
  id: string;
  name: string;
  condition: string;
  dosageMin: number;
  dosageMax: number;
  dosageRecommended: number;
  dosageCurrent: number;
  unit: string;
  evidenceLevel: 'KG-backed' | 'AI-suggested' | 'clinical-experience';
  rationale: string;
  removed: boolean;
  type: 'nutraceutical' | 'drug';
  mechanism?: string | null;
  /** Provenance of the dose range itself (separate from clinical evidenceLevel). */
  doseSource?: 'kg_triplet' | 'curated_study' | 'web_authoritative' | 'llm_estimate' | 'default_class';
  doseSourceUrl?: string | null;
  doseSourceCitation?: string | null;
  doseConfidence?: number;
  doseNeedsReview?: boolean;
  doseAdjustments?: string[];
  doseTotalDailyMg?: number | null;
  doseFrequencyPerDay?: number | null;
  studies?: Array<{
    id: string;
    title: string;
    year?: number;
    doi?: string | null;
    pmid?: string | null;
    link?: string | null;
    excerpt?: string | null;
    provenance?: 'paired' | 'compound-only' | 'public-search';
  }>;
  kgTriplets?: Array<{
    subject: string;
    predicate: string;
    object: string;
    confidence: number;
    evidenceLevel: string;
    studyCount?: number;
  }>;
  synergies?: Array<{
    condition: string;
    predicate: string;
    studyCount?: number;
  }>;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface CompoundDosageSliderProps {
  compound: CompoundDosage;
  onChange: (id: string, newDosage: number) => void;
  onRemove: (id: string) => void;
  onRestore: (id: string) => void;
  petName?: string;
  petBreed?: string;
  petAge?: number;
  petConditions?: string[];
}

const evidenceBadgeStyles: Record<string, string> = {
  'KG-backed': 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300',
  'AI-suggested': 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
  'clinical-experience': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
};

const escapeHtml = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Returns a short label + tailwind classes describing where a study link
// will land (DOI registry, PubMed, PMC, Scholar or other external host).
const getLinkSource = (
  href: string | null | undefined,
  t: (k: string, def?: string) => string,
): { label: string; cls: string } | null => {
  if (!href) return null;
  let host = '';
  try {
    host = new URL(href).hostname.toLowerCase();
  } catch {
    return null;
  }
  if (host === 'doi.org' || host.endsWith('.doi.org'))
    return { label: t('petProfile.recommendation.linkSource.doi', 'DOI'), cls: 'bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-300' };
  if (host.includes('pubmed.ncbi.nlm.nih.gov'))
    return { label: t('petProfile.recommendation.linkSource.pubmed', 'PubMed'), cls: 'bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-300' };
  if (host.includes('pmc.ncbi.nlm.nih.gov') || host.includes('ncbi.nlm.nih.gov'))
    return { label: t('petProfile.recommendation.linkSource.pmc', 'PMC'), cls: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300' };
  if (host.includes('scholar.google'))
    return { label: t('petProfile.recommendation.linkSource.scholar', 'Scholar'), cls: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300' };
  return { label: t('petProfile.recommendation.linkSource.external', 'Externo'), cls: 'bg-muted text-muted-foreground' };
};

const resolveStudyHref = (study: {
  link?: string | null;
  doi?: string | null;
  pmid?: string | null;
  title?: string | null;
}) => {
  if (study.link && /^https?:\/\//i.test(study.link)) return study.link;

  if (study.doi) {
    const doi = String(study.doi).replace(/^https?:\/\/(dx\.)?doi\.org\//i, '').trim();
    if (doi) return `https://doi.org/${doi}`;
  }

  if (study.pmid) {
    const pmid = String(study.pmid).trim();
    if (pmid) return `https://pubmed.ncbi.nlm.nih.gov/${pmid}`;
  }

  if (study.title) {
    return `https://scholar.google.com/scholar?q=${encodeURIComponent(study.title)}`;
  }

  return null;
};

const CompoundDosageSlider: React.FC<CompoundDosageSliderProps> = ({
  compound,
  onChange,
  onRemove,
  onRestore,
  petName,
  petBreed,
  petAge,
  petConditions,
}) => {
  const { t } = useTranslation();
  const {
    id, name, condition, dosageMin, dosageMax, dosageRecommended,
    dosageCurrent, unit, evidenceLevel, rationale, removed, type, studies, mechanism, kgTriplets, synergies,
    doseSource, doseSourceUrl, doseSourceCitation, doseConfidence, doseNeedsReview,
    doseAdjustments, doseTotalDailyMg, doseFrequencyPerDay,
  } = compound;

  const [chatOpen, setChatOpen] = useState(false);
  const [evidenceOpen, setEvidenceOpen] = useState(false);
  const [mechanismOpen, setMechanismOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const isModified = dosageCurrent !== dosageRecommended;
  const recommendedPercent = ((dosageRecommended - dosageMin) / (dosageMax - dosageMin)) * 100;

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage: ChatMessage = { role: 'user', content: input.trim() };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const conditionsContext = petConditions?.length
        ? `Current conditions: ${petConditions.join(', ')}.`
        : '';

      const systemPrompt = `You are a veterinary pharmacology and nutraceutical specialist. You are discussing ${name} for treating ${condition} in a ${petBreed || 'dog'} named ${petName || 'the patient'}, ${petAge || '?'} years old. ${conditionsContext}

Current dosage: ${dosageCurrent} ${unit} (range: ${dosageMin}-${dosageMax} ${unit}, recommended: ${dosageRecommended} ${unit}).
Evidence level: ${evidenceLevel}.
Scientific rationale: ${rationale || 'N/A'}.

IMPORTANT: When explaining mechanisms, describe the biological pathways involved (e.g., "Curcumin → inhibits NF-κB → reduces pro-inflammatory cytokines → decreases joint inflammation"). Always ground your answers in scientific evidence. Be concise and clinically relevant. Respond in the same language the user writes in.`;

      const allMessages = [
        { role: 'system', content: systemPrompt },
        ...messages.map(m => ({ role: m.role, content: m.content })),
        { role: 'user', content: input.trim() },
      ];

      const { data, error } = await supabase.functions.invoke('chat', {
        body: { messages: allMessages, stream: false },
      });

      if (error) throw error;
      const assistantContent = data?.response || t('petProfile.compoundChat.noResponse');
      setMessages(prev => [...prev, { role: 'assistant', content: assistantContent }]);
    } catch (err: any) {
      console.error('Compound chat error:', err);
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: t('petProfile.compoundChat.error') },
      ]);
    } finally {
      setLoading(false);
    }
  };

  if (removed) {
    return (
      <div className="flex items-center justify-between p-3 border border-dashed rounded-lg opacity-50 bg-muted/30">
        <div className="flex items-center gap-2">
          {type === 'nutraceutical' ? (
            <FlaskConical className="h-4 w-4 text-muted-foreground" />
          ) : (
            <Pill className="h-4 w-4 text-muted-foreground" />
          )}
          <span className="text-sm line-through text-muted-foreground">{name}</span>
          <span className="text-xs text-muted-foreground">→ {condition}</span>
        </div>
        <Button variant="ghost" size="sm" onClick={() => onRestore(id)} className="h-7 text-xs gap-1">
          <RotateCcw className="h-3 w-3" />
          {t('petProfile.recommendation.restore')}
        </Button>
      </div>
    );
  }

  return (
    <div className="p-4 border rounded-lg bg-card hover:shadow-sm transition-shadow">
      {/* Header */}
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          {type === 'nutraceutical' ? (
            <FlaskConical className="h-4 w-4 text-emerald-600" />
          ) : (
            <Pill className="h-4 w-4 text-blue-600" />
          )}
          <span className="font-medium text-sm">{name}</span>
          <span className="text-xs text-muted-foreground">→ {condition}</span>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className={cn('text-[10px] px-1.5 py-0', evidenceBadgeStyles[evidenceLevel])}>
            {evidenceLevel}
          </Badge>
          {isModified && (
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300">
              {t('petProfile.recommendation.modified')}
            </Badge>
          )}
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onRemove(id)}>
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Rationale */}
      <p className="text-xs text-muted-foreground mb-3 pl-6">{rationale}</p>

      {/* Slider */}
      <div className="relative px-1">
        <div
          className="absolute -top-1 z-10 flex flex-col items-center pointer-events-none"
          style={{ left: `calc(${recommendedPercent}% - 1px)` }}
        >
          <div className="w-0.5 h-3 bg-emerald-500 rounded-full" />
        </div>

        <Slider
          min={dosageMin}
          max={dosageMax}
          step={Math.max(0.1, (dosageMax - dosageMin) / 100)}
          value={[dosageCurrent]}
          onValueChange={([v]) => onChange(id, Math.round(v * 10) / 10)}
          className="my-2"
        />

        <div className="flex items-center justify-between text-[10px] text-muted-foreground mt-1">
          <span>{dosageMin} {unit}</span>
          <span className="text-emerald-600 font-medium">
            {t('petProfile.recommendation.recommended')}: {dosageRecommended} {unit}
          </span>
          <span>{dosageMax} {unit}</span>
        </div>

        <div className="text-center mt-1">
          <span className={cn(
            "text-sm font-semibold",
            isModified ? "text-orange-600" : "text-foreground"
          )}>
            {dosageCurrent} {unit}
          </span>
          {typeof doseTotalDailyMg === 'number' && doseTotalDailyMg > 0 && (
            <div className="text-[10px] text-muted-foreground mt-0.5">
              {t('petProfile.recommendation.totalDaily', 'Total/dia')}: ~{doseTotalDailyMg} mg
              {doseFrequencyPerDay ? ` (${doseFrequencyPerDay}x/dia)` : ''}
            </div>
          )}
        </div>

        {/* Dose source provenance + adjustments */}
        {doseSource && (
          <div className="mt-2 flex flex-wrap items-center justify-center gap-1.5">
            {doseSource === 'kg_triplet' && (
              <Badge variant="secondary" className="text-[10px] gap-1 bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300">
                <Network className="h-3 w-3" /> {t('petProfile.recommendation.doseSource.kg', 'Dose do Knowledge Graph')}
              </Badge>
            )}
            {doseSource === 'curated_study' && (
              <Badge variant="secondary" className="text-[10px] gap-1 bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300">
                <BookOpen className="h-3 w-3" /> {t('petProfile.recommendation.doseSource.curated', 'Dose curada (estudo)')}
              </Badge>
            )}
            {doseSource === 'web_authoritative' && (
              <a
                href={doseSourceUrl || '#'}
                target="_blank"
                rel="noopener noreferrer"
                className="no-underline"
                title={doseSourceCitation || ''}
              >
                <Badge variant="secondary" className="text-[10px] gap-1 bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 cursor-pointer hover:bg-amber-200">
                  <ExternalLink className="h-3 w-3" />
                  {t('petProfile.recommendation.doseSource.web', 'Dose de fonte vet. autoritativa')}
                </Badge>
              </a>
            )}
            {doseSource === 'llm_estimate' && (
              <Badge variant="outline" className="text-[10px] gap-1 border-amber-400 text-amber-700">
                <Info className="h-3 w-3" /> {t('petProfile.recommendation.doseSource.llm', 'Estimativa de IA — pendente de fonte')}
              </Badge>
            )}
            {doseSource === 'default_class' && (
              <Badge variant="outline" className="text-[10px] gap-1 border-muted-foreground/40 text-muted-foreground">
                <Info className="h-3 w-3" /> {t('petProfile.recommendation.doseSource.estimate', 'Estimativa genérica — sem fonte')}
              </Badge>
            )}
            {doseNeedsReview && doseSource !== 'kg_triplet' && doseSource !== 'curated_study' && (
              <Badge variant="outline" className="text-[10px] border-amber-400 text-amber-700">
                {t('petProfile.recommendation.doseSource.needsReview', 'Requer curadoria')}
              </Badge>
            )}
          </div>
        )}
        {doseSourceCitation && (doseSource === 'web_authoritative' || doseSource === 'curated_study') && (
          <p className="mt-1 text-center text-[10px] text-muted-foreground italic line-clamp-2">
            {doseSourceCitation}
          </p>
        )}
        {doseAdjustments && doseAdjustments.length > 0 && (
          <ul className="mt-1.5 space-y-0.5 text-[10px] text-muted-foreground">
            {doseAdjustments.map((adj, i) => (
              <li key={i} className="flex items-start gap-1">
                <span className="text-amber-500 mt-0.5">•</span>
                <span>{adj}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Evidence & Context — collapsible block with mechanism, KG triplets,
          synergies, studies+excerpts, mini relations. */}
      {((studies && studies.length > 0) || mechanism || (kgTriplets && kgTriplets.length > 0) || (synergies && synergies.length > 0)) && (
        <Collapsible open={evidenceOpen} onOpenChange={setEvidenceOpen}>
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="w-full mt-2 text-xs gap-1.5 text-muted-foreground hover:text-foreground"
            >
              <BookOpen className="h-3.5 w-3.5" />
              {t('petProfile.recommendation.evidenceAndContext', 'Ver evidências e contexto')}
              {studies && studies.length > 0 && (
                <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded">{studies.length}</span>
              )}
              {evidenceOpen ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-2 space-y-3 px-1">
            {/* Mechanism */}
            {mechanism && (
              <div className="rounded-md border bg-muted/30 px-3 py-2">
                <div className="flex items-center justify-between mb-1 gap-2">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold flex items-center gap-1">
                    <GitBranch className="h-3 w-3" />
                    {t('petProfile.recommendation.mechanism', 'Mecanismo molecular')}
                  </p>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-[10px] gap-1"
                    onClick={() => setMechanismOpen(true)}
                    title={t('common.expand', 'Expandir')}
                  >
                    <Maximize2 className="h-3 w-3" />
                    {t('common.expand', 'Expandir')}
                  </Button>
                </div>
                <p className="text-xs text-foreground/80 leading-relaxed line-clamp-3">{mechanism}</p>
                <button
                  type="button"
                  onClick={() => setMechanismOpen(true)}
                  className="text-[10px] text-primary hover:underline mt-1"
                >
                  {t('common.readMore', 'Ler mais')}
                </button>
              </div>
            )}

            {/* Knowledge Graph triplets — what the KG says about (compound, condition) */}
            {kgTriplets && kgTriplets.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold flex items-center gap-1">
                  <Network className="h-3 w-3" />
                  {t('petProfile.recommendation.knowledgeGraph', 'Knowledge Graph')}
                </p>
                <div className="space-y-1.5">
                  {kgTriplets.map((kg, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-1.5 p-1.5 rounded-md border bg-muted/30 text-xs flex-wrap"
                    >
                      <FlaskConical className="h-3 w-3 text-primary shrink-0" />
                      <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300 font-medium">
                        {kg.subject}
                      </span>
                      <span className={cn('text-[10px] font-semibold px-1.5 py-0.5 rounded border', predicateBadgeColors[kg.predicate] || 'bg-muted text-muted-foreground border-border')}>
                        {predicateSymbols[kg.predicate] || '→'} {kg.predicate}
                      </span>
                      <span className="px-1.5 py-0.5 rounded bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300 font-medium">
                        {kg.object}
                      </span>
                      <div className="ml-auto flex items-center gap-1.5 shrink-0">
                        {!!kg.studyCount && (
                          <span className="text-[10px] text-muted-foreground">
                            {kg.studyCount} {t('petProfile.evidence.studies', 'estudos')}
                          </span>
                        )}
                        <Badge variant="default" className="text-[10px] px-1.5 py-0">
                          {kg.evidenceLevel}
                        </Badge>
                        <span className="text-[10px] text-muted-foreground">
                          {Math.round((kg.confidence || 0) * 100)}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Synergies — same compound treats other patient conditions */}
            {synergies && synergies.length > 0 && (
              <div className="rounded-md border border-primary/20 bg-primary/5 px-3 py-2 space-y-1.5">
                <p className="text-[10px] uppercase tracking-wider text-primary font-semibold flex items-center gap-1">
                  <Network className="h-3 w-3" />
                  {t('petProfile.recommendation.synergies', 'Sinergias com outras condições do paciente')}
                </p>
                <div className="flex flex-col gap-1">
                  {synergies.map((s, idx) => (
                    <div key={idx} className="flex items-center gap-1.5 text-xs flex-wrap">
                      <span className={cn('text-[10px] font-semibold px-1.5 py-0.5 rounded border', predicateBadgeColors[s.predicate] || 'bg-muted text-muted-foreground border-border')}>
                        {predicateSymbols[s.predicate] || '→'} {s.predicate}
                      </span>
                      <span className="px-1.5 py-0.5 rounded bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300 font-medium">
                        {s.condition}
                      </span>
                      {!!s.studyCount && (
                        <span className="text-[10px] text-muted-foreground">
                          {s.studyCount} {t('petProfile.evidence.studies', 'estudos')}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Studies with highlighted excerpts */}
            {studies && studies.length > 0 && (
              <div className="space-y-2">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold flex items-center gap-1">
                  <BookOpen className="h-3 w-3" />
                  {t('petProfile.recommendation.evidenceStudies', 'Estudos científicos')} ({studies.length})
                </p>
                {studies.every((s: any) => s.provenance === 'compound-only') && (
                  <div className="flex items-start gap-1.5 text-[10px] text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/20 border border-amber-200/60 dark:border-amber-800/40 rounded px-2 py-1">
                    <Info className="h-3 w-3 mt-0.5 shrink-0" />
                    <span>{t('petProfile.recommendation.studiesCompoundOnly', 'Estudos sobre o composto (não específicos a esta condição).')}</span>
                  </div>
                )}
                <div className="space-y-2">
                  {studies.map((s) => {
                    // The pipeline now always normalizes `link` (DOI → PubMed → Scholar fallback).
                    const href = resolveStudyHref(s);
                    const label = `${s.title}${s.year ? ` (${s.year})` : ''}`;
                    const source = getLinkSource(href, t as any);
                    return (
                      <div key={s.id} className="border-l-2 border-primary/40 pl-3 py-1">
                        <div className="flex items-start gap-1.5 flex-wrap">
                          {href ? (
                            <a
                              href={href}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-primary hover:underline font-medium line-clamp-2 inline-flex items-start gap-1"
                              title={`${label} — ${t('petProfile.recommendation.openExternal', 'Abrir estudo')}`}
                              aria-label={t('petProfile.recommendation.openExternal', 'Abrir estudo')}
                            >
                              <span>{label}</span>
                              <ExternalLink className="h-3 w-3 mt-0.5 shrink-0 opacity-70" />
                            </a>
                          ) : (
                            <span className="text-xs text-foreground font-medium line-clamp-2">{label}</span>
                          )}
                          {source && (
                            <span className={cn('text-[9px] uppercase tracking-wider font-semibold px-1.5 py-0.5 rounded shrink-0 mt-0.5', source.cls)}>
                              {source.label}
                            </span>
                          )}
                          {(s as any).provenance === 'compound-only' && (
                            <span className="text-[9px] uppercase tracking-wider font-semibold px-1.5 py-0.5 rounded shrink-0 mt-0.5 bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
                              {t('petProfile.recommendation.linkSource.generic', 'Geral')}
                            </span>
                          )}
                        </div>
                        {s.excerpt && (
                          <p
                            className="text-[11px] text-muted-foreground italic mt-1 leading-relaxed"
                            dangerouslySetInnerHTML={{
                              __html: `“${escapeHtml(s.excerpt).replace(
                                new RegExp(`(${escapeRegex(name)})`, 'gi'),
                                '<mark class="bg-yellow-200 dark:bg-yellow-900/50 text-foreground rounded px-0.5">$1</mark>',
                              )}”`,
                            }}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Mini relations — composto → condição (inline, sem grafo pesado) */}
            <div className="rounded-md border bg-muted/20 px-3 py-2">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold flex items-center gap-1 mb-1">
                <Network className="h-3 w-3" />
                {t('petProfile.recommendation.relations', 'Conexões no Knowledge Graph')}
              </p>
              <div className="flex items-center gap-2 text-xs flex-wrap">
                <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300 font-medium">
                  {name}
                </span>
                <span className="text-muted-foreground">→ {t('petProfile.recommendation.targets', 'atua em')} →</span>
                <span className="px-2 py-0.5 rounded bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300 font-medium">
                  {condition}
                </span>
              </div>
              <p className="text-[10px] text-muted-foreground mt-1.5">
                {t('petProfile.recommendation.relationsHint', 'Veja o grafo completo do paciente na aba "Caminho Biológico".')}
              </p>
            </div>
          </CollapsibleContent>
        </Collapsible>
      )}

      {/* Inline Discuss Chat */}
      <Collapsible open={chatOpen} onOpenChange={setChatOpen}>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" size="sm" className="w-full mt-2 text-xs gap-1.5 text-muted-foreground hover:text-foreground">
            <MessageSquare className="h-3.5 w-3.5" />
            {t('petProfile.compoundSlider.discuss')}
            {chatOpen ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-2 space-y-2">
          <ScrollArea className="h-[200px] pr-2 border rounded-lg p-2 bg-muted/20" ref={scrollRef as any}>
            <div className="space-y-2">
              {messages.length === 0 && (
                <div className="text-center py-4">
                  <p className="text-xs text-muted-foreground mb-2">
                    {t('petProfile.compoundSlider.chatPlaceholder', { compound: name })}
                  </p>
                  <div className="space-y-1">
                    {[
                      t('petProfile.compoundSlider.q1', { compound: name }),
                      t('petProfile.compoundSlider.q2', { compound: name, condition }),
                      t('petProfile.compoundSlider.q3', { compound: name }),
                    ].map((q, i) => (
                      <button
                        key={i}
                        className="block w-full text-left text-xs text-primary hover:underline px-2 py-0.5 rounded hover:bg-muted/50"
                        onClick={() => setInput(q)}
                      >
                        💬 {q}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {messages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={cn(
                    'max-w-[85%] rounded-lg px-3 py-1.5 text-xs',
                    msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'
                  )}>
                    {msg.role === 'assistant' ? (
                      <div className="prose prose-xs dark:prose-invert max-w-none">
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                      </div>
                    ) : msg.content}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-muted rounded-lg px-3 py-1.5">
                    <Loader2 className="h-3 w-3 animate-spin" />
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
          <div className="flex gap-1.5">
            <Input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
              placeholder={t('petProfile.compoundSlider.inputPlaceholder')}
              disabled={loading}
              className="text-xs h-8"
            />
            <Button size="icon" className="h-8 w-8 shrink-0" onClick={handleSend} disabled={loading || !input.trim()}>
              <Send className="h-3.5 w-3.5" />
            </Button>
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Mechanism full-view dialog */}
      {mechanism && (
        <Dialog open={mechanismOpen} onOpenChange={setMechanismOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <GitBranch className="h-4 w-4" />
                {t('petProfile.recommendation.mechanism', 'Mecanismo molecular')}
              </DialogTitle>
              <DialogDescription>
                {name} — {condition}
              </DialogDescription>
            </DialogHeader>
            <ScrollArea className="max-h-[60vh] pr-4">
              <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap">
                {mechanism}
              </p>
            </ScrollArea>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default CompoundDosageSlider;
