import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageSquare, Send, Loader2, Check, X, Stethoscope, Pill, TestTube, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAddPetCondition, useAddPetMedication, useAddPetExam, useAddClinicalNote } from '@/hooks/usePetProfile';
import { useToast } from '@/hooks/use-toast';
import ReactMarkdown from 'react-markdown';

interface ExtractedEntity {
  type: 'condition' | 'medication' | 'symptom' | 'exam' | 'biomarker';
  name: string;
  details?: Record<string, any>;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  entities?: ExtractedEntity[];
  confirmed?: boolean;
  isQA?: boolean;
}

interface PetClinicalChatProps {
  petId: string;
  petBreed?: string;
  petAge?: number;
}

const entityIcons: Record<string, React.ReactNode> = {
  condition: <Stethoscope className="h-3 w-3" />,
  medication: <Pill className="h-3 w-3" />,
  symptom: <AlertCircle className="h-3 w-3" />,
  exam: <TestTube className="h-3 w-3" />,
  biomarker: <TestTube className="h-3 w-3" />,
};

const entityColors: Record<string, string> = {
  condition: 'bg-red-100 text-red-800 border-red-200',
  medication: 'bg-blue-100 text-blue-800 border-blue-200',
  symptom: 'bg-amber-100 text-amber-800 border-amber-200',
  exam: 'bg-green-100 text-green-800 border-green-200',
  biomarker: 'bg-purple-100 text-purple-800 border-purple-200',
};

// Detect if the input is a question vs clinical description
const isQuestion = (text: string): boolean => {
  const questionPatterns = [
    /^(qual|quais|como|por que|porque|quando|onde|o que|quanto|quantos|quantas)\b/i,
    /^(what|which|how|why|when|where|who|can|could|should|is|are|do|does|tell|explain|describe)\b/i,
    /\?$/,
    /^(me |nos )?(diga|fale|explique|conte|mostre|liste|resuma)/i,
    /^(suggest|recommend|analyze|compare|summarize|list)/i,
  ];
  return questionPatterns.some(p => p.test(text.trim()));
};

