
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { NtaiAnalysisResult } from '@/types/ntai';
import { Badge } from "@/components/ui/badge";
import NtaiNutraceuticalsTab from './results/NtaiNutraceuticalsTab';
import NtaiConditionsTab from './results/NtaiConditionsTab';
import NtaiInteractionsTab from './results/NtaiInteractionsTab';
import NtaiSideEffectsTab from './results/NtaiSideEffectsTab';
import EvidenceTag from '../../tags/EvidenceTag';

interface NtaiAnalysisResultsProps {
  result: NtaiAnalysisResult;
}

const NtaiAnalysisResults: React.FC<NtaiAnalysisResultsProps> = ({ result }) => {
  const [activeTab, setActiveTab] = useState("nutraceuticals");

  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 items-center">
        <Badge variant="outline" className="bg-blue-50 text-blue-700">
          ID: {result.studyId.substring(0, 8)}
        </Badge>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Qualidade:</span>
          <EvidenceTag score={result.qualityScore} showLabel={true} />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Relevância:</span>
          <EvidenceTag score={result.relevanceScore} showLabel={true} />
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="grid grid-cols-4 w-full">
          <TabsTrigger value="nutraceuticals">
            Nutracêuticos ({result.extractedNutraceuticals.length})
          </TabsTrigger>
          <TabsTrigger value="conditions">
            Condições ({result.extractedConditions.length})
          </TabsTrigger>
          <TabsTrigger value="interactions">
            Interações ({result.extractedInteractions.length})
          </TabsTrigger>
          <TabsTrigger value="side-effects">
            Efeitos Colaterais ({result.extractedSideEffects.length})
          </TabsTrigger>
        </TabsList>
        <TabsContent value="nutraceuticals" className="p-4 border rounded-md">
          <NtaiNutraceuticalsTab nutraceuticals={result.extractedNutraceuticals} />
        </TabsContent>
        <TabsContent value="conditions" className="p-4 border rounded-md">
          <NtaiConditionsTab conditions={result.extractedConditions} />
        </TabsContent>
        <TabsContent value="interactions" className="p-4 border rounded-md">
          <NtaiInteractionsTab interactions={result.extractedInteractions} />
        </TabsContent>
        <TabsContent value="side-effects" className="p-4 border rounded-md">
          <NtaiSideEffectsTab sideEffects={result.extractedSideEffects} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default NtaiAnalysisResults;
