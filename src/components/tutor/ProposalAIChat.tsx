import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Loader2, Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import ReactMarkdown from 'react-markdown';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface ProposalAIChatProps {
  petName: string;
  petBreed: string;
  petAge: number;
  conditions: any[];
  compounds: any[];
  scientificSummary: any;
  rationale: string | null;
}

const ProposalAIChat: React.FC<ProposalAIChatProps> = ({
  petName, petBreed, petAge, conditions, compounds, scientificSummary, rationale,
}) => {
  const { t, i18n } = useTranslation();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const suggestions = t('tutor.proposal.aiChatSuggestions', { returnObjects: true }) as string[];

  const buildSystemPrompt = () => {
    const lang = i18n.language === 'pt' ? 'Portuguese' : 'English';
    const condList = conditions.map((c: any) => c.name || c).join(', ');
    const compList = compounds.map((c: any) => `${c.name} (${c.dosage})`).join(', ');
    const pathways = scientificSummary?.biological_pathways || [];
    const pathwayDesc = pathways.map((p: any) =>
      `${p.condition}: ${(p.steps || []).map((s: any) => s.label).join(' → ')}`
    ).join('; ');

    return `You are a friendly veterinary nutraceutical assistant helping a pet owner understand their pet's geroprotective treatment proposal. Respond in ${lang}.

PATIENT: ${petName}, ${petBreed}, ${petAge} years old.
CONDITIONS: ${condList}
COMPOUNDS: ${compList}
BIOLOGICAL PATHWAYS: ${pathwayDesc || 'Not available'}
RATIONALE: ${rationale || 'N/A'}
SCIENTIFIC EVIDENCE: ${scientificSummary?.tripletCount || 0} knowledge graph connections, ${scientificSummary?.studyCount || 0} studies.

GUIDELINES:
- Explain in simple, reassuring language suitable for a pet owner (not a vet)
- Be scientifically accurate but avoid excessive jargon
- Reference specific compounds and their mechanisms when relevant
- Be empathetic and supportive
- If asked about side effects, be honest but reassuring
- Always recommend consulting their veterinarian for specific medical concerns`;
  };

  const handleSend = async (text?: string) => {
    const msg = (text || input).trim();
    if (!msg || loading) return;

    const userMessage: ChatMessage = { role: 'user', content: msg };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const allMessages = [
        { role: 'system', content: buildSystemPrompt() },
        ...messages.map(m => ({ role: m.role, content: m.content })),
        { role: 'user', content: msg },
      ];

      const { data, error } = await supabase.functions.invoke('chat', {
        body: { messages: allMessages, stream: false },
      });

      if (error) throw error;
      const content = data?.response || data?.choices?.[0]?.message?.content || '';
      setMessages(prev => [...prev, { role: 'assistant', content }]);
    } catch (err) {
      console.error('AI Chat error:', err);
      setMessages(prev => [...prev, { role: 'assistant', content: '⚠️ Erro ao processar. Tente novamente.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">{t('tutor.proposal.aiChatDesc')}</p>

      {messages.length === 0 && (
        <div className="flex flex-wrap gap-2">
          {Array.isArray(suggestions) && suggestions.map((s, i) => (
            <Button
              key={i}
              variant="outline"
              size="sm"
              className="text-xs"
              onClick={() => handleSend(s)}
            >
              <Sparkles className="h-3 w-3 mr-1" />
              {s}
            </Button>
          ))}
        </div>
      )}

      {messages.length > 0 && (
        <ScrollArea className="h-[300px] border rounded-lg p-3" ref={scrollRef}>
          <div className="space-y-3">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                    msg.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-foreground'
                  }`}
                >
                  {msg.role === 'assistant' ? (
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                  ) : (
                    msg.content
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-muted rounded-lg px-3 py-2">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      )}

      <div className="flex gap-2">
        <Input
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder={t('tutor.proposal.aiChatPlaceholder')}
          onKeyDown={e => e.key === 'Enter' && handleSend()}
          disabled={loading}
        />
        <Button onClick={() => handleSend()} disabled={!input.trim() || loading} size="icon">
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default ProposalAIChat;
