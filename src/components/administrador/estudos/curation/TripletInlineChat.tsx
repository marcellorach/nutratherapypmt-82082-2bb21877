import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { MessageCircle, Send, Loader2, ChevronDown, ChevronRight } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { cn } from '@/lib/utils';

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface TripletInlineChatProps {
  studyId: string;
  studyTitle?: string;
  initialQuestion: string;
  subject?: string;
  predicate?: string;
  object?: string;
}

const TripletInlineChat: React.FC<TripletInlineChatProps> = ({
  studyId,
  studyTitle,
  initialQuestion,
  subject,
  predicate,
  object
}) => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasAskedInitial, setHasAskedInitial] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && !hasAskedInitial && messages.length === 0) {
      setHasAskedInitial(true);
      sendMessage(initialQuestion);
    }
  }, [isOpen]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const buildSystemMessage = (): Message => ({
    role: 'system',
    content: `You are a veterinary science expert analyzing a scientific relationship extracted from the study "${studyTitle || 'Unknown'}".
Triplet: ${subject || 'Unknown'} → ${predicate || 'Unknown'} → ${object || 'Unknown'}.
Answer questions about this relationship concisely and scientifically. Use markdown formatting. Respond in the same language as the user's question.`
  });

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMsg: Message = { role: 'user', content: text };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput('');
    setIsLoading(true);

    try {
      const systemMsg = buildSystemMessage();
      const chatMessages = [
        systemMsg,
        ...updatedMessages.map(m => ({ role: m.role, content: m.content }))
      ];

      const { data, error } = await supabase.functions.invoke('chat', {
        body: {
          messages: chatMessages,
          stream: false
        }
      });

      if (error) throw error;

      const answer = data?.response || t('tripletCuration.inlineChat.noResponse', 'Sem resposta da IA.');
      setMessages(prev => [...prev, { role: 'assistant', content: answer }]);
    } catch (err) {
      console.error('Inline chat error:', err);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: t('tripletCuration.inlineChat.error', 'Erro ao consultar a IA. Tente novamente.') 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <Button variant="ghost" size="sm" className="h-6 text-[10px] gap-1">
          {isOpen ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
          <MessageCircle className="h-3 w-3" />
          {t('tripletCuration.inlineChat.title', 'Chat sobre este triplet')}
        </Button>
      </CollapsibleTrigger>
      
      <CollapsibleContent>
        <div className="mt-2 border rounded-lg bg-background overflow-hidden">
          <ScrollArea className="h-52">
            <div className="p-3 space-y-3">
              {messages.filter(m => m.role !== 'system').map((msg, idx) => (
                <div key={idx} className={cn(
                  "text-[11px] leading-relaxed",
                  msg.role === 'user' 
                    ? "bg-primary/10 p-2 rounded-lg" 
                    : "bg-muted/50 p-2 rounded-lg"
                )}>
                  <span className="font-semibold text-[9px] uppercase tracking-wider text-muted-foreground block mb-1">
                    {msg.role === 'user' ? '👤 You' : '🤖 AI'}
                  </span>
                  {msg.role === 'assistant' ? (
                    <div className="prose prose-xs max-w-none [&>*]:text-[11px] [&>*]:leading-relaxed [&_p]:mb-1">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                  ) : (
                    <p>{msg.content}</p>
                  )}
                </div>
              ))}
              {isLoading && (
                <div className="flex items-center gap-2 text-[10px] text-muted-foreground p-2">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  {t('tripletCuration.inlineChat.thinking', 'Analisando...')}
                </div>
              )}
              <div ref={bottomRef} />
            </div>
          </ScrollArea>
          
          <div className="border-t p-2 flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t('tripletCuration.inlineChat.placeholder', 'Faça uma pergunta sobre este triplet...')}
              className="h-7 text-[11px]"
              disabled={isLoading}
            />
            <Button
              size="sm"
              className="h-7 px-2"
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || isLoading}
            >
              <Send className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};

export default TripletInlineChat;
