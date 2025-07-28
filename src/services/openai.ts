import { ExamResult, Nutraceutical, Pet, Recommendation, Message } from '@/types';

// SECURITY FIX: Remover chave API hardcoded
// A chave API deve ser obtida através de variáveis de ambiente seguras ou Supabase secrets
// const OPENAI_API_KEY = 'REMOVIDO_POR_SEGURANCA'; // NUNCA mais hardcodar chaves API
const OPENAI_MODEL = 'gpt-4o-mini';

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

// Função principal para consulta da IA
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
    
    const messages: Message[] = [
      { role: 'system', content: systemContext },
      ...conversationHistory
    ];
    
    // Simular chamada à API OpenAI para o protótipo
    // Em produção, seria substituído pela chamada real à API
    const simulatedResponse = await simulateOpenAIResponse(question, systemContext, conversationHistory);
    
    return { answer: simulatedResponse };
  } catch (error) {
    console.error('Erro ao consultar IA veterinária:', error);
    return { 
      answer: 'Desculpe, ocorreu um erro ao processar sua consulta. Por favor, tente novamente.',
      error: error instanceof Error ? error.message : 'Erro desconhecido' 
    };
  }
};

// Função para simular respostas da OpenAI baseadas no contexto
// Em produção, seria substituída pela chamada real à API
const simulateOpenAIResponse = async (
  question: string,
  context: string,
  history: Message[]
): Promise<string> => {
  // Aguardar um momento para simular o tempo de resposta da API
  await new Promise(resolve => setTimeout(resolve, 800));
  
  // Palavras-chave para identificar o tipo de pergunta
  const keywords = {
    dosagem: ['dosagem', 'dose', 'quanto', 'administrar', 'dar'],
    eficácia: ['eficácia', 'funciona', 'efetivo', 'resultados', 'evidência'],
    contraindicações: ['contraindicação', 'contraindicado', 'perigo', 'risco', 'efeitos colaterais'],
    tempo: ['tempo', 'duração', 'quanto tempo', 'dias', 'semanas', 'meses'],
    mecanismo: ['como funciona', 'mecanismo', 'ação', 'atua', 'processo'],
    exames: ['exames', 'valores', 'resultados', 'parâmetros', 'teste'],
    combinação: ['combinar', 'junto com', 'associar', 'combinação', 'interação']
  };
  
  let responseType = 'geral';
  for (const [type, terms] of Object.entries(keywords)) {
    if (terms.some(term => question.toLowerCase().includes(term.toLowerCase()))) {
      responseType = type;
      break;
    }
  }
  
  // Extrair nome do nutracêutico e condição do contexto
  const nutraceuticalMatch = context.match(/Recomendação: (.+?)\n/);
  const conditionMatch = context.match(/Condição: (.+?)\n/);
  const nutraceutical = nutraceuticalMatch ? nutraceuticalMatch[1] : "o nutracêutico";
  const condition = conditionMatch ? conditionMatch[1] : "esta condição";
  
  // Respostas simuladas baseadas no tipo de pergunta
  const responses: Record<string, string[]> = {
    dosagem: [
      `A dosagem de ${nutraceutical} recomendada foi cuidadosamente calculada com base no peso e condição do animal. As evidências científicas mostram que para ${condition}, a faixa terapêutica ideal está entre 15-40mg/kg/dia, dependendo da gravidade dos sintomas. O estudo de Johnson et al. (2022) demonstrou eficácia de 87% com dosagem semelhante à prescrita.`,
      `Para garantir a eficácia máxima de ${nutraceutical} no tratamento de ${condition}, a dosagem precisa ser ajustada considerando o peso do animal e a gravidade da condição. Os estudos mostram que doses abaixo de 10mg/kg/dia têm eficácia limitada, enquanto doses acima de 50mg/kg/dia não demonstraram benefício adicional e aumentaram o risco de efeitos adversos.`
    ],
    eficácia: [
      `${nutraceutical} demonstrou eficácia significativa para ${condition} em estudos controlados. Particularmente, o estudo multicêntrico de Peterson et al. (2023) com 240 cães demonstrou melhora em 76% dos casos após 8 semanas de tratamento, contra 31% do grupo placebo. Em raças similares à deste paciente, a taxa de resposta foi ainda maior (82%).`,
      `As evidências científicas disponíveis indicam que ${nutraceutical} apresenta eficácia moderada a alta para ${condition}. O metanálise de Martinez & Kim (2024) avaliou 12 estudos com mais de 800 animais e concluiu que há benefício estatisticamente significativo (p<0.001) com efeito médio a grande (d=0.72). Vale ressaltar que a combinação dos princípios ativos presentes nesta formulação demonstrou sinergia, potencializando o efeito.`
    ],
    contraindicações: [
      `As contraindicações principais para ${nutraceutical} são raras (incidência <3%) e incluem hipersensibilidade a algum componente. Em animais com comprometimento hepático severo, recomenda-se monitoramento mais frequente. O estudo de segurança de Williams et al. (2023) com administração prolongada (12 meses) não identificou toxicidade significativa nas doses recomendadas.`,
      `${nutraceutical} possui excelente perfil de segurança quando utilizado nas doses recomendadas. As contraindicações absolutas são mínimas e incluem apenas hipersensibilidade conhecida aos componentes. No entanto, em animais com disfunção renal, recomenda-se ajuste de dose e monitoramento de parâmetros renais. Interações medicamentosas significativas não foram reportadas com medicações comuns.`
    ],
    tempo: [
      `O tempo de tratamento recomendado com ${nutraceutical} para ${condition} se baseia em estudos clínicos que demonstram que os primeiros resultados aparecem em 3-4 semanas, mas o efeito terapêutico completo geralmente é alcançado após 8-12 semanas. O estudo longitudinal de Roberts et al. (2022) demonstrou que a continuidade do tratamento por pelo menos 3 meses resultou em resposta sustentada em 83% dos casos.`,
      `Para ${condition}, o protocolo terapêutico com ${nutraceutical} requer tempo para atingir níveis teciduais adequados. Os estudos mostram que o início da resposta clínica ocorre em 2-3 semanas, com resposta completa em 2-3 meses. Em casos de manutenção, o uso contínuo demonstrou prevenir recidivas em 91% dos casos, conforme demonstrado por Tanaka et al. (2023).`
    ],
    mecanismo: [
      `${nutraceutical} atua através de múltiplos mecanismos complementares no tratamento de ${condition}. O principal componente (identificado nos estudos) atua modulando as vias inflamatórias, especificamente reduzindo a produção de citocinas pró-inflamatórias como IL-6 e TNF-α. Adicionalmente, estudos in vitro demonstraram efeito antioxidante significativo, com redução do estresse oxidativo celular em mais de 60%.`,
      `O mecanismo de ação de ${nutraceutical} envolve principalmente a modulação de vias metabólicas associadas à ${condition}. Os componentes ativos têm demonstrado capacidade de atravessar barreiras teciduais específicas e atuar diretamente nos receptores-alvo. Estudos com marcadores moleculares demonstraram aumento significativo dos fatores protetores e redução dos marcadores de dano tecidual após 4 semanas de tratamento.`
    ],
    exames: [
      `Analisando os resultados dos exames disponíveis, observo que os valores de hemograma estão dentro dos parâmetros normais para a espécie e idade, o que é favorável para a implementação do ${nutraceutical}. No entanto, os níveis ligeiramente elevados de marcadores inflamatórios corroboram com a indicação para ${condition}. Estudos mostram que pacientes com perfil laboratorial semelhante tendem a responder bem ao tratamento em 75-85% dos casos.`,
      `Os exames laboratoriais deste paciente apresentam algumas alterações relevantes para contextualizar o tratamento com ${nutraceutical}. Particularmente, os valores de [parâmetro específico] estão ligeiramente alterados, o que é consistente com o quadro de ${condition}. O estudo de Thompson et al. (2023) demonstrou normalização deste parâmetro em 68% dos pacientes após 8 semanas de tratamento com este nutracêutico.`
    ],
    combinação: [
      `A combinação de ${nutraceutical} com outros tratamentos para ${condition} pode ser benéfica, desde que adequadamente prescrita. Estudos clínicos, como o de Davidson & Liu (2024), demonstraram sinergismo particularmente com terapias anti-inflamatórias convencionais, permitindo redução de dose destes medicamentos em até 40% sem perda de eficácia. No entanto, recomenda-se intervalo de 2 horas entre as administrações para evitar interferência na absorção.`,
      `${nutraceutical} pode ser combinado com a maioria dos tratamentos convencionais para ${condition}, com algumas considerações importantes. A evidência científica atual não indica interações negativas significativas com medicamentos comumente prescritos, porém recomenda-se monitoramento próximo quando combinado com outros hepatomoduladores devido à via metabólica compartilhada.`
    ],
    geral: [
      `${nutraceutical} representa uma abordagem baseada em evidências para o manejo de ${condition}. A formulação foi desenvolvida com base em estudos clínicos que demonstraram eficácia e segurança. Para este paciente específico, considerando seu perfil clínico e histórico, espera-se benefício significativo com baixo risco de efeitos adversos. O monitoramento regular é recomendado para avaliar a resposta e ajustar o tratamento conforme necessário.`,
      `Com base nas evidências científicas atuais, ${nutraceutical} é uma opção terapêutica válida para ${condition} neste paciente. Os estudos clínicos demonstram eficácia comparável a alguns tratamentos convencionais, com melhor perfil de segurança em uso prolongado. A chave para o sucesso terapêutico é a consistência na administração e o monitoramento regular dos parâmetros clínicos relevantes.`
    ]
  };
  
  // Selecionar uma resposta aleatória do tipo correspondente
  const possibleResponses = responses[responseType] || responses.geral;
  const randomIndex = Math.floor(Math.random() * possibleResponses.length);
  
  return possibleResponses[randomIndex];
};

export default askVeterinaryAI;
