
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Microscope } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { NtaiAnalysisResult } from '@/types/ntai';
import EvidenceTag from '../../tags/EvidenceTag';
import NtaiNutraceuticalsTab from './results/NtaiNutraceuticalsTab';
import NtaiConditionsTab from './results/NtaiConditionsTab';
import NtaiInteractionsTab from './results/NtaiInteractionsTab';
import NtaiSideEffectsTab from './results/NtaiSideEffectsTab';

interface NtaiAnalysisResultsProps {
  result: NtaiAnalysisResult;
}

const NtaiAnalysisResults: React.FC<NtaiAnalysisResultsProps> = ({ result }) => {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Microscope className="h-5 w-5 text-purple-600" />
            Resultados da Análise NTAI
          </CardTitle>
          <div className="flex items-center gap-2">
            <EvidenceTag score={result.qualityScore} />
          </div>
        </div>
        <p className="text-sm text-gray-500">
          Análise completa do estudo com tags e pontuações extraídas
        </p>
      </CardHeader>
      
      <CardContent>
        <Tabs defaultValue="nutraceuticos" className="w-full">
          <TabsList className="grid grid-cols-4 mb-4">
            <TabsTrigger value="nutraceuticos" className="text-xs">Nutracêuticos</TabsTrigger>
            <TabsTrigger value="condicoes" className="text-xs">Condições</TabsTrigger>
            <TabsTrigger value="interacoes" className="text-xs">Interações</TabsTrigger>
            <TabsTrigger value="efeitos" className="text-xs">Efeitos Colaterais</TabsTrigger>
          </TabsList>
          
          <TabsContent value="nutraceuticos">
            <NtaiNutraceuticalsTab nutraceuticals={result.extractedNutraceuticals} />
          </TabsContent>
          
          <TabsContent value="condicoes">
            <NtaiConditionsTab conditions={result.extractedConditions} />
          </TabsContent>
          
          <TabsContent value="interacoes">
            <NtaiInteractionsTab interactions={result.extractedInteractions} />
          </TabsContent>
          
          <TabsContent value="efeitos">
            <NtaiSideEffectsTab sideEffects={result.extractedSideEffects} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default NtaiAnalysisResults;
