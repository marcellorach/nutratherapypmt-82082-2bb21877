
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { 
  FileText,
  Brain, 
  Database, 
  Tags, 
  Scale, 
  Search, 
  BookOpen,
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Clock 
} from "lucide-react";
import { NtaiAnalysisStage } from '@/types/ntai';
import { Progress } from "@/components/ui/progress";
import { cn } from '@/lib/utils';

interface NtaiProcessingPhasesProps {
  stages: NtaiAnalysisStage[];
  currentStage: string;
}

const NtaiProcessingPhases: React.FC<NtaiProcessingPhasesProps> = ({ 
  stages,
  currentStage
}) => {
  const getStageIcon = (stage: NtaiAnalysisStage) => {
    if (!stage.completed && stage.name !== currentStage) {
      return <Clock className="w-5 h-5 text-gray-400" />;
    }
    
    if (stage.completed) {
      return <CheckCircle className="w-5 h-5 text-green-500" />;
    }
    
    // Current stage icon
    const StageIcon = stage.icon;
    return <StageIcon className="w-5 h-5 text-purple-500 animate-pulse" />;
  };
  
  return (
    <Card className="mb-6">
      <CardContent className="p-6">
        <h3 className="text-lg font-medium mb-4">Fases de Processamento NTAI</h3>
        
        <div className="grid grid-cols-1 gap-4">
          {stages.map((stage, index) => (
            <div 
              key={index}
              className={cn(
                "flex items-start p-3 rounded-md border transition-colors",
                stage.name === currentStage ? "bg-purple-50 border-purple-200" : 
                stage.completed ? "bg-green-50 border-green-100" : "bg-gray-50"
              )}
            >
              <div className="mr-4">
                {getStageIcon(stage)}
              </div>
              
              <div className="flex-1">
                <div className="flex justify-between mb-1">
                  <h4 className="font-medium text-sm">{stage.name}</h4>
                  <span className="text-xs font-medium">
                    {stage.completed ? "Concluído" : stage.name === currentStage ? "Em andamento" : "Pendente"}
                  </span>
                </div>
                
                <p className="text-xs text-gray-600 mb-2">{stage.description}</p>
                
                <div className="w-full">
                  <div className="flex justify-between text-xs mb-1">
                    <span>{stage.progress}%</span>
                    {stage.startTime && (
                      <span>
                        Iniciado: {stage.startTime.toLocaleTimeString()}
                      </span>
                    )}
                  </div>
                  <Progress 
                    value={stage.progress} 
                    className="h-1.5" 
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default NtaiProcessingPhases;
