
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MessageCircle, BarChart3, Bug, GitPullRequest } from "lucide-react";
import EvidenceTag from '../tags/EvidenceTag';
import NutraceuticalTag from '../tags/NutraceuticalTag';
import EstudoDetailSections from '../estudos/detalhes/sections/EstudoDetailSections';
import VisaoGeralTab from '../estudos/detalhes/tabs/VisaoGeralTab';
import AnaliseTab from '../estudos/detalhes/tabs/AnaliseTab';
import PipelineDebugTab from '../estudos/detalhes/tabs/PipelineDebugTab';
import DocumentChatInterface from '../estudos/chat/DocumentChatInterface';
import EnhancedStudyVisualization from '../estudos/visualization/EnhancedStudyVisualization';
import StudyTripletCuration from '../estudos/curation/StudyTripletCuration';

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

  // ✅ Use real scores from analysis_data if available, otherwise fallback
  const analysisData = estudo.analysis_data || {};
  const studyAssessment = analysisData.study_assessment || {};
  
  const studyScores = {
    qualityScore: studyAssessment.quality_score || analysisData.qualityScore || 3.0,
    relevanceScore: studyAssessment.relevance_score || analysisData.relevanceScore || 3.0,
    noveltyScore: studyAssessment.novelty_score || analysisData.noveltyScore || 3.0,
  };
  
  // Get average score for EvidenceTag
  const avgScore = (studyScores.qualityScore + studyScores.relevanceScore + studyScores.noveltyScore) / 3;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center gap-2">
            {estudo.title}
          </DialogTitle>
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">
              {estudo.journal}, {estudo.year}
            </p>
            <div className="flex items-center gap-2">
              <EvidenceTag score={avgScore} showLabel={false} />
              {estudo.nutraceuticals?.map((nutra: string, idx: number) => {
                // Get individual nutraceutical confidence from analysis_data if available
                const nutraData = analysisData.nutraceuticals?.find((n: any) => 
                  n.name?.toLowerCase() === nutra.toLowerCase()
                );
                const nutraScore = nutraData?.efficacy_score || nutraData?.confidence || [4.2, 3.9, 3.7, 4.5][idx % 4];
                return (
                  <NutraceuticalTag 
                    key={idx} 
                    name={nutra} 
                    score={nutraScore} 
                  />
                );
              })}
            </div>
          </div>
        </DialogHeader>

        <Tabs defaultValue="overview" className="w-full" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-7">
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="analysis">Análise IA</TabsTrigger>
            <TabsTrigger value="conditions">Condições</TabsTrigger>
            <TabsTrigger value="triplets">
              <GitPullRequest className="h-4 w-4 mr-1" />
              Triplets
            </TabsTrigger>
            <TabsTrigger value="visualizations">
              <BarChart3 className="h-4 w-4 mr-1" />
              Visualizações
            </TabsTrigger>
            <TabsTrigger value="chat">
              <MessageCircle className="h-4 w-4 mr-1" />
              Chat
            </TabsTrigger>
            <TabsTrigger value="debug">
              <Bug className="h-4 w-4 mr-1" />
              Debug
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <VisaoGeralTab estudo={estudo} studyScores={studyScores} />
          </TabsContent>

          <TabsContent value="analysis">
            <AnaliseTab estudo={estudo} />
          </TabsContent>

          <TabsContent value="conditions">
            <EstudoDetailSections estudo={estudo} />
          </TabsContent>

          <TabsContent value="triplets">
            <StudyTripletCuration 
              studyId={estudo.id}
              studyTitle={estudo.title}
            />
          </TabsContent>

          <TabsContent value="visualizations">
            <EnhancedStudyVisualization 
              study={estudo}
              extractedData={estudo.analysis_data}
            />
          </TabsContent>

          <TabsContent value="chat">
            <DocumentChatInterface 
              studyId={estudo.id}
              studyTitle={estudo.title}
            />
          </TabsContent>

          <TabsContent value="debug">
            <PipelineDebugTab estudo={estudo} />
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => onOpenChange(false)}
          >
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EstudoDetailDialog;
