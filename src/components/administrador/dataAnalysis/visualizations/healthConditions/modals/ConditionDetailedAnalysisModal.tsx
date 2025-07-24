import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Download, Share, Bookmark } from "lucide-react";
import EpidemiologicalTree from './components/EpidemiologicalTree';
import NutraceuticalComparisonChart from './components/NutraceuticalComparisonChart';
import PredictiveSimulator from './components/PredictiveSimulator';
import EvidenceMatrix from './components/EvidenceMatrix';

interface Condition {
  id: string;
  name: string;
  description: string;
  treatabilityScore: number;
  preventionScore: number;
  roi: number;
  speciesAffected: string[];
  breedsAffected: string[];
  recommendedPackages: number;
}

interface ConditionDetailedAnalysisModalProps {
  condition: Condition | null;
  isOpen: boolean;
  onClose: () => void;
}

const ConditionDetailedAnalysisModal: React.FC<ConditionDetailedAnalysisModalProps> = ({
  condition,
  isOpen,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState("epidemiology");

  if (!condition) return null;

  // Dados específicos para obesidade como exemplo
  const isObesity = condition.name.toLowerCase().includes('obesidade');
  
  const epidemiologyData = {
    totalCases: isObesity ? 281 : Math.floor(Math.random() * 400) + 150,
    geneticOnly: isObesity ? 42 : Math.floor(Math.random() * 50) + 30,
    geneticEnvironmental: isObesity ? 30 : Math.floor(Math.random() * 40) + 25,
    environmentalOnly: isObesity ? 28 : Math.floor(Math.random() * 35) + 20,
    severityDistribution: {
      asymptomatic: isObesity ? 15 : Math.floor(Math.random() * 25) + 10,
      mild: isObesity ? 35 : Math.floor(Math.random() * 40) + 30,
      moderate: isObesity ? 35 : Math.floor(Math.random() * 40) + 25,
      severe: isObesity ? 15 : Math.floor(Math.random() * 20) + 10
    },
    comorbidities: {
      none: isObesity ? 60 : Math.floor(Math.random() * 40) + 50,
      one: isObesity ? 25 : Math.floor(Math.random() * 30) + 20,
      multiple: isObesity ? 15 : Math.floor(Math.random() * 20) + 10
    }
  };

  const nutraceuticalData = isObesity ? [
    {
      name: "L-Carnitina",
      prevention: { score: 4.2, dosage: "50mg/kg", duration: "6 meses" },
      treatment: { score: 3.8, dosage: "75mg/kg", duration: "12 meses" },
      mechanism: "Oxidação de ácidos graxos",
      evidence: "Alta"
    },
    {
      name: "Cromo",
      prevention: { score: 3.9, dosage: "0.2mg/kg", duration: "contínuo" },
      treatment: { score: 3.5, dosage: "0.3mg/kg", duration: "9 meses" },
      mechanism: "Regulação glicêmica",
      evidence: "Moderada"
    },
    {
      name: "Garcinia Cambogia",
      prevention: { score: 3.4, dosage: "25mg/kg", duration: "4 meses" },
      treatment: { score: 3.1, dosage: "40mg/kg", duration: "8 meses" },
      mechanism: "Inibição lipogênese",
      evidence: "Moderada"
    },
    {
      name: "Chá Verde (EGCG)",
      prevention: { score: 3.7, dosage: "10mg/kg", duration: "contínuo" },
      treatment: { score: 3.3, dosage: "15mg/kg", duration: "6 meses" },
      mechanism: "Termogênese",
      evidence: "Moderada"
    }
  ] : [
    {
      name: `Nutracêutico A para ${condition.name}`,
      prevention: { score: 3.5, dosage: "30mg/kg", duration: "6 meses" },
      treatment: { score: 3.2, dosage: "45mg/kg", duration: "9 meses" },
      mechanism: "Mecanismo específico",
      evidence: "Moderada"
    }
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl w-[95vw] h-[90vh] p-0">
        <div className="flex flex-col h-full">
          <DialogHeader className="p-6 pb-4 border-b flex-shrink-0">
            <div className="flex items-start justify-between">
              <div>
                <DialogTitle className="text-2xl font-bold">
                  Análise Detalhada: {condition.name}
                </DialogTitle>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="secondary">
                    {condition.speciesAffected.join(', ')}
                  </Badge>
                  <Badge variant="outline">
                    ROI: {condition.roi.toFixed(1)}
                  </Badge>
                  <Badge 
                    variant={condition.treatabilityScore >= 45 ? "default" : "secondary"}
                  >
                    Tratabilidade: {condition.treatabilityScore}%
                  </Badge>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm">
                  <Share className="h-4 w-4 mr-2" />
                  Compartilhar
                </Button>
                <Button variant="outline" size="sm">
                  <Bookmark className="h-4 w-4 mr-2" />
                  Salvar
                </Button>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Exportar PDF
                </Button>
              </div>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-hidden">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
              <TabsList className="grid w-full grid-cols-4 flex-shrink-0 mx-6 mt-4">
                <TabsTrigger value="epidemiology">Epidemiologia</TabsTrigger>
                <TabsTrigger value="nutraceuticals">Nutracêuticos</TabsTrigger>
                <TabsTrigger value="evidence">Evidências</TabsTrigger>
                <TabsTrigger value="simulator">Simulador</TabsTrigger>
              </TabsList>

              <div className="flex-1 overflow-hidden mt-4">
                <TabsContent value="epidemiology" className="h-full overflow-y-auto px-6 pb-6">
                  <EpidemiologicalTree 
                    condition={condition}
                    data={epidemiologyData}
                  />
                </TabsContent>

                <TabsContent value="nutraceuticals" className="h-full overflow-y-auto px-6 pb-6">
                  <NutraceuticalComparisonChart 
                    condition={condition}
                    nutraceuticals={nutraceuticalData}
                  />
                </TabsContent>

                <TabsContent value="evidence" className="h-full overflow-y-auto px-6 pb-6">
                  <EvidenceMatrix 
                    condition={condition}
                  />
                </TabsContent>

                <TabsContent value="simulator" className="h-full overflow-y-auto px-6 pb-6">
                  <PredictiveSimulator 
                    condition={condition}
                    nutraceuticals={nutraceuticalData}
                  />
                </TabsContent>
              </div>
            </Tabs>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ConditionDetailedAnalysisModal;