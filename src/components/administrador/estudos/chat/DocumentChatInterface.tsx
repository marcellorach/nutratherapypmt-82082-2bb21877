import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  MessageCircle, 
  Send, 
  Sparkles, 
  Loader2, 
  Copy, 
  Download,
  RefreshCw
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { MarkdownMessage } from './MarkdownMessage';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface DocumentChatInterfaceProps {
  studyId: string;
  studyTitle: string;
}

const DocumentChatInterface: React.FC<DocumentChatInterfaceProps> = ({ 
  studyId, 
  studyTitle 
}) => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [suggestedQuestions, setSuggestedQuestions] = useState<string[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadChatHistory();
    loadInitialSuggestions();
  }, [studyId]);

  useEffect(() => {
    // Auto-scroll to bottom when messages change
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const loadChatHistory = async () => {
    try {
      console.log('📚 Carregando histórico do chat para studyId:', studyId);
      const { data, error } = await supabase
        .from('study_chat_history')
        .select('question, answer, created_at')
        .eq('study_id', studyId)
        .order('created_at', { ascending: true })
        .limit(20);

      if (error) {
        console.error('❌ Erro ao carregar histórico:', error);
        throw error;
      }
      
      console.log(`✅ Histórico carregado: ${data?.length || 0} entradas`);

      if (data && data.length > 0) {
        const history: ChatMessage[] = [];
        data.forEach(entry => {
          history.push(
            { role: 'user', content: entry.question, timestamp: new Date(entry.created_at) },
            { role: 'assistant', content: entry.answer, timestamp: new Date(entry.created_at) }
          );
        });
        setMessages(history);
      } else {
        // Welcome message
        setMessages([{
          role: 'assistant',
          content: `👋 Olá! Sou seu assistente especializado neste estudo.\n\n**${studyTitle}**\n\nEstou aqui para responder perguntas sobre nutracêuticos, condições de saúde, dosagens, mecanismos de ação e qualquer outro aspecto do estudo. Como posso ajudar?`,
          timestamp: new Date()
        }]);
      }
    } catch (error) {
      console.error('Error loading chat history:', error);
    }
  };

  const loadInitialSuggestions = async () => {
    setSuggestedQuestions([
      'Quais os principais nutracêuticos identificados?',
      'Quais condições de saúde são tratadas?',
      'Há contraindicações ou efeitos colaterais?',
      'Quais as dosagens recomendadas?'
    ]);
  };

  const handleSendMessage = async (messageText?: string) => {
    const question = messageText || input.trim();
    if (!question || isLoading) return;

    setInput('');
    setIsLoading(true);

    // Add user message immediately
    const userMessage: ChatMessage = {
      role: 'user',
      content: question,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);

    try {
      console.log('🚀 Enviando mensagem para document-chat...');
      console.log('📝 StudyId:', studyId);
      console.log('❓ Question:', question);
      
      const { data, error } = await supabase.functions.invoke('document-chat', {
        body: {
          studyId,
          question,
          conversationHistory: messages.slice(-6).map(m => ({
            role: m.role,
            content: m.content
          }))
        }
      });

      if (error) {
        console.error('❌ Erro na invocação da edge function:', error);
        throw error;
      }

      console.log('✅ Resposta recebida da edge function:', data);

      if (!data?.success) {
        console.error('❌ Resposta indica falha:', data);
        throw new Error(data?.error || 'Failed to get response');
      }

      // Add assistant response
      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: data.answer,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, assistantMessage]);

      // Update suggested questions
      if (data.suggestedQuestions?.length > 0) {
        setSuggestedQuestions(data.suggestedQuestions);
      }

      toast({
        title: t('chat.responseReceived', 'Resposta recebida'),
        variant: 'default'
      });

    } catch (error: any) {
      console.error('❌ Chat error completo:', error);
      console.error('❌ Error message:', error.message);
      console.error('❌ Error details:', error.details);
      
      let errorContent = '❌ Desculpe, ocorreu um erro ao processar sua pergunta.\n\n';
      
      if (error.message?.includes('Rate limit exceeded') || error.message?.includes('429')) {
        errorContent += '🔄 **Limite de requisições atingido**\n\nPor favor, aguarde alguns segundos e tente novamente.';
      } else if (error.message?.includes('Study not found') || error.message?.includes('404')) {
        errorContent += '📚 **Estudo não encontrado**\n\nO estudo pode não ter sido processado ainda. Por favor, aguarde o processamento completo ou tente reprocessar.';
      } else if (error.details?.studyId) {
        errorContent += `🔍 **Detalhes do erro:**\n- StudyId: ${error.details.studyId}\n- Erro: ${error.details.details || error.message}`;
      } else {
        errorContent += `⚠️ ${error.message || 'Erro desconhecido'}\n\nPor favor, tente novamente em alguns instantes.`;
      }
      
      const errorMessage: ChatMessage = {
        role: 'assistant',
        content: errorContent,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);

      toast({
        title: t('chat.error', 'Erro'),
        description: error.message || 'Falha ao processar pergunta',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyMessage = (content: string) => {
    navigator.clipboard.writeText(content);
    toast({
      title: t('chat.copied', 'Copiado'),
      description: t('chat.copiedDesc', 'Mensagem copiada para área de transferência'),
      variant: 'default'
    });
  };

  const handleExportChat = () => {
    const markdown = messages.map(m => {
      const time = m.timestamp.toLocaleTimeString('pt-BR', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
      const sender = m.role === 'user' ? '👤 Você' : '🤖 Assistente';
      return `### ${sender} (${time})\n\n${m.content}\n\n---\n`;
    }).join('\n');

    const fullContent = `# Chat: ${studyTitle}\n\n${markdown}`;
    
    const blob = new Blob([fullContent], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chat-${studyId.slice(0, 8)}.md`;
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: t('chat.exported', 'Exportado'),
      description: t('chat.exportedDesc', 'Chat exportado como Markdown'),
      variant: 'default'
    });
  };

  const handleClearChat = () => {
    setMessages([{
      role: 'assistant',
      content: `Chat reiniciado. Como posso ajudar com o estudo **${studyTitle}**?`,
      timestamp: new Date()
    }]);
    loadInitialSuggestions();
  };

  return (
    <Card className="h-[600px] flex flex-col">
      <CardHeader className="border-b pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">
              {t('chat.title', 'Chat com Documento')}
            </CardTitle>
          </div>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearChat}
              title={t('chat.clear', 'Limpar chat')}
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleExportChat}
              title={t('chat.export', 'Exportar chat')}
            >
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          {studyTitle}
        </p>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
        {/* Messages area */}
        <ScrollArea className="flex-1 p-4" ref={scrollRef}>
          <div className="space-y-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[80%] ${
                  message.role === 'user' 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-muted'
                  } rounded-lg p-3 shadow-sm`}
                >
                  <div className="flex items-start gap-2">
                    <div className="flex-1">
                      {message.role === 'assistant' ? (
                        <MarkdownMessage content={message.content} />
                      ) : (
                        <div className="text-sm whitespace-pre-wrap break-words">
                          {message.content}
                        </div>
                      )}
                      <div className="text-xs opacity-70 mt-2">
                        {message.timestamp.toLocaleTimeString('pt-BR', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </div>
                    </div>
                    {message.role === 'assistant' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => handleCopyMessage(message.content)}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-muted rounded-lg p-3 shadow-sm">
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm text-muted-foreground">
                      {t('chat.thinking', 'Analisando documento...')}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Suggested questions */}
        {suggestedQuestions.length > 0 && !isLoading && (
          <div className="px-4 py-2 border-t bg-muted/30">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-xs font-medium text-muted-foreground">
                {t('chat.suggestions', 'Perguntas sugeridas:')}
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {suggestedQuestions.map((suggestion, index) => (
                <Badge
                  key={index}
                  variant="secondary"
                  className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                  onClick={() => handleSendMessage(suggestion)}
                >
                  {suggestion}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Input area */}
        <div className="p-4 border-t">
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex gap-2"
          >
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={t('chat.inputPlaceholder', 'Digite sua pergunta...')}
              disabled={isLoading}
              className="flex-1"
            />
            <Button 
              type="submit" 
              disabled={!input.trim() || isLoading}
              size="icon"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </form>
        </div>
      </CardContent>
    </Card>
  );
};

export default DocumentChatInterface;