const PetClinicalChat: React.FC<PetClinicalChatProps> = ({ petId, petBreed, petAge }) => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const addCondition = useAddPetCondition();
  const addMedication = useAddPetMedication();
  const addExam = useAddPetExam();
  const addNote = useAddClinicalNote();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Fetch pet context for Q&A mode
  const fetchPetContext = async () => {
    const [conditionsRes, medsRes, examsRes] = await Promise.all([
      supabase.from('pet_conditions').select('*').eq('pet_id', petId),
      supabase.from('pet_medications').select('*').eq('pet_id', petId),
      supabase.from('pet_exams').select('*').eq('pet_id', petId).order('exam_date', { ascending: false }).limit(10),
    ]);
    return {
      conditions: conditionsRes.data || [],
      medications: medsRes.data || [],
      exams: examsRes.data || [],
    };
  };

  const handleSend = async () => {
    if (!input.trim() || isProcessing) return;

    const userText = input.trim();
    const userMessage: ChatMessage = { role: 'user', content: userText };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsProcessing(true);

    try {
      if (isQuestion(userText)) {
        // Q&A mode: use the chat edge function with patient context
        const petContext = await fetchPetContext();
        
        const systemPrompt = `You are a veterinary clinical intelligence assistant with access to a patient's complete medical record.

Patient Profile:
- Species: Canine
- Breed: ${petBreed || 'Unknown'}
- Age: ${petAge || 'Unknown'} years
- Active Conditions: ${petContext.conditions.filter(c => c.status === 'active').map(c => `${c.condition_name} (${c.severity || 'unspecified severity'})`).join(', ') || 'None recorded'}
- Medications: ${petContext.medications.map(m => `${m.medication_name}${m.dosage ? ` (${m.dosage})` : ''}`).join(', ') || 'None recorded'}
- Recent Exams: ${petContext.exams.map(e => `${e.exam_type}${e.exam_date ? ` (${e.exam_date})` : ''}`).join(', ') || 'None recorded'}

Answer the veterinarian's question based on this patient's data. Be clinically precise and reference the patient's specific conditions when relevant. If the question requires information not available in the record, say so clearly. Respond in the same language the user writes in.`;

        const allMessages = [
          { role: 'system', content: systemPrompt },
          ...messages.filter(m => m.role === 'user' || m.isQA).map(m => ({ role: m.role, content: m.content })),
          { role: 'user', content: userText },
        ];

        const { data, error } = await supabase.functions.invoke('chat', {
          body: { messages: allMessages, stream: false },
        });

        if (error) throw error;

        setMessages(prev => [...prev, {
          role: 'assistant',
          content: data?.response || t('petRegistration.chat.noResponse', 'No response received.'),
          isQA: true,
        }]);
      } else {
        // Entity extraction mode: use extract-pet-clinical-data
        const { data, error } = await supabase.functions.invoke('extract-pet-clinical-data', {
          body: {
            petId,
            clinicalText: userText,
            existingProfile: { breed: petBreed, age: petAge },
          },
        });

        if (error) throw error;

        const entities: ExtractedEntity[] = [];
        if (data.conditions) data.conditions.forEach((c: any) => entities.push({ type: 'condition', name: c.name, details: c }));
        if (data.medications) data.medications.forEach((m: any) => entities.push({ type: 'medication', name: m.name, details: m }));
        if (data.symptoms) data.symptoms.forEach((s: any) => entities.push({ type: 'symptom', name: s.name, details: s }));
        if (data.examResults) data.examResults.forEach((e: any) => entities.push({ type: 'exam', name: e.type || e.name, details: e }));
        if (data.biomarkers) data.biomarkers.forEach((b: any) => entities.push({ type: 'biomarker', name: b.name, details: b }));

        setMessages(prev => [...prev, {
          role: 'assistant',
          content: entities.length > 0
            ? t('petRegistration.chat.entitiesFound', { count: entities.length })
            : t('petRegistration.chat.noEntitiesFound'),
          entities,
          confirmed: false,
        }]);
      }
    } catch (error: any) {
      console.error('Error in clinical chat:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: t('petRegistration.chat.extractionError'),
      }]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmEntities = async (messageIndex: number) => {
    const message = messages[messageIndex];
    if (!message.entities || message.confirmed) return;

    try {
      for (const entity of message.entities) {
        switch (entity.type) {
          case 'condition':
            await addCondition.mutateAsync({
              pet_id: petId,
              condition_name: entity.name,
              severity: entity.details?.severity || undefined,
              status: 'active',
            });
            break;
          case 'medication':
            await addMedication.mutateAsync({
              pet_id: petId,
              medication_name: entity.name,
              dosage: entity.details?.dosage || undefined,
            });
            break;
          case 'exam':
            await addExam.mutateAsync({
              pet_id: petId,
              exam_type: entity.name,
              results: entity.details || {},
            });
            break;
          case 'symptom':
          case 'biomarker':
            await addNote.mutateAsync({
              pet_id: petId,
              content: `${entity.name}: ${JSON.stringify(entity.details || {})}`,
              note_type: entity.type === 'symptom' ? 'symptom' : 'observation',
              extracted_entities: entity.details,
              source_message: messages[messageIndex - 1]?.content,
            });
            break;
        }
      }

      await addNote.mutateAsync({
        pet_id: petId,
        content: messages[messageIndex - 1]?.content || '',
        note_type: 'chat_extracted',
        extracted_entities: message.entities,
        source_message: messages[messageIndex - 1]?.content,
      });

      setMessages(prev => prev.map((m, i) =>
        i === messageIndex ? { ...m, confirmed: true } : m
      ));

      toast({
        title: t('petRegistration.chat.entitiesSaved'),
        description: t('petRegistration.chat.entitiesSavedDesc', { count: message.entities.length }),
      });
    } catch (error: any) {
      toast({
        title: t('common.error'),
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <Card className="flex flex-col h-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <MessageSquare className="h-5 w-5" />
          {t('petRegistration.chat.title')}
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          {t('petRegistration.chat.description')}
        </p>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col min-h-0">
        <ScrollArea className="flex-1 pr-4 mb-4" ref={scrollRef}>
          <div className="space-y-4">
            {messages.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p className="text-sm">{t('petRegistration.chat.placeholder')}</p>
                <p className="text-xs mt-2 italic">{t('petRegistration.chat.example')}</p>
                <p className="text-xs mt-1 italic text-primary">{t('petRegistration.chat.questionExample', 'Or ask: "What is the most severe condition?"')}</p>
              </div>
            )}

            {messages.map((message, idx) => (
              <div
                key={idx}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-lg px-4 py-3 ${
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  }`}
                >
                  {message.isQA ? (
                    <div className="prose prose-sm dark:prose-invert max-w-none text-sm">
                      <ReactMarkdown>{message.content}</ReactMarkdown>
                    </div>
                  ) : (
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  )}

                  {message.entities && message.entities.length > 0 && (
                    <div className="mt-3 space-y-2">
                      <div className="flex flex-wrap gap-1.5">
                        {message.entities.map((entity, eIdx) => (
                          <Badge
                            key={eIdx}
                            variant="outline"
                            className={`text-xs ${entityColors[entity.type]}`}
                          >
                            {entityIcons[entity.type]}
                            <span className="ml-1">{entity.name}</span>
                            {entity.details?.severity && (
                              <span className="ml-1 opacity-70">({entity.details.severity})</span>
                            )}
                            {entity.details?.dosage && (
                              <span className="ml-1 opacity-70">({entity.details.dosage})</span>
                            )}
                          </Badge>
                        ))}
                      </div>

                      {!message.confirmed && (
                        <div className="flex gap-2 mt-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
                            onClick={() => handleConfirmEntities(idx)}
                          >
                            <Check className="h-3 w-3 mr-1" />
                            {t('petRegistration.chat.confirm')}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs"
                            onClick={() => setMessages(prev => prev.map((m, i) =>
                              i === idx ? { ...m, confirmed: true, entities: [] } : m
                            ))}
                          >
                            <X className="h-3 w-3 mr-1" />
                            {t('petRegistration.chat.discard')}
                          </Button>
                        </div>
                      )}

                      {message.confirmed && message.entities.length > 0 && (
                        <p className="text-xs text-green-600 mt-1">
                          ✓ {t('petRegistration.chat.entitiesConfirmed')}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {isProcessing && (
              <div className="flex justify-start">
                <div className="bg-muted rounded-lg px-4 py-3 flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm">{t('petRegistration.chat.extracting')}</span>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="flex gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t('petRegistration.chat.inputPlaceholder')}
            rows={2}
            className="resize-none"
            disabled={isProcessing}
          />
          <Button
            onClick={handleSend}
            disabled={!input.trim() || isProcessing}
            size="icon"
            className="shrink-0 h-auto"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default PetClinicalChat;
