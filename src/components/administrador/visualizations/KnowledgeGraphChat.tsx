import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  MessageCircle,
  Send,
  Loader2,
  Sparkles,
  Database,
  HelpCircle,
  RefreshCcw,
  Copy,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
} from 'lucide-react';
import { toast } from 'sonner';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  queryUsed?: string;
  entities?: Array<{ name: string; type: string }>;
  relations?: Array<{ source: string; type: string; target: string }>;
  isError?: boolean;
}

interface KnowledgeGraphChatProps {
  variant?: 'sheet' | 'inline';
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onHighlightEntity?: (entityName: string) => void;
  onFilterByEntity?: (entityName: string, entityType: string) => void;
}

const EXAMPLE_QUERIES = [
  { label: 'Quais nutracêuticos tratam artrite?', icon: '💊' },
  { label: 'Mostre contraindicações para Curcuma', icon: '⚠️' },
  { label: 'Qual a relação entre Omega-3 e inflamação?', icon: '🔗' },
  { label: 'Quantos estudos mencionam Resveratrol?', icon: '📚' },
  { label: 'Quais condições têm mais tratamentos?', icon: '📊' },
];

export const KnowledgeGraphChat: React.FC<KnowledgeGraphChatProps> = ({
  variant = 'sheet',
  open,
  onOpenChange,
  onHighlightEntity,
  onFilterByEntity,
}) => {
  const { t } = useTranslation();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  useEffect(() => {
    // Scroll to bottom when new messages arrive
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  // Build conversation history for context-aware responses
  const buildConversationHistory = (): Array<{ role: 'user' | 'assistant'; content: string }> => {
    return messages.map(msg => ({
      role: msg.role,
      content: msg.content
    }));
  };

  const generateCypherFromQuestion = async (question: string, conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>): Promise<string> => {
    // Build context from previous messages for follow-up understanding
    const contextMessages = conversationHistory.length > 0 
      ? `\n\nPrevious conversation for context:\n${conversationHistory.map(m => `${m.role}: ${m.content}`).join('\n')}\n\nNow the user asks:`
      : '';

    const response = await supabase.functions.invoke('chat', {
      body: {
        messages: [
          {
            role: 'system',
            content: `You are a Cypher query generator for a veterinary knowledge graph. The graph has nodes with labels: Nutraceutical, Condition, Mechanism, Effect, Study.
Relationships include: TREATS, PREVENTS, SUPPORTS, CAUSES, WORSENS, CONTRAINDICATED_FOR, HAS_MECHANISM, PRODUCES_EFFECT, CITED_IN.
Node properties: name, description, confidence, source, study_id.
Relationship properties: confidence, direction (positive/negative), study_title.

IMPORTANT: The user may ask follow-up questions referring to previous answers. Use the conversation context to understand what "it", "those", "the same", etc. refer to.

Generate ONLY a valid Cypher query based on the user question. Return ONLY the query, nothing else.
Limit results to 20 to avoid overwhelming responses.
Always include relevant properties in the RETURN clause.`
          },
          { role: 'user', content: contextMessages + question }
        ]
      }
    });

    if (response.error) throw new Error('Failed to generate query');
    
    // Parse the streamed response
    const text = await response.data.text();
    const lines = text.split('\n').filter((l: string) => l.startsWith('data: '));
    let fullContent = '';
    
    for (const line of lines) {
      const data = line.replace('data: ', '');
      if (data === '[DONE]') break;
      try {
        const parsed = JSON.parse(data);
        const content = parsed.choices?.[0]?.delta?.content;
        if (content) fullContent += content;
      } catch {
        // Skip invalid JSON
      }
    }

    // Clean the query - remove markdown code blocks if present
    let query = fullContent.trim();
    if (query.startsWith('```')) {
      query = query.replace(/^```\w*\n?/, '').replace(/```$/, '').trim();
    }

    return query;
  };

  const executeGraphQuery = async (cypherQuery: string) => {
    const { data, error } = await supabase.functions.invoke('graph-rag-search', {
      body: {
        queryType: 'cypher',
        cypherQuery
      }
    });

    if (error) throw error;
    return data;
  };

  const generateNaturalResponse = async (
    question: string, 
    queryResult: any, 
    conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>
  ): Promise<string> => {
    const resultSummary = JSON.stringify(queryResult?.data || {}, null, 2);
    
    // Include conversation history for contextual responses
    const historyMessages = conversationHistory.map(m => ({
      role: m.role as 'user' | 'assistant',
      content: m.content
    }));
    
    const response = await supabase.functions.invoke('chat', {
      body: {
        messages: [
          {
            role: 'system',
            content: `You are a helpful veterinary knowledge assistant. Based on the query results from a knowledge graph, provide a clear, concise answer in Portuguese (Brazilian).

IMPORTANT: You are in an ongoing conversation. The user may ask follow-up questions about previous answers. Use the conversation history to:
- Understand what "it", "those", "the same", "more about", etc. refer to
- Build upon previous answers when relevant
- Provide continuity in the conversation

Format your response with:
- Direct answer to the question first
- Relevant details and relationships found
- Confidence levels when available
- Keep it conversational but informative
Do not mention technical details like "Cypher" or "graph database".`
          },
          ...historyMessages,
          { 
            role: 'user', 
            content: `Question: ${question}\n\nGraph Query Results:\n${resultSummary}` 
          }
        ]
      }
    });

    if (response.error) throw new Error('Failed to generate response');
    
    // Parse streamed response
    const text = await response.data.text();
    const lines = text.split('\n').filter((l: string) => l.startsWith('data: '));
    let fullContent = '';
    
    for (const line of lines) {
      const data = line.replace('data: ', '');
      if (data === '[DONE]') break;
      try {
        const parsed = JSON.parse(data);
        const content = parsed.choices?.[0]?.delta?.content;
        if (content) fullContent += content;
      } catch {
        // Skip invalid JSON
      }
    }

    return fullContent.trim();
  };

  const handleSendMessage = async (messageText?: string) => {
    const text = messageText || inputValue.trim();
    if (!text || isLoading) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: text,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      // Get conversation history for context
      const conversationHistory = buildConversationHistory();
      
      // Step 1: Generate Cypher query with context
      const cypherQuery = await generateCypherFromQuestion(text, conversationHistory);
      
      // Step 2: Execute the query
      const queryResult = await executeGraphQuery(cypherQuery);
      
      // Step 3: Generate natural language response with context
      const naturalResponse = await generateNaturalResponse(text, queryResult, conversationHistory);
      
      // Extract entities and relations from result for visualization
      const entities: Array<{ name: string; type: string }> = [];
      const relations: Array<{ source: string; type: string; target: string }> = [];
      
      if (queryResult?.data?.nodes) {
        queryResult.data.nodes.forEach((node: any) => {
          entities.push({
            name: node.properties?.name || node.id,
            type: node.type || 'Unknown',
          });
        });
      }
      
      if (queryResult?.data?.relationships) {
        queryResult.data.relationships.forEach((rel: any) => {
          relations.push({
            source: rel.sourceNode?.name || 'Unknown',
            type: rel.type,
            target: rel.targetNode?.name || 'Unknown',
          });
        });
      }

      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: naturalResponse || 'Não encontrei informações relevantes para essa pergunta.',
        timestamp: new Date(),
        queryUsed: cypherQuery,
        entities: entities.slice(0, 10),
        relations: relations.slice(0, 5),
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      
      const errorMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: 'Desculpe, tive um problema ao processar sua pergunta. Tente reformular ou verificar se o grafo tem dados suficientes.',
        timestamp: new Date(),
        isError: true,
      };

      setMessages(prev => [...prev, errorMessage]);
      toast.error('Erro ao processar pergunta');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyQuery = (query: string, messageId: string) => {
    navigator.clipboard.writeText(query);
    setCopiedId(messageId);
    setTimeout(() => setCopiedId(null), 2000);
    toast.success('Query copiada!');
  };

  const handleClearChat = () => {
    setMessages([]);
  };

  // Inline variant - renders as a Card
  if (variant === 'inline') {
    return (
      <Card className="w-full">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">{t('knowledgeGraph.chat.title', 'Chat com o Grafo')}</CardTitle>
            </div>
            {messages.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="text-xs"
                onClick={handleClearChat}
              >
                <RefreshCcw className="h-3 w-3 mr-1" />
                {t('knowledgeGraph.chat.clear', 'Limpar')}
              </Button>
            )}
          </div>
          <CardDescription>
            {t('knowledgeGraph.chat.description', 'Faça perguntas em linguagem natural sobre o conhecimento do grafo')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Example queries */}
          {messages.length === 0 && (
            <div className="flex flex-wrap gap-2">
              {EXAMPLE_QUERIES.slice(0, 4).map((example, idx) => (
                <Button
                  key={idx}
                  variant="outline"
                  size="sm"
                  className="text-xs h-7"
                  onClick={() => handleSendMessage(example.label)}
                >
                  <span className="mr-1">{example.icon}</span>
                  {example.label}
                </Button>
              ))}
            </div>
          )}

          {/* Messages Area - fixed height scroll */}
          {messages.length > 0 && (
            <ScrollArea className="h-[250px] rounded-md border p-3" ref={scrollAreaRef}>
              <div className="space-y-3">
                {messages.map(message => (
                  <div
                    key={message.id}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-lg p-3 ${
                        message.role === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : message.isError
                          ? 'bg-destructive/10 border border-destructive/20'
                          : 'bg-muted'
                      }`}
                    >
                      {message.role === 'assistant' && !message.isError && (
                        <div className="flex items-center gap-1 mb-2">
                          <Sparkles className="h-3 w-3 text-primary" />
                          <span className="text-[10px] text-muted-foreground">AI</span>
                        </div>
                      )}
                      
                      {message.isError && (
                        <div className="flex items-center gap-1 mb-2">
                          <AlertTriangle className="h-3 w-3 text-destructive" />
                          <span className="text-[10px] text-destructive">Erro</span>
                        </div>
                      )}
                      
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      
                      {/* Entities found */}
                      {message.entities && message.entities.length > 0 && (
                        <div className="mt-2 pt-2 border-t border-border/50">
                          <div className="flex flex-wrap gap-1">
                            {message.entities.slice(0, 5).map((entity, idx) => (
                              <Badge
                                key={idx}
                                variant="secondary"
                                className="text-[10px] cursor-pointer hover:bg-primary/20"
                                onClick={() => {
                                  onHighlightEntity?.(entity.name);
                                  onFilterByEntity?.(entity.name, entity.type);
                                }}
                              >
                                {entity.name}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {/* Query used (expandable) */}
                      {message.queryUsed && (
                        <details className="mt-2">
                          <summary className="text-[10px] text-muted-foreground cursor-pointer hover:text-foreground">
                            Ver query
                          </summary>
                          <div className="mt-1 p-2 bg-background/50 rounded text-[10px] font-mono relative">
                            <pre className="whitespace-pre-wrap break-all">{message.queryUsed}</pre>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="absolute top-1 right-1 h-5 w-5"
                              onClick={() => handleCopyQuery(message.queryUsed!, message.id)}
                            >
                              {copiedId === message.id ? (
                                <CheckCircle2 className="h-3 w-3 text-green-500" />
                              ) : (
                                <Copy className="h-3 w-3" />
                              )}
                            </Button>
                          </div>
                        </details>
                      )}
                    </div>
                  </div>
                ))}
                
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-muted rounded-lg p-3">
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin text-primary" />
                        <span className="text-sm text-muted-foreground">
                          {t('knowledgeGraph.chat.thinking', 'Buscando...')}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
          )}

          {/* Input Area */}
          <div className="flex gap-2">
            <Input
              ref={inputRef}
              placeholder={t('knowledgeGraph.chat.placeholder', 'Pergunte sobre nutracêuticos, condições...')}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
              disabled={isLoading}
            />
            <Button
              onClick={() => handleSendMessage()}
              disabled={!inputValue.trim() || isLoading}
              size="icon"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Sheet variant - original behavior
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[450px] sm:w-[500px] flex flex-col p-0">
        <SheetHeader className="px-6 pt-6 pb-4 border-b flex-shrink-0">
          <SheetTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-primary" />
            {t('knowledgeGraph.chat.title', 'Chat com o Grafo')}
          </SheetTitle>
          <SheetDescription>
            {t('knowledgeGraph.chat.description', 'Faça perguntas em linguagem natural sobre o conhecimento do grafo')}
          </SheetDescription>
        </SheetHeader>

        {/* Messages Area */}
        <ScrollArea className="flex-1 px-6" ref={scrollAreaRef}>
          <div className="py-4 space-y-4">
            {messages.length === 0 ? (
              <div className="space-y-4">
                <div className="text-center py-8">
                  <Database className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                  <p className="text-sm text-muted-foreground mb-2">
                    {t('knowledgeGraph.chat.welcome', 'Pergunte qualquer coisa sobre o grafo de conhecimento')}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {t('knowledgeGraph.chat.hint', 'Usarei IA para interpretar sua pergunta e buscar no grafo')}
                  </p>
                </div>
                
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                    <HelpCircle className="h-3 w-3" />
                    {t('knowledgeGraph.chat.examples', 'Exemplos de perguntas:')}
                  </p>
                  {EXAMPLE_QUERIES.map((example, idx) => (
                    <Button
                      key={idx}
                      variant="outline"
                      size="sm"
                      className="w-full justify-start text-left h-auto py-2 px-3"
                      onClick={() => handleSendMessage(example.label)}
                    >
                      <span className="mr-2">{example.icon}</span>
                      <span className="text-xs">{example.label}</span>
                    </Button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map(message => (
                <div
                  key={message.id}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-lg p-3 ${
                      message.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : message.isError
                        ? 'bg-destructive/10 border border-destructive/20'
                        : 'bg-muted'
                    }`}
                  >
                    {message.role === 'assistant' && !message.isError && (
                      <div className="flex items-center gap-1 mb-2">
                        <Sparkles className="h-3 w-3 text-primary" />
                        <span className="text-[10px] text-muted-foreground">AI Response</span>
                      </div>
                    )}
                    
                    {message.isError && (
                      <div className="flex items-center gap-1 mb-2">
                        <AlertTriangle className="h-3 w-3 text-destructive" />
                        <span className="text-[10px] text-destructive">Error</span>
                      </div>
                    )}
                    
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    
                    {/* Entities found */}
                    {message.entities && message.entities.length > 0 && (
                      <div className="mt-3 pt-2 border-t border-border/50">
                        <p className="text-[10px] text-muted-foreground mb-1">Entidades encontradas:</p>
                        <div className="flex flex-wrap gap-1">
                          {message.entities.map((entity, idx) => (
                            <Badge
                              key={idx}
                              variant="secondary"
                              className="text-[10px] cursor-pointer hover:bg-primary/20"
                              onClick={() => {
                                onHighlightEntity?.(entity.name);
                                onFilterByEntity?.(entity.name, entity.type);
                              }}
                            >
                              {entity.name}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Relations found */}
                    {message.relations && message.relations.length > 0 && (
                      <div className="mt-2">
                        <p className="text-[10px] text-muted-foreground mb-1">Relações:</p>
                        <div className="space-y-1">
                          {message.relations.map((rel, idx) => (
                            <div key={idx} className="flex items-center gap-1 text-[10px]">
                              <span className="text-blue-600 dark:text-blue-400">{rel.source}</span>
                              <ArrowRight className="h-2 w-2 text-muted-foreground" />
                              <Badge variant="outline" className="text-[8px] py-0 h-4">
                                {rel.type}
                              </Badge>
                              <ArrowRight className="h-2 w-2 text-muted-foreground" />
                              <span className="text-emerald-600 dark:text-emerald-400">{rel.target}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Query used (expandable) */}
                    {message.queryUsed && (
                      <details className="mt-2">
                        <summary className="text-[10px] text-muted-foreground cursor-pointer hover:text-foreground">
                          Ver query Cypher
                        </summary>
                        <div className="mt-1 p-2 bg-background/50 rounded text-[10px] font-mono relative">
                          <pre className="whitespace-pre-wrap break-all">{message.queryUsed}</pre>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="absolute top-1 right-1 h-5 w-5"
                            onClick={() => handleCopyQuery(message.queryUsed!, message.id)}
                          >
                            {copiedId === message.id ? (
                              <CheckCircle2 className="h-3 w-3 text-green-500" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </Button>
                        </div>
                      </details>
                    )}
                    
                    <p className="text-[10px] text-muted-foreground mt-2">
                      {message.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))
            )}
            
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-muted rounded-lg p-3">
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    <span className="text-sm text-muted-foreground">
                      {t('knowledgeGraph.chat.thinking', 'Buscando no grafo...')}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Input Area */}
        <div className="border-t p-4 flex-shrink-0">
          {messages.length > 0 && (
            <div className="flex justify-end mb-2">
              <Button
                variant="ghost"
                size="sm"
                className="text-xs"
                onClick={handleClearChat}
              >
                <RefreshCcw className="h-3 w-3 mr-1" />
                {t('knowledgeGraph.chat.clear', 'Limpar chat')}
              </Button>
            </div>
          )}
          <div className="flex gap-2">
            <Input
              ref={inputRef}
              placeholder={t('knowledgeGraph.chat.placeholder', 'Pergunte sobre nutracêuticos, condições...')}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
              disabled={isLoading}
            />
            <Button
              onClick={() => handleSendMessage()}
              disabled={!inputValue.trim() || isLoading}
              size="icon"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
