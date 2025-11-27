
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { NtaiAnalysisResult } from '@/types/ntai';
import { Badge } from "@/components/ui/badge";
import NtaiNutraceuticalsTab from './results/NtaiNutraceuticalsTab';
import NtaiConditionsTab from './results/NtaiConditionsTab';
import NtaiInteractionsTab from './results/NtaiInteractionsTab';
import NtaiSideEffectsTab from './results/NtaiSideEffectsTab';
import NtaiMechanismsTab from './results/NtaiMechanismsTab';
import NtaiSynergiesTab from './results/NtaiSynergiesTab';
import NtaiDosagesTab from './results/NtaiDosagesTab';
import NtaiClinicalTab from './results/NtaiClinicalTab';
import EvidenceTag from '../../tags/EvidenceTag';
import EnhancedStudyVisualization from '../visualization/EnhancedStudyVisualization';
import DocumentChatInterface from '../chat/DocumentChatInterface';
import { MessageCircle, BarChart3, Atom, Sparkles, Pill, Activity } from 'lucide-react';

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
        <TabsList className="grid grid-cols-5 w-full mb-2">
          <TabsTrigger value="stage1">
            Stage 1: Entidades
          </TabsTrigger>
          <TabsTrigger value="stage2">
            <Atom className="h-4 w-4 mr-1" />
            Stage 2: Mecanismos
          </TabsTrigger>
          <TabsTrigger value="stage3">
            <Pill className="h-4 w-4 mr-1" />
            Stage 3: Clínico
          </TabsTrigger>
          <TabsTrigger value="visualizations">
            <BarChart3 className="h-4 w-4 mr-1" />
            Visualizações
          </TabsTrigger>
          <TabsTrigger value="chat">
            <MessageCircle className="h-4 w-4 mr-1" />
            Chat
          </TabsTrigger>
        </TabsList>

        {/* Stage 1: Basic Entities */}
        <TabsContent value="stage1" className="space-y-4">
          <Tabs defaultValue="nutraceuticals">
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
            <TabsContent value="nutraceuticals" className="p-4 border rounded-md mt-2">
              <NtaiNutraceuticalsTab nutraceuticals={result.extractedNutraceuticals} />
            </TabsContent>
            <TabsContent value="conditions" className="p-4 border rounded-md mt-2">
              <NtaiConditionsTab conditions={result.extractedConditions} />
            </TabsContent>
            <TabsContent value="interactions" className="p-4 border rounded-md mt-2">
              <NtaiInteractionsTab interactions={result.extractedInteractions} />
            </TabsContent>
            <TabsContent value="side-effects" className="p-4 border rounded-md mt-2">
              <NtaiSideEffectsTab sideEffects={result.extractedSideEffects} />
            </TabsContent>
          </Tabs>
        </TabsContent>

        {/* Stage 2: Molecular Mechanisms */}
        <TabsContent value="stage2" className="space-y-4">
          <Tabs defaultValue="mechanisms">
            <TabsList className="grid grid-cols-2 w-full">
              <TabsTrigger value="mechanisms">
                <Atom className="h-4 w-4 mr-1" />
                Mecanismos ({result.molecularMechanisms?.length || 0})
              </TabsTrigger>
              <TabsTrigger value="synergies">
                <Sparkles className="h-4 w-4 mr-1" />
                Sinergias ({result.synergies?.length || 0})
              </TabsTrigger>
            </TabsList>
            <TabsContent value="mechanisms" className="p-4 border rounded-md mt-2">
              <NtaiMechanismsTab mechanisms={result.molecularMechanisms || []} />
            </TabsContent>
            <TabsContent value="synergies" className="p-4 border rounded-md mt-2">
              <NtaiSynergiesTab synergies={result.synergies || []} />
            </TabsContent>
          </Tabs>
        </TabsContent>

        {/* Stage 3: Clinical Context */}
        <TabsContent value="stage3" className="space-y-4">
          <Tabs defaultValue="dosages">
            <TabsList className="grid grid-cols-2 w-full">
              <TabsTrigger value="dosages">
                <Pill className="h-4 w-4 mr-1" />
                Dosagens ({result.dosages?.length || 0})
              </TabsTrigger>
              <TabsTrigger value="clinical">
                <Activity className="h-4 w-4 mr-1" />
                Desfechos ({result.clinicalOutcomes?.length || 0})
              </TabsTrigger>
            </TabsList>
            <TabsContent value="dosages" className="p-4 border rounded-md mt-2">
              <NtaiDosagesTab dosages={result.dosages || []} />
            </TabsContent>
            <TabsContent value="clinical" className="p-4 border rounded-md mt-2">
              <NtaiClinicalTab 
                outcomes={result.clinicalOutcomes || []} 
                assessment={result.studyAssessment}
              />
            </TabsContent>
          </Tabs>
        </TabsContent>

        <TabsContent value="visualizations" className="p-4 border rounded-md">
          <EnhancedStudyVisualization 
            study={{ 
              id: result.studyId,
              analysis_data: result,
              created_at: new Date().toISOString()
            }}
            extractedData={result}
          />
        </TabsContent>
        <TabsContent value="chat" className="p-4 border rounded-md">
          <DocumentChatInterface 
            studyId={result.studyId}
            studyTitle={`Estudo ${result.studyId.substring(0, 8)}`}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default NtaiAnalysisResults;
