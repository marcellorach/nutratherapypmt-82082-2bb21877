
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { MessageSquare } from 'lucide-react';

interface AIChatProps {
  nutraceuticalName: string;
  nutraceuticalCondition: string;
}

const AIChat: React.FC<AIChatProps> = ({ nutraceuticalName, nutraceuticalCondition }) => {
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [aiQuestion, setAiQuestion] = useState("");
  const [aiIsTyping, setAiIsTyping] = useState(false);

  const handleAIQuestion = () => {
    if (!aiQuestion.trim()) return;
    
    setAiIsTyping(true);
    
    // Simular resposta da IA após um pequeno delay
    setTimeout(() => {
      const responses = [
        `De acordo com estudos recentes, ${nutraceuticalName} demonstrou eficácia significativa para ${nutraceuticalCondition}, especialmente quando administrado nas doses recomendadas. Os resultados mostram melhora em aproximadamente 78% dos casos após 6-8 semanas de uso contínuo.`,
        `A combinação dos ingredientes ativos em ${nutraceuticalName} demonstra sinergia particularmente eficaz para ${nutraceuticalCondition}. Os estudos indicam que a eficácia é otimizada quando utilizado em conjunto com uma dieta balanceada.`,
        `Para ${nutraceuticalCondition}, o protocolo recomendado de ${nutraceuticalName} baseia-se em evidências de nível 2 (estudos clínicos controlados). A sustentação do efeito terapêutico é de aproximadamente 85% após 3 meses de uso contínuo.`,
        `As contraindicações principais de ${nutraceuticalName} são raras (menos de 3% dos casos), mas incluem hipersensibilidade a qualquer um dos componentes ativos. É sempre recomendável monitoramento periódico durante o tratamento.`
      ];
      
      setAiResponse(responses[Math.floor(Math.random() * responses.length)]);
      setAiIsTyping(false);
    }, 1500);
  };

  return (
    <div className="h-[400px] flex flex-col">
      <div className="flex-1 bg-slate-50 rounded-md p-4 mb-4 overflow-y-auto">
        <div className="space-y-4">
          <div className="bg-primary/10 p-3 rounded-md max-w-[80%]">
            <p className="text-sm">
              Como posso ajudar com a recomendação de {nutraceuticalName} para {nutraceuticalCondition}?
            </p>
          </div>
          
          {(aiQuestion || aiResponse) && (
            <div className="bg-white p-3 rounded-md max-w-[80%] ml-auto">
              <p className="text-sm">
                {aiQuestion}
              </p>
            </div>
          )}
          
          {aiIsTyping && (
            <div className="bg-primary/10 p-3 rounded-md max-w-[80%]">
              <div className="flex gap-1">
                <span className="animate-bounce">.</span>
                <span className="animate-bounce delay-150">.</span>
                <span className="animate-bounce delay-300">.</span>
              </div>
            </div>
          )}
          
          {aiResponse && (
            <div className="bg-primary/10 p-3 rounded-md max-w-[80%]">
              <p className="text-sm">
                {aiResponse}
              </p>
            </div>
          )}
        </div>
      </div>
      
      <div className="flex gap-2">
        <input 
          type="text" 
          placeholder="Digite sua pergunta..." 
          className="flex-1 border rounded-md p-2"
          value={aiQuestion}
          onChange={(e) => setAiQuestion(e.target.value)}
          onKeyPress={(e) => e.key === "Enter" && handleAIQuestion()}
        />
        <Button 
          type="button" 
          onClick={handleAIQuestion}
          disabled={aiIsTyping || !aiQuestion.trim()}
        >
          Enviar
        </Button>
      </div>
    </div>
  );
};

export default AIChat;
