import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Loader2, Send, Search, AlertTriangle, Database, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import MermaidBlock from '@/components/shared/MermaidBlock';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface DatabaseContext {
  relations: string;
  predispositions: string;
  tripletsSummary: string;
  studiesSummary: string;
}

const EXAMPLE_QUESTIONS = [
  'relations.auditor.examples.whyLowEfficacy',
  'relations.auditor.examples.inconsistencies',
  'relations.auditor.examples.bestEvidence',
  'relations.auditor.examples.missingData',
];

const RelationsAuditorChat: React.FC = () => {
  const { t } = useTranslation();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingContext, setIsLoadingContext] = useState(true);
  const [context, setContext] = useState<DatabaseContext | null>(null);
  const [contextStats, setContextStats] = useState({ relations: 0, predispositions: 0, triplets: 0, studies: 0 });
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Load deep context from database
  useEffect(() => {
    const loadContext = async () => {
      setIsLoadingContext(true);
      try {
        // Parallel queries
        const [relationsRes, predispositionsRes, tripletsRes, studiesRes] = await Promise.all([
          supabase
            .from('nutraceutical_conditions')
            .select(`
              efficacy_score,
              relationship_type,
              notes,
              nutraceutical:nutraceutical_id(name, name_en),
              condition:condition_id(name, name_en)
            `)
            .limit(500),
          supabase
            .from('breed_predispositions')
            .select(`
              risk_factor,
              evidence_grade,
              notes,
              breed:breed_id(name, name_en),
              condition:condition_id(name, name_en)
            `)
            .limit(500),
          supabase
            .from('triplet_extractions')
            .select('subject_name, predicate, object_name, subject_type, object_type, extraction_confidence, curation_status, intensity, evidence_level')
            .limit(500),
          supabase
            .from('nutraceutical_studies')
            .select('nutraceutical_id, study_id')
            .limit(1000),
        ]);

        // Format relations
        const relations = (relationsRes.data || []).map((r: any) => {
          const nutraName = r.nutraceutical?.name || 'Unknown';
          const condName = r.condition?.name || 'Unknown';
          return `- ${nutraName} → ${condName}: efficacy=${r.efficacy_score || 'N/A'}, type=${r.relationship_type || 'N/A'}${r.notes ? `, notes="${r.notes}"` : ''}`;
        }).join('\n');

        // Format predispositions
        const predispositions = (predispositionsRes.data || []).map((p: any) => {
          const breedName = p.breed?.name || 'Unknown';
          const condName = p.condition?.name || 'Unknown';
          return `- ${breedName} → ${condName}: risk=${p.risk_factor}, evidence=${p.evidence_grade}${p.notes ? `, notes="${p.notes}"` : ''}`;
        }).join('\n');

        // Format triplets summary (group by predicate)
        const triplets = tripletsRes.data || [];
        const predicateCounts: Record<string, number> = {};
        const statusCounts: Record<string, number> = {};
        triplets.forEach((t: any) => {
          predicateCounts[t.predicate] = (predicateCounts[t.predicate] || 0) + 1;
          statusCounts[t.curation_status || 'pending'] = (statusCounts[t.curation_status || 'pending'] || 0) + 1;
        });
        const tripletsSummary = [
          `Total de triplets: ${triplets.length}`,
          `Por tipo de relação: ${Object.entries(predicateCounts).map(([k, v]) => `${k}(${v})`).join(', ')}`,
          `Por status de curadoria: ${Object.entries(statusCounts).map(([k, v]) => `${k}(${v})`).join(', ')}`,
          `Exemplos:`,
          ...triplets.slice(0, 20).map((t: any) => `  - ${t.subject_name} --[${t.predicate}]--> ${t.object_name} (confidence=${t.extraction_confidence}, intensity=${t.intensity || 'N/A'}, evidence=${t.evidence_level || 'N/A'})`)
        ].join('\n');

        // Format studies summary
        const studies = studiesRes.data || [];
        const studyCountByNutra: Record<string, number> = {};
        studies.forEach((s: any) => {
          studyCountByNutra[s.nutraceutical_id] = (studyCountByNutra[s.nutraceutical_id] || 0) + 1;
        });
        const studiesSummary = `Total de associações nutracêutico-estudo: ${studies.length}\nNutracêuticos com estudos: ${Object.keys(studyCountByNutra).length}`;

        setContext({
          relations: relations || 'Nenhuma relação encontrada no banco.',
          predispositions: predispositions || 'Nenhuma predisposição encontrada no banco.',
          tripletsSummary,
          studiesSummary,
        });

        setContextStats({
          relations: relationsRes.data?.length || 0,
          predispositions: predispositionsRes.data?.length || 0,
          triplets: triplets.length,
          studies: studies.length,
        });
      } catch (error) {
        console.error('Error loading auditor context:', error);
        toast.error(t('relations.auditor.contextError'));
      } finally {
        setIsLoadingContext(false);
      }
    };

    loadContext();
  }, [t]);

  const sendMessage = async (messageText?: string) => {
    const text = messageText || input.trim();
    if (!text || isLoading) return;

    const userMessage: Message = { role: 'user', content: text };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('relations-auditor', {
        body: {
          messages: newMessages.map(m => ({ role: m.role, content: m.content })),
          context,
        },
      });

      if (error) throw error;

      if (data?.error) {
        if (data.error.includes('429') || data.error.includes('Rate') || data.error.includes('Limite')) {
          toast.error(t('relations.auditor.rateLimited'));
        } else if (data.error.includes('402') || data.error.includes('Payment') || data.error.includes('Créditos')) {
          toast.error(t('relations.auditor.paymentRequired'));
        } else {
          throw new Error(data.error);
        }
        return;
      }

      const assistantMessage: Message = {
        role: 'assistant',
        content: data?.response || t('relations.auditor.emptyResponse'),
      };
      setMessages([...newMessages, assistantMessage]);
    } catch (error) {
      console.error('Auditor chat error:', error);
      toast.error(t('relations.auditor.sendError'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Custom markdown components to render mermaid blocks
  const markdownComponents = {
    code({ className, children, ...props }: any) {
      const match = /language-mermaid/.exec(className || '');
      if (match) {
        return <MermaidBlock code={String(children).replace(/\n$/, '')} />;
      }
      return (
        <code className={className} {...props}>
          {children}
        </code>
      );
    },
    pre({ children }: any) {
      // Check if the child is a mermaid code block
      const child = React.Children.toArray(children)[0] as React.ReactElement;
      if (child?.props?.className?.includes('language-mermaid')) {
        return <>{children}</>;
      }
      return <pre className="overflow-x-auto rounded-lg bg-muted p-4 text-sm">{children}</pre>;
    },
  };

  if (isLoadingContext) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground">{t('relations.auditor.loadingContext')}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[600px]">
      {/* Context Stats Bar */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <Database className="h-4 w-4 text-muted-foreground" />
        <span className="text-xs text-muted-foreground">{t('relations.auditor.contextLoaded')}:</span>
        <Badge variant="secondary" className="text-xs">{contextStats.relations} {t('relations.auditor.relationsCount')}</Badge>
        <Badge variant="secondary" className="text-xs">{contextStats.predispositions} {t('relations.auditor.predispositionsCount')}</Badge>
        <Badge variant="secondary" className="text-xs">{contextStats.triplets} {t('relations.auditor.tripletsCount')}</Badge>
        <Badge variant="secondary" className="text-xs">{contextStats.studies} {t('relations.auditor.studiesCount')}</Badge>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-6">
            <div className="text-center">
              <Sparkles className="h-10 w-10 text-primary mx-auto mb-3" />
              <h3 className="text-lg font-semibold mb-1">{t('relations.auditor.welcomeTitle')}</h3>
              <p className="text-sm text-muted-foreground max-w-md">
                {t('relations.auditor.welcomeDescription')}
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 w-full max-w-lg">
              {EXAMPLE_QUESTIONS.map((qKey, i) => (
                <Button
                  key={i}
                  variant="outline"
                  size="sm"
                  className="text-left h-auto py-2 px-3 text-xs justify-start"
                  onClick={() => sendMessage(t(qKey))}
                >
                  <Search className="h-3 w-3 mr-2 shrink-0" />
                  <span className="line-clamp-2">{t(qKey)}</span>
                </Button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-lg px-4 py-3 ${
                  msg.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted'
                }`}
              >
                {msg.role === 'assistant' ? (
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={markdownComponents}
                    >
                      {msg.content}
                    </ReactMarkdown>
                  </div>
                ) : (
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                )}
              </div>
            </div>
          ))
        )}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-muted rounded-lg px-4 py-3 flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm text-muted-foreground">{t('relations.auditor.analyzing')}</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="flex gap-2 items-end border-t pt-3">
        <Textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={t('relations.auditor.inputPlaceholder')}
          className="min-h-[44px] max-h-[120px] resize-none"
          disabled={isLoading}
          rows={1}
        />
        <Button
          onClick={() => sendMessage()}
          disabled={!input.trim() || isLoading}
          size="icon"
          className="shrink-0"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default RelationsAuditorChat;
