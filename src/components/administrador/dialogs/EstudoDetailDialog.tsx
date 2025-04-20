
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, FlaskConical, Activity, CheckCircle, ArrowRight, Leaf } from "lucide-react";
import ApprovalStagesList from '../pesquisa/components/ApprovalStagesList';
import EvidenceTag from '../tags/EvidenceTag';
import NutraceuticalTag from '../tags/NutraceuticalTag';
import OutcomeTag from '../tags/OutcomeTag';
import ScoreSummaryCard from '../tags/ScoreSummaryCard';
import { Card, CardContent } from '@/components/ui/card';

interface EstudoDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  estudo?: any; // Tipo será refinado quando os dados reais estiverem disponíveis
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

  // Dados de exemplo para a análise de condições
  const condicoesAnalisadas = [
    { 
      nome: "Doença articular degenerativa", 
      eficacia: 4.2,
      evidencia: "Alta",
      populacao: "Cães seniors, raças grandes",
      dosagem: "15-30mg/kg/dia",
    },
    { 
      nome: "Inflamação aguda", 
      eficacia: 3.5,
      evidencia: "Moderada",
      populacao: "Todas as raças",
      dosagem: "10-20mg/kg/dia",
    },
    { 
      nome: "Recuperação pós-cirúrgica", 
      eficacia: 3.8,
      evidencia: "Moderada-Alta",
      populacao: "Todos os cães",
      dosagem: "20-40mg/kg/dia por 14 dias",
    },
  ];

  // Pontuações científicas do estudo
  const studyScores = {
    qualityScore: 4.2, // Qualidade metodológica
    relevanceScore: 3.8, // Relevância clínica
    noveltyScore: 3.5, // Novidade científica
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center">
            <FileText className="mr-2 h-5 w-5" />
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

          {/* Aba de Visão Geral */}
          <TabsContent value="overview" className="space-y-4">
            <div className="space-y-3">
              <div>
                <h4 className="text-sm font-medium">Descrição</h4>
                <p className="text-sm text-gray-700">{estudo.description}</p>
              </div>
              
              <div>
                <h4 className="text-sm font-medium">Resumo</h4>
                <div className="bg-gray-50 p-3 rounded-md text-sm">
                  {estudo.abstract || "Resumo não disponível"}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <ScoreSummaryCard 
                  score={studyScores.qualityScore}
                  title="Qualidade Metodológica"
                  description="Rigor científico e design do estudo"
                />
                <ScoreSummaryCard 
                  score={studyScores.relevanceScore}
                  title="Relevância Clínica"
                  description="Aplicabilidade na prática veterinária"
                />
                <ScoreSummaryCard 
                  score={studyScores.noveltyScore}
                  title="Novidade Científica"
                  description="Contribuição ao conhecimento existente"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium">Metodologia</h4>
                  <p className="text-sm text-gray-700">Estudo randomizado controlado com {estudo.sampleSize || 'X'} animais</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium">Nutracêuticos Analisados</h4>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {estudo.nutraceuticals?.map((nutra: string, idx: number) => (
                      <NutraceuticalTag 
                        key={idx} 
                        name={nutra} 
                        score={[4.2, 3.9, 3.7, 4.5][idx % 4]} 
                      />
                    )) || 'Não especificado'}
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Aba de Análise IA */}
          <TabsContent value="analysis" className="space-y-4">
            <div className="bg-yellow-50 border border-yellow-100 p-3 rounded-md text-sm">
              <p className="text-yellow-700 flex items-center">
                <FlaskConical className="h-4 w-4 mr-2" />
                A análise da IA está processando o conteúdo completo do estudo
              </p>
            </div>
            
            <div className="space-y-3">
              <div>
                <h4 className="text-sm font-medium">Principais Conclusões</h4>
                <p className="text-sm text-gray-700">
                  O estudo demonstra eficácia significativa do nutracêutico para condições articulares
                  em cães de médio e grande porte. A dosagem recomendada mostrou resultados estatisticamente
                  significativos (p&lt;0.01) após 8 semanas de uso contínuo.
                </p>
              </div>
              
              <div>
                <h4 className="text-sm font-medium">Métricas de Avaliação</h4>
                <div className="grid grid-cols-3 gap-2 mt-2">
                  <div className="bg-gray-50 p-2 rounded-md text-center">
                    <div className="text-lg font-semibold text-blue-700">4.2/5</div>
                    <div className="text-xs text-gray-500">Qualidade Metodológica</div>
                  </div>
                  <div className="bg-gray-50 p-2 rounded-md text-center">
                    <div className="text-lg font-semibold text-blue-700">3.8/5</div>
                    <div className="text-xs text-gray-500">Relevância Clínica</div>
                  </div>
                  <div className="bg-gray-50 p-2 rounded-md text-center">
                    <div className="text-lg font-semibold text-green-700">Alto</div>
                    <div className="text-xs text-gray-500">Nível de Evidência</div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Aba de Condições */}
          <TabsContent value="conditions" className="space-y-4">
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

          {/* Aba de Aprovação */}
          <TabsContent value="approval" className="space-y-4">
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
