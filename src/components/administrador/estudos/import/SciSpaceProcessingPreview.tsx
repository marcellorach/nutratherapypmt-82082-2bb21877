
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { ChartBar, FileCheck, AlertTriangle } from "lucide-react";

interface SciSpaceProcessingPreviewProps {
  numFiles: number;
  onComplete: () => void;
}

const SciSpaceProcessingPreview: React.FC<SciSpaceProcessingPreviewProps> = ({ 
  numFiles, 
  onComplete 
}) => {
  const [currentStage, setCurrentStage] = useState<string>('extract');
  const [stagesComplete, setStagesComplete] = useState<Record<string, boolean>>({
    extract: false,
    analyze: false,
    merge: false,
    verify: false
  });
  const [extractedData, setExtractedData] = useState({
    studies: 0,
    references: 0,
    authors: 0,
    years: []
  });

  useEffect(() => {
    // Simular extração de metadados
    setTimeout(() => {
      const studies = Math.max(numFiles, Math.floor(Math.random() * 5) + numFiles);
      setExtractedData({
        studies: studies,
        references: studies * Math.floor(Math.random() * 15 + 5),
        authors: studies * Math.floor(Math.random() * 3 + 1),
        years: Array.from({ length: Math.min(studies, 5) }, () => 
          Math.floor(Math.random() * 10) + 2013
        ).sort()
      });
      
      setStagesComplete(prev => ({ ...prev, extract: true }));
      setCurrentStage('analyze');
      
      // Simular análise de dados
      setTimeout(() => {
        setStagesComplete(prev => ({ ...prev, analyze: true }));
        setCurrentStage('merge');
        
        // Simular mesclagem de dados
        setTimeout(() => {
          setStagesComplete(prev => ({ ...prev, merge: true }));
          setCurrentStage('verify');
          
          // Simular verificação de dados
          setTimeout(() => {
            setStagesComplete(prev => ({ ...prev, verify: true }));
            
            // Processo completo
            setTimeout(onComplete, 1000);
          }, 1000);
        }, 1500);
      }, 2000);
    }, 1500);
  }, [numFiles, onComplete]);

  const renderStageIcon = (stage: string, current: boolean) => {
    if (stagesComplete[stage]) {
      return <FileCheck className="h-5 w-5 text-green-500" />;
    } else if (current) {
      return <div className="h-5 w-5 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />;
    } else {
      return <div className="h-5 w-5 rounded-full border border-gray-300" />;
    }
  };

  return (
    <Card className="bg-slate-50 border-slate-200">
      <CardContent className="pt-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="font-medium">Processando {numFiles} arquivos</h3>
            <p className="text-sm text-gray-500">Extraindo e analisando dados</p>
          </div>
          <ChartBar className="h-8 w-8 text-blue-500 opacity-50" />
        </div>

        <div className="space-y-4">
          <div className="flex items-center space-x-3">
            {renderStageIcon('extract', currentStage === 'extract')}
            <div className="flex-1">
              <div className="flex justify-between">
                <span className="font-medium text-sm">Extração de metadados</span>
                {stagesComplete.extract && (
                  <span className="text-sm text-gray-500">{extractedData.studies} estudos</span>
                )}
              </div>
              {stagesComplete.extract && (
                <div className="mt-1 text-xs text-gray-500">
                  Extraídos {extractedData.references} referências e {extractedData.authors} autores
                </div>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            {renderStageIcon('analyze', currentStage === 'analyze')}
            <div className="flex-1">
              <div className="flex justify-between">
                <span className="font-medium text-sm">Análise IA</span>
                {stagesComplete.analyze && (
                  <span className="text-sm text-gray-500">Concluída</span>
                )}
              </div>
              {stagesComplete.analyze && (
                <div className="mt-1 text-xs text-gray-500">
                  Anos de publicação: {extractedData.years.join(", ")}
                </div>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            {renderStageIcon('merge', currentStage === 'merge')}
            <div className="flex-1">
              <div className="flex justify-between">
                <span className="font-medium text-sm">Mesclagem de dados</span>
                {stagesComplete.merge && (
                  <span className="text-sm text-gray-500">3 duplicados removidos</span>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            {renderStageIcon('verify', currentStage === 'verify')}
            <div className="flex-1">
              <div className="flex justify-between">
                <span className="font-medium text-sm">Verificação e classificação</span>
                {stagesComplete.verify && (
                  <span className="text-sm text-gray-500">Concluída</span>
                )}
              </div>
              {stagesComplete.verify && (
                <div className="mt-1 flex items-center text-xs">
                  <AlertTriangle className="h-3 w-3 text-amber-500 mr-1" /> 
                  <span className="text-amber-600">2 estudos precisam de revisão manual</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SciSpaceProcessingPreview;
