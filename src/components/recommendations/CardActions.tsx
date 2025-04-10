
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from "@/components/ui/drawer";
import { Badge } from "@/components/ui/badge";
import { Recommendation, Nutraceutical, ExamResult } from '@/types';
import { Check, Search, FileText, MessageSquare, PieChart, ThumbsUp } from 'lucide-react';
import { examResults } from '@/data';
import { useToast } from "@/hooks/use-toast";
import PopulationChart from './PopulationChart';
import { useMediaQuery } from '@/hooks/use-mobile';

interface CardActionsProps {
  recommendation: Recommendation;
  nutraceutical: Nutraceutical;
}

const CardActions: React.FC<CardActionsProps> = ({ recommendation, nutraceutical }) => {
  const [isApproved, setIsApproved] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [showExams, setShowExams] = useState(false);
  const [showAI, setShowAI] = useState(false);
  const [showCompare, setShowCompare] = useState(false);
  const { toast } = useToast();
  const isMobile = useMediaQuery("(max-width: 640px)");

  // Encontrar exames para este pet
  const petExams = examResults.filter(exam => exam.petId === recommendation.petId);
  
  const handleApprove = () => {
    setIsApproved(true);
    toast({
      title: "Recomendação aprovada",
      description: `${nutraceutical.name} foi aprovado para o tratamento.`,
      variant: "default", // Corrigido de "success" para "default"
    });
  };

  // Componente móvel vs desktop para dialogs
  const MobileWrapper = ({ open, onOpenChange, children }: { open: boolean; onOpenChange: (open: boolean) => void; children: React.ReactNode }) => {
    if (isMobile) {
      return (
        <Drawer open={open} onOpenChange={onOpenChange}>
          <DrawerContent>{children}</DrawerContent>
        </Drawer>
      );
    }
    
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl">{children}</DialogContent>
      </Dialog>
    );
  };

  return (
    <div className="grid grid-cols-2 gap-2 mt-3">
      <Button 
        className={`flex items-center gap-1 ${isApproved ? "bg-green-500 hover:bg-green-600" : ""}`}
        onClick={handleApprove}
        disabled={isApproved}
      >
        <Check size={16} />
        {isApproved ? "Aprovado" : "Aprovar"}
      </Button>
      
      <Button variant="outline" className="flex items-center gap-1" onClick={() => setShowDetails(true)}>
        <Search size={16} />
        Verificar indicação
      </Button>
      
      <Button variant="outline" className="flex items-center gap-1" onClick={() => setShowExams(true)}>
        <FileText size={16} />
        Exames ({petExams.length})
      </Button>
      
      <Button variant="outline" className="flex items-center gap-1" onClick={() => setShowAI(true)}>
        <MessageSquare size={16} />
        AI
      </Button>
      
      <Button 
        variant="outline" 
        className="col-span-2 flex items-center justify-center gap-1 bg-slate-50" 
        onClick={() => setShowCompare(true)}
      >
        <PieChart size={16} />
        Comparar com população
      </Button>

      {/* Modal de detalhes da indicação */}
      <MobileWrapper open={showDetails} onOpenChange={setShowDetails}>
        <div className="p-4">
          <div className="mb-6">
            <h3 className="text-xl font-bold mb-1">Detalhes da indicação</h3>
            <p className="text-gray-600">{nutraceutical.name} para {nutraceutical.condition}</p>
          </div>
          
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
          </div>
          
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowDetails(false)}>Fechar</Button>
            <Button className="flex items-center gap-1" onClick={handleApprove}>
              <ThumbsUp size={16} />
              Aprovar recomendação
            </Button>
          </div>
        </div>
      </MobileWrapper>

      {/* Modal de exames */}
      <MobileWrapper open={showExams} onOpenChange={setShowExams}>
        <div className="p-4">
          <div className="mb-6">
            <h3 className="text-xl font-bold mb-1">Exames do paciente</h3>
            <p className="text-gray-600">Histórico de exames relacionados à condição</p>
          </div>
          
          {petExams.length > 0 ? (
            <div className="space-y-4">
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
            <div className="text-center py-8 bg-slate-50 rounded-md">
              <p className="text-gray-500">Este paciente não possui exames registrados.</p>
              <Button className="mt-4">Solicitar exames</Button>
            </div>
          )}
        </div>
      </MobileWrapper>

      {/* Modal do AI Chat */}
      <MobileWrapper open={showAI} onOpenChange={setShowAI}>
        <div className="p-4 h-[500px] flex flex-col">
          <div className="mb-4">
            <h3 className="text-xl font-bold mb-1">Assistente de IA</h3>
            <p className="text-gray-600">Pergunte sobre esta recomendação</p>
          </div>
          
          <div className="flex-1 bg-slate-50 rounded-md p-4 mb-4 overflow-y-auto">
            <div className="space-y-4">
              <div className="bg-primary/10 p-3 rounded-md max-w-[80%]">
                <p className="text-sm">
                  Como posso ajudar com a recomendação de {nutraceutical.name} para {nutraceutical.condition}?
                </p>
              </div>
              
              <div className="bg-white p-3 rounded-md max-w-[80%] ml-auto">
                <p className="text-sm">
                  Quais são os dados mais recentes sobre eficácia desse nutracêutico?
                </p>
              </div>
              
              <div className="bg-primary/10 p-3 rounded-md max-w-[80%]">
                <p className="text-sm">
                  De acordo com os estudos mais recentes, o {nutraceutical.name} demonstrou uma eficácia de {nutraceutical.scientificEvidence.efficacyScore}/5 para {nutraceutical.condition}. 
                  O estudo mais recente ({nutraceutical.scientificEvidence.studies[0].year}) indica melhora significativa em 87% dos casos após 8 semanas de uso contínuo.
                  Comparado com grupos de controle, houve redução de 62% na recorrência dos sintomas. Posso fornecer mais detalhes sobre dosagens ou contraindicações se necessário.
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex gap-2">
            <input 
              type="text" 
              placeholder="Digite sua pergunta..." 
              className="flex-1 border rounded-md p-2"
            />
            <Button type="button">Enviar</Button>
          </div>
        </div>
      </MobileWrapper>

      {/* Modal de comparação com população */}
      <MobileWrapper open={showCompare} onOpenChange={setShowCompare}>
        <div className="p-4">
          <div className="mb-6">
            <h3 className="text-xl font-bold mb-1">Comparação com população</h3>
            <p className="text-gray-600">Dados comparativos para {nutraceutical.name}</p>
          </div>
          
          <div className="space-y-6">
            <div>
              <h4 className="font-medium mb-3">Eficácia em casos semelhantes</h4>
              <div className="bg-slate-50 p-4 rounded-md">
                <PopulationChart 
                  efficacyScore={nutraceutical.scientificEvidence.efficacyScore}
                  condition={nutraceutical.condition}
                />
              </div>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">Estatísticas relevantes</h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 p-3 rounded-md">
                  <p className="text-xs text-gray-500">Taxa de sucesso</p>
                  <p className="text-xl font-bold text-green-600">87%</p>
                </div>
                <div className="bg-slate-50 p-3 rounded-md">
                  <p className="text-xs text-gray-500">Tempo médio até resposta</p>
                  <p className="text-xl font-bold">21 dias</p>
                </div>
                <div className="bg-slate-50 p-3 rounded-md">
                  <p className="text-xs text-gray-500">Casos com efeitos colaterais</p>
                  <p className="text-xl font-bold text-amber-600">12%</p>
                </div>
                <div className="bg-slate-50 p-3 rounded-md">
                  <p className="text-xs text-gray-500">Pacientes da mesma raça</p>
                  <p className="text-xl font-bold">143</p>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">Comparação específica para raça</h4>
              <div className="bg-slate-50 p-3 rounded-md">
                <p className="text-sm">
                  A eficácia em {nutraceutical.condition} para esta raça é 23% maior que a média da população geral.
                  Efeitos colaterais reportados são menos comuns (8% vs. 12% na população geral).
                </p>
              </div>
            </div>
          </div>
        </div>
      </MobileWrapper>
    </div>
  );
};

export default CardActions;
