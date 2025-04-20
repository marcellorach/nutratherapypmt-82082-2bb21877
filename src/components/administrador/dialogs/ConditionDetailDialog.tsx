import React, { useState } from 'react';
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  ScrollArea, 
  ScrollBar 
} from "@/components/ui/scroll-area";
import { 
  ChartContainer, 
  ChartLegend
} from "@/components/ui/chart";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line
} from 'recharts';
import { ExternalLink, FileText } from "lucide-react";
import { Nutraceutical, NutraceuticalCondition } from "@/types";

interface ConditionDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  nutraceutical: Nutraceutical | null;
  selectedCondition: NutraceuticalCondition | null;
  conditionType: 'prevention' | 'treatment' | 'support' | null;
}

const ConditionDetailDialog: React.FC<ConditionDetailDialogProps> = ({
  open,
  onOpenChange,
  nutraceutical,
  selectedCondition,
  conditionType
}) => {
  const [activeTab, setActiveTab] = useState('overview');

  if (!nutraceutical || !selectedCondition || !conditionType) return null;

  // Função para obter a cor baseada na pontuação de eficácia
  const getEfficacyColor = (score: number) => {
    if (score >= 4) return "text-green-600 bg-green-50 border-green-200";
    if (score >= 3) return "text-amber-600 bg-amber-50 border-amber-200"; 
    if (score >= 2) return "text-blue-600 bg-blue-50 border-blue-200";  // Updated 'Leve' color
    if (score >= 1) return "text-orange-600 bg-orange-50 border-orange-200";
    return "text-red-600 bg-red-50 border-red-200";
  };

  // Título com base no tipo de condição
  const getConditionTypeTitle = () => {
    switch(conditionType) {
      case 'prevention': return 'Prevenção';
      case 'treatment': return 'Tratamento';
      case 'support': return 'Suporte';
      default: return '';
    }
  };

  // Dados simulados para gráficos
  const efficacyOverTimeData = [
    { month: 'Mês 1', eficácia: Math.min(5, Math.max(1, selectedCondition.efficacyScore * 0.7)).toFixed(1) },
    { month: 'Mês 2', eficácia: Math.min(5, Math.max(1, selectedCondition.efficacyScore * 0.85)).toFixed(1) },
    { month: 'Mês 3', eficácia: Math.min(5, Math.max(1, selectedCondition.efficacyScore * 0.95)).toFixed(1) },
    { month: 'Mês 4', eficácia: selectedCondition.efficacyScore.toFixed(1) },
    { month: 'Mês 5', eficácia: Math.min(5, Math.max(1, selectedCondition.efficacyScore * 1.05)).toFixed(1) },
    { month: 'Mês 6', eficácia: Math.min(5, Math.max(1, selectedCondition.efficacyScore * 1.1)).toFixed(1) },
  ];

  const comparativeEfficacyData = [
    { 
      categoria: 'Filhotes', 
      [`${nutraceutical.name}`]: Math.min(5, Math.max(1, selectedCondition.efficacyScore * 0.9)).toFixed(1), 
      'Média outras opções': '2.8' 
    },
    { 
      categoria: 'Adultos', 
      [`${nutraceutical.name}`]: selectedCondition.efficacyScore.toFixed(1), 
      'Média outras opções': '3.2' 
    },
    { 
      categoria: 'Sênior', 
      [`${nutraceutical.name}`]: Math.min(5, Math.max(1, selectedCondition.efficacyScore * 1.1)).toFixed(1), 
      'Média outras opções': '2.9' 
    },
  ];

  // Simulação de estudos adicionais com base na condição
  const relevantStudies = [
    {
      title: `Eficácia de ${nutraceutical.name} no ${conditionType === 'prevention' ? 'controle' : conditionType === 'treatment' ? 'tratamento' : 'suporte'} de ${selectedCondition.name} em cães`,
      authors: "Silva et al.",
      journal: "Journal of Veterinary Nutraceuticals",
      year: 2023,
      link: "https://doi.org/10.example/jvn.2023.01"
    },
    {
      title: `Análise comparativa de nutracêuticos para ${selectedCondition.name} em diferentes raças caninas`,
      authors: "Martinez & Johnson",
      journal: "Comparative Veterinary Medicine",
      year: 2024,
      link: "https://doi.org/10.example/cvm.2024.05"
    },
    {
      title: `Impacto a longo prazo do ${nutraceutical.name} na progressão de ${selectedCondition.name}`,
      authors: "Williams, Lee & Patel",
      journal: "Advanced Veterinary Research",
      year: 2022,
      link: "https://doi.org/10.example/avr.2022.12"
    },
    {
      title: `Mecanismos moleculares de ${nutraceutical.activeIngredients[0]} em ${selectedCondition.name}`,
      authors: "Nakamura et al.",
      journal: "Molecular Veterinary Studies",
      year: 2023,
      link: "https://doi.org/10.example/mvs.2023.07"
    }
  ];
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Cabeçalho */}
        <div className="border-b pb-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium leading-none">
              {nutraceutical.name}
            </h2>
            <Badge className={`${getEfficacyColor(selectedCondition.efficacyScore)} px-2 py-1`}>
              {getConditionTypeTitle()}: {selectedCondition.efficacyScore.toFixed(1)}/5
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            {nutraceutical.description}
          </p>
          <div className="flex items-center mt-3 space-x-2">
            <Badge variant="outline" className="bg-slate-50">
              {selectedCondition.name}
            </Badge>
          </div>
        </div>
        
        <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab} className="mt-2">
          <TabsList className="grid grid-cols-4 mb-4">
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="efficacy">Eficácia</TabsTrigger>
            <TabsTrigger value="studies">Estudos Científicos</TabsTrigger>
            <TabsTrigger value="applications">Aplicações</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="space-y-4">
            <div>
              <h4 className="text-sm font-medium mb-2">Detalhes da Condição</h4>
              <p className="text-sm bg-slate-50 p-3 rounded-md">
                {selectedCondition.name} é uma condição que pode ser {conditionType === 'prevention' ? 'prevenida' : conditionType === 'treatment' ? 'tratada' : 'apoiada'} com 
                {' '}{nutraceutical.name}, através dos seguintes mecanismos de ação:
              </p>
              <ul className="list-disc pl-5 space-y-1 mt-3">
                {nutraceutical.benefits.map((benefit, index) => (
                  <li key={index} className="text-sm">{benefit}</li>
                ))}
              </ul>
            </div>
            
            <div>
              <h4 className="text-sm font-medium mb-2">Princípios Ativos Relevantes</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {nutraceutical.activeIngredients.map((ingredient, index) => (
                  <div key={index} className="flex items-center p-3 border rounded-md bg-white">
                    <div className="h-2 w-2 rounded-full bg-primary mr-2"></div>
                    <span>{ingredient}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium mb-2">Dosagem Recomendada para {selectedCondition.name}</h4>
              <p className="text-sm bg-slate-50 p-3 rounded-md border">
                {nutraceutical.dosage}
              </p>
            </div>
          </TabsContent>
          
          <TabsContent value="efficacy" className="space-y-4">
            <div>
              <h4 className="text-sm font-medium mb-2">Eficácia ao Longo do Tempo</h4>
              <p className="text-xs text-gray-500 mb-2">
                Progressão da eficácia de {nutraceutical.name} para {conditionType === 'prevention' ? 'prevenção' : conditionType === 'treatment' ? 'tratamento' : 'suporte'} de {selectedCondition.name}
              </p>
              <div className="h-64 w-full">
                <ChartContainer config={{
                  eficácia: { color: "#9b87f5" }
                }}>
                  <LineChart
                    data={efficacyOverTimeData}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis domain={[0, 5]} />
                    <Tooltip />
                    <Line 
                      type="monotone" 
                      dataKey="eficácia" 
                      stroke="#9b87f5" 
                      activeDot={{ r: 8 }} 
                    />
                  </LineChart>
                </ChartContainer>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium mb-2">Comparação por Estágio de Vida</h4>
              <p className="text-xs text-gray-500 mb-2">
                Eficácia comparativa de {nutraceutical.name} vs. média de outros nutracêuticos para {selectedCondition.name}
              </p>
              <div className="h-64 w-full">
                <ChartContainer config={{
                  [nutraceutical.name]: { color: "#9b87f5" },
                  'Média outras opções': { color: "#C8C8C9" }
                }}>
                  <BarChart
                    data={comparativeEfficacyData}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="categoria" />
                    <YAxis domain={[0, 5]} />
                    <Tooltip />
                    <ChartLegend />
                    <Bar dataKey={nutraceutical.name} fill="#9b87f5" />
                    <Bar dataKey="Média outras opções" fill="#C8C8C9" />
                  </BarChart>
                </ChartContainer>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="studies" className="space-y-4">
            <div>
              <h4 className="text-sm font-medium mb-2">
                Estudos Científicos Específicos para {selectedCondition.name}
              </h4>
              <div className="space-y-3">
                {relevantStudies.map((study, idx) => (
                  <div key={idx} className="border rounded-md p-3 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start">
                      <FileText className="h-5 w-5 text-blue-500 mr-2 mt-0.5 flex-shrink-0" />
                      <div>
                        <h5 className="font-medium text-sm">{study.title}</h5>
                        <p className="text-xs text-gray-500 mt-1">
                          {study.authors} • {study.journal} • {study.year}
                        </p>
                        <div className="mt-2">
                          <a 
                            href={study.link} 
                            target="_blank" 
                            rel="noreferrer" 
                            className="text-xs text-blue-500 hover:underline inline-flex items-center"
                          >
                            Ver estudo <ExternalLink className="h-3 w-3 ml-1" />
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <h4 className="text-sm font-medium mb-2">Estudos do Nutracêutico</h4>
              <div className="space-y-3">
                {nutraceutical.scientificEvidence.studies.map((study, idx) => (
                  <div key={idx} className="border rounded-md p-3 bg-slate-50">
                    <h5 className="font-medium text-sm">{study.title}</h5>
                    <div className="mt-2">
                      <a 
                        href={study.link} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="text-xs text-blue-500 hover:underline inline-flex items-center"
                      >
                        Ver estudo ({study.year}) <ExternalLink className="h-3 w-3 ml-1" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="applications" className="space-y-4">
            <div>
              <h4 className="text-sm font-medium mb-2">Indicações Clínicas para {selectedCondition.name}</h4>
              <div className="bg-slate-50 p-3 rounded-md text-sm">
                <p>
                  O uso de {nutraceutical.name} é especialmente recomendado para {conditionType === 'prevention' ? 'prevenção' : conditionType === 'treatment' ? 'tratamento' : 'suporte'} 
                  de {selectedCondition.name} nas seguintes situações:
                </p>
                <ul className="list-disc pl-5 space-y-1 mt-2">
                  <li>Quadros {conditionType === 'prevention' ? 'iniciais com fatores de risco' : conditionType === 'treatment' ? 'diagnosticados' : 'em fase de recuperação'}</li>
                  <li>Pacientes com {conditionType === 'prevention' ? 'predisposição genética' : conditionType === 'treatment' ? 'manifestações clínicas' : 'necessidade de suporte nutricional'}</li>
                  <li>Como parte de {conditionType === 'prevention' ? 'estratégias preventivas' : conditionType === 'treatment' ? 'protocolos terapêuticos' : 'terapias complementares'}</li>
                </ul>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium mb-2">Protocolos de Administração</h4>
              <div className="bg-slate-50 p-3 rounded-md text-sm">
                <p className="font-medium mb-1">Protocolo padrão:</p>
                <p>{nutraceutical.dosage}</p>
                
                <p className="font-medium mt-3 mb-1">Protocolo específico para {selectedCondition.name}:</p>
                <p>
                  {conditionType === 'prevention' 
                    ? `Administrar ${nutraceutical.dosage.toLowerCase()} por 3 meses, avaliar e continuar por mais 9 meses.` 
                    : conditionType === 'treatment' 
                      ? `Iniciar com dose de ataque (${nutraceutical.dosage.split(' ')[0]} dobrada) por 2 semanas, seguido de dose padrão por 3-6 meses.`
                      : `Administrar ${nutraceutical.dosage.toLowerCase()} continuamente durante todo o período de convalescença.`}
                </p>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium mb-2">Contraindicações</h4>
              <ul className="list-disc pl-5 space-y-1 bg-slate-50 p-3 rounded-md">
                {nutraceutical.contraindications.map((c, i) => (
                  <li key={i} className="text-sm">{c}</li>
                ))}
              </ul>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default ConditionDetailDialog;
