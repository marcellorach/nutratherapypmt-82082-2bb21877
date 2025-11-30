
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
import NtaiTripletsStatsTab from './results/NtaiTripletsStatsTab';
import { MessageCircle, BarChart3, Atom, Sparkles, Pill, Activity, Network } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface NtaiAnalysisResultsProps {
  result: NtaiAnalysisResult;
}

const NtaiAnalysisResults: React.FC<NtaiAnalysisResultsProps> = ({ result }) => {
  const { t } = useTranslation();
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
          <span className="text-sm font-medium">{t('studies.ntai.analysis.labels.quality')}:</span>
          <EvidenceTag score={result.qualityScore} showLabel={true} />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{t('studies.ntai.analysis.labels.relevance')}:</span>
          <EvidenceTag score={result.relevanceScore} showLabel={true} />
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="grid grid-cols-6 w-full mb-2">
          <TabsTrigger value="stage1">
            {t('studies.ntai.analysis.stages.stage1')}
          </TabsTrigger>
          <TabsTrigger value="stage2">
            <Atom className="h-4 w-4 mr-1" />
            {t('studies.ntai.analysis.stages.stage2')}
          </TabsTrigger>
          <TabsTrigger value="stage3">
            <Pill className="h-4 w-4 mr-1" />
            {t('studies.ntai.analysis.stages.stage3')}
          </TabsTrigger>
          <TabsTrigger value="triplets">
            <Network className="h-4 w-4 mr-1" />
            {t('studies.ntai.analysis.labels.triplets')}
          </TabsTrigger>
          <TabsTrigger value="visualizations">
            <BarChart3 className="h-4 w-4 mr-1" />
            {t('studies.ntai.analysis.labels.visualizations')}
          </TabsTrigger>
          <TabsTrigger value="chat">
            <MessageCircle className="h-4 w-4 mr-1" />
            {t('studies.ntai.analysis.labels.chat')}
          </TabsTrigger>
        </TabsList>

        {/* Stage 1: Basic Entities */}
        <TabsContent value="stage1" className="space-y-4">
          <Tabs defaultValue="nutraceuticals">
            <TabsList className="grid grid-cols-4 w-full">
              <TabsTrigger value="nutraceuticals">
                {t('studies.ntai.analysis.labels.nutraceuticals')} ({result.extractedNutraceuticals.length})
              </TabsTrigger>
              <TabsTrigger value="conditions">
                {t('studies.ntai.analysis.labels.conditions')} ({result.extractedConditions.length})
              </TabsTrigger>
              <TabsTrigger value="interactions">
                {t('studies.ntai.analysis.labels.interactions')} ({result.extractedInteractions.length})
              </TabsTrigger>
              <TabsTrigger value="side-effects">
                {t('studies.ntai.analysis.labels.sideEffects')} ({result.extractedSideEffects.length})
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
                {t('studies.ntai.analysis.labels.mechanisms')} ({result.molecularMechanisms?.length || 0})
              </TabsTrigger>
              <TabsTrigger value="synergies">
                <Sparkles className="h-4 w-4 mr-1" />
                {t('studies.ntai.analysis.labels.synergies')} ({result.synergies?.length || 0})
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
                {t('studies.ntai.analysis.labels.dosages')} ({result.dosages?.length || 0})
              </TabsTrigger>
              <TabsTrigger value="clinical">
                <Activity className="h-4 w-4 mr-1" />
                {t('studies.ntai.analysis.labels.outcomes')} ({result.clinicalOutcomes?.length || 0})
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

        <TabsContent value="triplets" className="p-4 border rounded-md">
          <NtaiTripletsStatsTab studyId={result.studyId} />
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
            studyTitle={`${t('studies.ntai.analysis.labels.study')} ${result.studyId.substring(0, 8)}`}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default NtaiAnalysisResults;
