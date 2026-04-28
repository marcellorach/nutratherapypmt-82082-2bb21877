import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { X, RotateCcw, FlaskConical, Pill, MessageSquare, ChevronDown, ChevronUp, Send, Loader2, BookOpen } from 'lucide-react';
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
  studies?: Array<{
    id: string;
    title: string;
    year?: number;
    doi?: string | null;
    pmid?: string | null;
    link?: string | null;
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
    dosageCurrent, unit, evidenceLevel, rationale, removed, type, studies,
  } = compound;

  const [chatOpen, setChatOpen] = useState(false);
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

      {/* Scientific studies backing this recommendation */}
      {studies && studies.length > 0 && (
        <div className="mt-3 pl-1 space-y-1">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold flex items-center gap-1">
            <BookOpen className="h-3 w-3" />
            {t('petProfile.recommendation.evidenceStudies', 'Estudos científicos')}
          </p>
          <div className="space-y-1">
            {studies.map((s) => {
              const href = s.link
                || (s.doi ? `https://doi.org/${s.doi}` : null)
                || (s.pmid ? `https://pubmed.ncbi.nlm.nih.gov/${s.pmid}` : null);
              const label = `${s.title}${s.year ? ` (${s.year})` : ''}`;
              if (!href) {
                return (
                  <span key={s.id} className="block text-xs text-muted-foreground line-clamp-2">
                    • {label}
                  </span>
                );
              }
              return (
                <a
                  key={s.id}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-xs text-primary hover:underline line-clamp-2"
                  title={label}
                >
                  • {label}
                </a>
              );
            })}
          </div>
        </div>
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
