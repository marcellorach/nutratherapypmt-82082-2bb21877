import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageSquare, Send, Loader2, FlaskConical } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import ReactMarkdown from 'react-markdown';
import { CompoundDosage } from '@/components/pet/CompoundDosageSlider';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface CompoundSpecificChatProps {
  compounds: CompoundDosage[];
  petName: string;
  petBreed: string;
  petAge: number;
}

const CompoundSpecificChat: React.FC<CompoundSpecificChatProps> = ({
  compounds,
  petName,
  petBreed,
  petAge,
}) => {
  const { t } = useTranslation();
  const [selectedCompound, setSelectedCompound] = useState<CompoundDosage | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSelectCompound = (compound: CompoundDosage) => {
    setSelectedCompound(compound);
    setMessages([]);
    setInput('');
  };

  const handleSend = async () => {
    if (!input.trim() || !selectedCompound || loading) return;

    const userMessage: ChatMessage = { role: 'user', content: input.trim() };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const systemPrompt = `You are a veterinary nutraceutical specialist focused on ${selectedCompound.name} for treating ${selectedCompound.condition} in dogs. 
Patient context: ${petName}, ${petBreed}, ${petAge} years old. 
Current dosage: ${selectedCompound.dosageCurrent} ${selectedCompound.unit}.
Evidence level: ${selectedCompound.evidenceLevel}.
Rationale: ${selectedCompound.rationale || 'N/A'}.
Always respond based on scientific evidence. Be concise and clinically relevant. Respond in the same language the user writes in.`;

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

  const activeCompounds = compounds.filter(c => !c.removed);

  if (!selectedCompound) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">
          {t('petProfile.compoundChat.selectPrompt')}
        </p>
        <div className="grid gap-2">
          {activeCompounds.map(compound => (
            <Button
              key={compound.id}
              variant="outline"
              className="justify-start gap-3 h-auto py-3"
              onClick={() => handleSelectCompound(compound)}
            >
              <FlaskConical className="h-4 w-4 text-primary shrink-0" />
              <div className="text-left">
                <p className="font-medium text-sm">{compound.name}</p>
                <p className="text-xs text-muted-foreground">
                  {compound.condition} · {compound.dosageCurrent} {compound.unit}
                </p>
              </div>
              <Badge variant="outline" className="ml-auto text-[10px]">
                {compound.evidenceLevel}
              </Badge>
            </Button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Selected compound header */}
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setSelectedCompound(null)}
          className="text-xs"
        >
          ← {t('petProfile.compoundChat.backToList')}
        </Button>
        <Badge variant="secondary" className="gap-1">
          <FlaskConical className="h-3 w-3" />
          {selectedCompound.name}
        </Badge>
        <span className="text-xs text-muted-foreground">
          → {selectedCompound.condition}
        </span>
      </div>

      {/* Messages */}
      <ScrollArea className="h-[350px] pr-2" ref={scrollRef as any}>
        <div className="space-y-3">
          {messages.length === 0 && (
            <div className="text-center py-8">
              <MessageSquare className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">
                {t('petProfile.compoundChat.placeholder', { compound: selectedCompound.name, condition: selectedCompound.condition })}
              </p>
              <div className="mt-3 space-y-1">
                {[
                  t('petProfile.compoundChat.suggestion1', { compound: selectedCompound.name }),
                  t('petProfile.compoundChat.suggestion2', { compound: selectedCompound.name }),
                  t('petProfile.compoundChat.suggestion3', { compound: selectedCompound.name, condition: selectedCompound.condition }),
                ].map((suggestion, idx) => (
                  <button
                    key={idx}
                    className="block w-full text-left text-xs text-primary hover:underline px-2 py-1 rounded hover:bg-muted/50"
                    onClick={() => {
                      setInput(suggestion);
                    }}
                  >
                    💬 {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                  msg.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted'
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
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="flex gap-2">
        <Input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
          placeholder={t('petProfile.compoundChat.inputPlaceholder', { compound: selectedCompound.name })}
          disabled={loading}
          className="text-sm"
        />
        <Button size="icon" onClick={handleSend} disabled={loading || !input.trim()}>
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default CompoundSpecificChat;
