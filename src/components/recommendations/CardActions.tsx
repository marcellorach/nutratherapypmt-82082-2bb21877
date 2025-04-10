
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerTitle, DrawerDescription, DrawerHeader, DrawerFooter } from "@/components/ui/drawer";
import { Badge } from "@/components/ui/badge";
import { Recommendation, Nutraceutical, ExamResult } from '@/types';
import { Check, Search, FileText, MessageSquare, PieChart, ThumbsUp, CheckCircle2, AlertCircle } from 'lucide-react';
import { examResults } from '@/data';
import { useToast } from "@/hooks/use-toast";
import PopulationChart from './PopulationChart';
import { useIsMobile } from '@/hooks/use-mobile';

interface ActiveIngredientType {
  name: string;
  quantity: string;
  removed?: boolean;
  efficacy: number;
}

interface CardActionsProps {
  recommendation: Recommendation;
  nutraceutical: Nutraceutical;
  ingredients: ActiveIngredientType[];
  onIngredientEfficacyChange: (index: number, value: number) => void;
}

const CardActions: React.FC<CardActionsProps> = ({ 
  recommendation, 
  nutraceutical,
  ingredients,
  onIngredientEfficacyChange
}) => {
  const [isApproved, setIsApproved] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [showExams, setShowExams] = useState(false);
  const [showAI, setShowAI] = useState(false);
  const [showCompare, setShowCompare] = useState(false);
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [aiQuestion, setAiQuestion] = useState("");
  const [aiIsTyping, setAiIsTyping] = useState(false);
  const [examRequestSent, setExamRequestSent] = useState(false);
  const { toast } = useToast();
  const isMobile = useIsMobile();

  const petExams = examResults.filter(exam => exam.petId === recommendation.petId);
  
  const handleApprove = () => {
    setIsApproved(true);
    toast({
      title: "Recomendação aprovada",
      description: `${nutraceutical.name} foi aprovado para o tratamento.`,
      variant: "default",
    });
  };
  
  const handleAIQuestion = () => {
    if (!aiQuestion.trim()) return;
    
    setAiIsTyping(true);
    
    // Simular resposta da IA após um pequeno delay
    setTimeout(() => {
      const responses = [
        `De acordo com estudos recentes, ${nutraceutical.name} demonstrou eficácia significativa para ${nutraceutical.condition}, especialmente quando administrado nas doses recomendadas. Os resultados mostram melhora em aproximadamente 78% dos casos após 6-8 semanas de uso contínuo.`,
        `A combinação dos ingredientes ativos em ${nutraceutical.name} demonstra sinergia particularmente eficaz para ${nutraceutical.condition}. Os estudos indicam que a eficácia é otimizada quando utilizado em conjunto com uma dieta balanceada.`,
        `Para ${nutraceutical.condition}, o protocolo recomendado de ${nutraceutical.name} baseia-se em evidências de nível 2 (estudos clínicos controlados). A sustentação do efeito terapêutico é de aproximadamente 85% após 3 meses de uso contínuo.`,
        `As contraindicações principais de ${nutraceutical.name} são raras (menos de 3% dos casos), mas incluem hipersensibilidade a qualquer um dos componentes ativos. É sempre recomendável monitoramento periódico durante o tratamento.`
      ];
      
      setAiResponse(responses[Math.floor(Math.random() * responses.length)]);
      setAiIsTyping(false);
    }, 1500);
  };
  
  const handleRequestExams = () => {
    setExamRequestSent(true);
    toast({
      title: "Exames solicitados",
      description: "As solicitações de exames foram enviadas para o tutor do pet.",
      variant: "default",
    });
  };

  const MobileWrapper = ({ open, onOpenChange, title, description, children }: { 
    open: boolean; 
    onOpenChange: (open: boolean) => void; 
    title: string;
    description: string;
    children: React.ReactNode 
  }) => {
    if (isMobile) {
      return (
        <Drawer open={open} onOpenChange={onOpenChange}>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>{title}</DrawerTitle>
              <DrawerDescription>{description}</DrawerDescription>
            </DrawerHeader>
            <div className="px-4">{children}</div>
            <DrawerFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>Fechar</Button>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
      );
    }
    
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl">
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
          {children}
        </DialogContent>
      </Dialog>
    );
  };

  return (
    <div className="grid grid-cols-2 gap-2 mt-3">
      <Button 
        className={`flex items-center gap-1 border ${isApproved 
          ? "bg-green-600 hover:bg-green-700 border-green-700" 
          : "border-green-400 bg-green-50 text-green-800 hover:bg-green-100"}`}
        onClick={handleApprove}
        disabled={isApproved}
      >
        {isApproved ? <CheckCircle2 size={16} /> : <Check size={16} />}
        {isApproved ? "Aprovado" : "Aprovar"}
      </Button>
      
      <Button 
        variant="outline" 
        className="flex items-center gap-1 border border-amber-400 bg-amber-50 text-amber-800 hover:bg-amber-100" 
        onClick={() => setShowDetails(true)}
      >
        <Search size={16} />
        Verificar indicação
      </Button>
      
      <Button 
        variant="outline" 
        className="flex items-center gap-1 border border-blue-400 bg-blue-50 text-blue-800 hover:bg-blue-100" 
        onClick={() => setShowExams(true)}
      >
        <FileText size={16} />
        Exames ({petExams.length})
      </Button>
      
      <Button 
        className="col-span-2 flex items-center justify-center gap-1 border border-purple-400 bg-purple-50 text-purple-800 h-12 hover:bg-purple-100" 
        onClick={() => setShowAI(true)}
      >
        <MessageSquare size={18} />
        Conversar com AI
      </Button>
      
      <Button 
        variant="outline" 
        className="col-span-2 flex items-center justify-center gap-1 border border-cyan-400 bg-cyan-50 text-cyan-800 h-9 text-sm hover:bg-cyan-100" 
        onClick={() => setShowCompare(true)}
      >
        <PieChart size={14} />
        Comparar com população
      </Button>

      <MobileWrapper 
        open={showDetails} 
        onOpenChange={setShowDetails}
        title="Detalhes da indicação"
        description={`${nutraceutical.name} para ${nutraceutical.condition}`}
      >
        <div className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">Motivo da recomendação</h4>
            <p className="bg-slate-50 p-3 rounded-md">{recommendation.reason}</p>
          </div>
          
          <div>
            <h4 className="font-medium mb-2">Base científica</h4>
            <div className="bg-slate-50 p-3 rounded-md">
              <div className="flex gap-2 mb-2">
                <Badge variant="outline">Eficácia: {nutraceutical.scientificEvidence.efficacyScore}/5</Badge>
                <Badge variant="outline">Sustentação: {nutraceutical.scientificEvidence.sustainabilityScore}/5</Badge>
              </div>
              
              <div className="space-y-2">
                {nutraceutical.scientificEvidence.studies.map((study, i) => (
                  <div key={i} className="text-sm">
                    <a href={study.link} target="_blank" rel="noreferrer" className="text-blue-500 hover:underline">
                      {study.title} ({study.year})
                    </a>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          <div>
            <h4 className="font-medium mb-2">Contraindicações</h4>
            <ul className="list-disc list-inside space-y-1 bg-slate-50 p-3 rounded-md">
              {nutraceutical.contraindications.map((c, i) => (
                <li key={i} className="text-sm">{c}</li>
              ))}
            </ul>
          </div>
          
          <div className="mt-4 flex justify-end gap-2">
            <Button 
              className={`flex items-center gap-1 border ${isApproved 
                ? "bg-green-600 hover:bg-green-700" 
                : "bg-green-100 text-green-800 hover:bg-green-200 border-green-300"}`}
              onClick={handleApprove}
              disabled={isApproved}
            >
              {isApproved ? <CheckCircle2 size={16} /> : <ThumbsUp size={16} />}
              {isApproved ? "Já aprovado" : "Aprovar recomendação"}
            </Button>
          </div>
        </div>
      </MobileWrapper>

      <MobileWrapper 
        open={showExams} 
        onOpenChange={setShowExams}
        title="Exames do paciente"
        description="Histórico de exames relacionados à condição"
      >
        {petExams.length > 0 ? (
          <div className="space-y-4 mb-6">
            {petExams.map((exam) => (
              <div key={exam.id} className="border rounded-md p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-medium">{exam.type}</h4>
                    <p className="text-sm text-gray-500">{exam.date}</p>
                  </div>
                  <Badge variant="outline" className="bg-green-50 text-green-700">Realizado</Badge>
                </div>
                
                <div className="mt-4 grid grid-cols-2 gap-2">
                  {Object.entries(exam.results).map(([key, value]) => (
                    <div key={key} className="text-sm">
                      <span className="text-gray-500">{key}: </span>
                      <span className="font-medium">{value}</span>
                    </div>
                  ))}
                </div>
                
                {exam.notes && (
                  <div className="mt-4 text-sm bg-amber-50 p-2 rounded">
                    <span className="font-medium">Observações: </span>
                    {exam.notes}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 bg-slate-50 rounded-md mb-6">
            <AlertCircle className="mx-auto text-amber-500 mb-2" size={24} />
            <p className="text-gray-700 mb-2">Este paciente não possui exames registrados.</p>
            <Button 
              className="mt-2"
              onClick={handleRequestExams}
              disabled={examRequestSent}
            >
              {examRequestSent ? "Exames solicitados" : "Solicitar exames"}
            </Button>
          </div>
        )}
      </MobileWrapper>

      <MobileWrapper 
        open={showAI} 
        onOpenChange={setShowAI}
        title="Assistente de IA"
        description="Pergunte sobre esta recomendação"
      >
        <div className="h-[400px] flex flex-col">
          <div className="flex-1 bg-slate-50 rounded-md p-4 mb-4 overflow-y-auto">
            <div className="space-y-4">
              <div className="bg-primary/10 p-3 rounded-md max-w-[80%]">
                <p className="text-sm">
                  Como posso ajudar com a recomendação de {nutraceutical.name} para {nutraceutical.condition}?
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
      </MobileWrapper>

      <MobileWrapper 
        open={showCompare} 
        onOpenChange={setShowCompare}
        title="Comparação com população"
        description={`Dados comparativos para ${nutraceutical.name}`}
      >
        <div className="space-y-6 mb-6">
          <PopulationChart 
            baseEfficacyScore={nutraceutical.scientificEvidence.efficacyScore}
            condition={nutraceutical.condition}
            ingredients={ingredients}
          />
          
          <div>
            <h4 className="font-medium mb-2">Comparação específica para raça</h4>
            <div className="bg-slate-50 p-3 rounded-md">
              <p className="text-sm">
                A eficácia em {nutraceutical.condition} para esta raça é 23% maior que a média da população geral.
                Efeitos colaterais reportados são menos comuns (8% vs. 12% na população geral).
              </p>
              <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                <div className="bg-green-50 p-2 rounded border border-green-100">
                  <p className="font-medium mb-1 text-green-800">Tempo médio para resultado</p>
                  <p>4,2 semanas (população: 6,3 semanas)</p>
                </div>
                <div className="bg-blue-50 p-2 rounded border border-blue-100">
                  <p className="font-medium mb-1 text-blue-800">Resposta positiva</p>
                  <p>89% (população: 76%)</p>
                </div>
              </div>
            </div>
          </div>
          
          <div>
            <h4 className="font-medium mb-2">Ajuste de dosagem recomendado</h4>
            <div className="bg-slate-50 p-3 rounded-md">
              <p className="text-sm mb-2">
                Baseado nos dados comparativos, uma pequena redução na dosagem ainda manteria a eficácia para esta raça específica.
              </p>
              <Button 
                variant="outline" 
                className="w-full text-sm border-primary text-primary hover:bg-primary/5"
                onClick={() => {
                  // Exibir toast sobre otimização da dosagem
                  toast({
                    title: "Dosagem otimizada",
                    description: "As recomendações de dosagem foram ajustadas com base nos dados comparativos.",
                  });
                  setShowCompare(false);
                }}
              >
                Otimizar dosagem para raça
              </Button>
            </div>
          </div>
        </div>
      </MobileWrapper>
    </div>
  );
};

export default CardActions;

