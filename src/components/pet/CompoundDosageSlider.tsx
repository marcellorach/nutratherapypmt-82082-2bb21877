import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { X, RotateCcw, FlaskConical, Pill, MessageSquare, ChevronDown, ChevronUp, Send, Loader2, BookOpen, GitBranch, Network } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import ReactMarkdown from 'react-markdown';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

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
  studies?: Array<{
    id: string;
    title: string;
    year?: number;
    doi?: string | null;
    pmid?: string | null;
    link?: string | null;
    excerpt?: string | null;
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
    dosageCurrent, unit, evidenceLevel, rationale, removed, type, studies, mechanism,
  } = compound;

  const [chatOpen, setChatOpen] = useState(false);
  const [evidenceOpen, setEvidenceOpen] = useState(false);
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
        </div>
      </div>

      {/* Evidence & Context — collapsible block with mechanism, studies+excerpts, mini relations */}
      {((studies && studies.length > 0) || mechanism) && (
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
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold flex items-center gap-1 mb-1">
                  <GitBranch className="h-3 w-3" />
                  {t('petProfile.recommendation.mechanism', 'Mecanismo molecular')}
                </p>
                <p className="text-xs text-foreground/80 leading-relaxed">{mechanism}</p>
              </div>
            )}

            {/* Studies with highlighted excerpts */}
            {studies && studies.length > 0 && (
              <div className="space-y-2">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold flex items-center gap-1">
                  <BookOpen className="h-3 w-3" />
                  {t('petProfile.recommendation.evidenceStudies', 'Estudos científicos')} ({studies.length})
                </p>
                <div className="space-y-2">
                  {studies.map((s) => {
                    const href = s.link
                      || (s.doi ? `https://doi.org/${s.doi}` : null)
                      || (s.pmid ? `https://pubmed.ncbi.nlm.nih.gov/${s.pmid}` : null);
                    const label = `${s.title}${s.year ? ` (${s.year})` : ''}`;
                    return (
                      <div key={s.id} className="border-l-2 border-primary/40 pl-3 py-1">
                        {href ? (
                          <a
                            href={href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-primary hover:underline font-medium line-clamp-2 block"
                            title={label}
                          >
                            {label}
                          </a>
                        ) : (
                          <span className="text-xs text-foreground font-medium line-clamp-2 block">{label}</span>
                        )}
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
    </div>
  );
};

export default CompoundDosageSlider;
