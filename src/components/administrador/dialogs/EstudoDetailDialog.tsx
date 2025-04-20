import React, { useState } from 'react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowRight, Leaf } from "lucide-react";
import ApprovalStagesList from '../pesquisa/components/ApprovalStagesList';
import VisaoGeralTab from '../estudos/detalhes/tabs/VisaoGeralTab';
import AnaliseTab from '../estudos/detalhes/tabs/AnaliseTab';
import EvidenceTag from '../tags/EvidenceTag';
import NutraceuticalTag from '../tags/NutraceuticalTag';
import OutcomeTag from '../tags/OutcomeTag';

const condicoesAnalisadas = [
  {
    nome: "Artrite Canina",
    eficacia: 4.5,
    evidencia: "Evidência de alta qualidade",
    populacao: "Cães adultos e idosos",
    dosagem: "10mg/kg/dia"
  },
  {
    nome: "Osteoartrite",
    eficacia: 4.2,
    evidencia: "Evidência de boa qualidade",
    populacao: "Cães de grande porte",
    dosagem: "15mg/kg/dia"
  },
  {
    nome: "Inflamação Articular",
    eficacia: 3.8,
    evidencia: "Evidência moderada",
    populacao: "Todas as raças",
    dosagem: "8mg/kg/dia"
  }
];

interface EstudoDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  estudo?: any;
  onAdvanceApproval?: (estudoId: string) => void;
}

const EstudoDetailDialog: React.FC<EstudoDetailDialogProps> = ({
  open,
  onOpenChange,
  estudo,
  onAdvanceApproval
}) => {
  const [activeTab, setActiveTab] = useState("overview");

  if (!estudo) return null;

  const handleAdvanceApproval = () => {
    if (onAdvanceApproval) {
      onAdvanceApproval(estudo.id);
    }
  };

  const studyScores = {
    qualityScore: 4.2,
    relevanceScore: 3.8,
    noveltyScore: 3.5,
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center gap-2">
            {estudo.title}
          </DialogTitle>
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">
              {estudo.journal}, {estudo.year}
            </p>
            <div className="flex items-center gap-2">
              <EvidenceTag score={4.2} showLabel={false} />
              {estudo.nutraceuticals?.map((nutra: string, idx: number) => (
                <NutraceuticalTag 
                  key={idx} 
                  name={nutra} 
                  score={[4.2, 3.9, 3.7, 4.5][idx % 4]} 
                />
              ))}
            </div>
          </div>
        </DialogHeader>

        <Tabs defaultValue="overview" className="w-full" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-4">
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="analysis">Análise IA</TabsTrigger>
            <TabsTrigger value="conditions">Condições</TabsTrigger>
            <TabsTrigger value="approval">Aprovação</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <VisaoGeralTab estudo={estudo} studyScores={studyScores} />
          </TabsContent>

          <TabsContent value="analysis">
            <AnaliseTab estudo={estudo} />
          </TabsContent>

          <TabsContent value="conditions">
            {condicoesAnalisadas.map((condicao, index) => (
              <div key={index} className="border rounded-lg p-3 space-y-2">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Leaf className="h-4 w-4 text-green-600" />
                    <h3 className="font-medium">{condicao.nome}</h3>
                  </div>
                  <OutcomeTag 
                    condition={condicao.nome} 
                    score={condicao.eficacia} 
                    showScore={false}
                  />
                </div>
                
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div>
                    <p className="text-gray-500">Evidência</p>
                    <div className="flex items-center">
                      <EvidenceTag score={condicao.eficacia} showLabel={false} />
                      <span className="ml-2">{condicao.evidencia}</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-gray-500">População</p>
                    <p>{condicao.populacao}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Dosagem</p>
                    <p>{condicao.dosagem}</p>
                  </div>
                </div>
              </div>
            ))}
          </TabsContent>

          <TabsContent value="approval">
            <ApprovalStagesList 
              stages={[
                { name: 'Análise Inicial', status: 'completed' },
                { name: 'Análise IA', status: 'completed' },
                { name: 'Revisão Técnica', status: 'in-progress' },
                { name: 'Aprovação Final', status: 'pending' }
              ]}
            />
            
            <div className="mt-4 border-t pt-4">
              <h4 className="text-sm font-medium">Histórico de Aprovação</h4>
              <ul className="space-y-2 mt-2">
                <li className="text-xs bg-gray-50 p-2 rounded flex justify-between">
                  <span>Submetido para análise inicial</span>
                  <span className="text-gray-500">10/04/2024</span>
                </li>
                <li className="text-xs bg-gray-50 p-2 rounded flex justify-between">
                  <span>Análise inicial concluída</span>
                  <span className="text-gray-500">12/04/2024</span>
                </li>
                <li className="text-xs bg-gray-50 p-2 rounded flex justify-between">
                  <span>Análise de IA concluída</span>
                  <span className="text-gray-500">15/04/2024</span>
                </li>
              </ul>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="flex justify-between items-center">
          <div className="flex-1">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => onOpenChange(false)}
            >
              Fechar
            </Button>
          </div>
          
          <div className="flex gap-2">
            {activeTab === "approval" && (
              <Button 
                onClick={handleAdvanceApproval}
                size="sm"
                className="flex items-center"
              >
                <span>Avançar Estágio</span>
                <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EstudoDetailDialog;
