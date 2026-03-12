
import { ExamResult, Nutraceutical, Pet, Recommendation, Message } from '@/types';
import { supabase } from '@/integrations/supabase/client';

// Função auxiliar para preparar contexto
const prepareVeterinaryContext = (
  pet: Pet | null,
  nutraceutical: Nutraceutical,
  recommendation: Recommendation,
  exams: ExamResult[]
): string => {
  if (!pet) return '';
  
  const examData = exams.length > 0
    ? `Histórico de exames: ${exams.map(exam => 
        `Exame de ${exam.type} em ${exam.date}: ${Object.entries(exam.results)
          .map(([key, value]) => `${key}: ${value}`)
          .join(', ')}${exam.notes ? ` - Observação: ${exam.notes}` : ''}`
      ).join('; ')}`
    : 'Sem histórico de exames disponível.';
  
  const scientificBasis = `Base científica: Eficácia: ${nutraceutical.scientificEvidence.efficacyScore}/5, 
    Sustentação: ${nutraceutical.scientificEvidence.sustainabilityScore}/5. 
    Estudos: ${nutraceutical.scientificEvidence.studies.map(s => `${s.title} (${s.year})`).join('; ')}.`;
    
  return `
    CONTEXTO DO PACIENTE:
    - Pet: ${pet.name}, ${pet.species}, ${pet.breed}, ${pet.age} anos, ${pet.weight}kg
    - Condição: ${nutraceutical.condition}
    - Recomendação: ${nutraceutical.name}
    - Motivo: ${recommendation.reason}
    - Dosagem: ${recommendation.dosage}
    - Duração: ${recommendation.duration}
    - Princípios ativos: ${nutraceutical.activeIngredients.join(', ')}
    - ${scientificBasis}
    - ${examData}
    
    DIRETRIZES:
    - Responda como um assistente veterinário especializado em nutracêuticos
    - Baseie suas respostas em evidências científicas
    - Seja preciso e claro para auxiliar o veterinário
    - Quando relevante, cite estudos científicos específicos
    - Relacione valores de exames com a condição e tratamento quando aplicável
    - Explique como o nutracêutico pode ajudar na condição específica
    - Não extrapole além das evidências disponíveis
  `;
};

// Interface para resposta da IA
interface AIResponse {
  answer: string;
  error?: string;
}

// Função principal para consulta da IA — agora usa edge function 'chat' real
export const askVeterinaryAI = async (
  question: string,
  pet: Pet | null,
  nutraceutical: Nutraceutical,
  recommendation: Recommendation,
  exams: ExamResult[],
  conversationHistory: Message[] = []
): Promise<AIResponse> => {
  try {
    const systemContext = prepareVeterinaryContext(pet, nutraceutical, recommendation, exams);
    
    const messages = [
      { role: 'system', content: systemContext },
      ...conversationHistory.filter(m => m.role !== 'system'),
      { role: 'user', content: question }
    ];
    
    const { data, error } = await supabase.functions.invoke('chat', {
      body: { 
        messages,
        stream: false 
      }
    });

    if (error) {
      console.error('Erro ao consultar IA veterinária:', error);
      return { 
        answer: 'Desculpe, ocorreu um erro ao processar sua consulta. Por favor, tente novamente.',
        error: error.message 
      };
    }

    // Handle non-streaming response
    const answer = data?.response || data?.choices?.[0]?.message?.content || 'Sem resposta da IA.';
    
    return { answer };
  } catch (error) {
    console.error('Erro ao consultar IA veterinária:', error);
    return { 
      answer: 'Desculpe, ocorreu um erro ao processar sua consulta. Por favor, tente novamente.',
      error: error instanceof Error ? error.message : 'Erro desconhecido' 
    };
  }
};

export default askVeterinaryAI;
