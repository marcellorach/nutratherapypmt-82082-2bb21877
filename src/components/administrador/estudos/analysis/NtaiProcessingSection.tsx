
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Brain, ArrowRight, Settings, Send } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useNtaiProcessing } from '@/hooks/ntai/useNtaiProcessing';
import { useToast } from "@/hooks/use-toast";
import NtaiProcessCard from './NtaiProcessCard';
import NtaiProcessingLog from './NtaiProcessingLog';
import NtaiAnalysisResults from './NtaiAnalysisResults';
import NtaiStudySelectionTable from './NtaiStudySelectionTable';
import NtaiQueueControls from './NtaiQueueControls';

interface NtaiProcessingSectionProps {
  estudos: any[];
}

const NtaiProcessingSection: React.FC<NtaiProcessingSectionProps> = ({ estudos }) => {
  const { toast } = useToast();
  
  const {
    processQueue,
    selectedItems,
    processingActive,
    logEntries,
    activeItemIndex,
    analysisResults,
    aiConfigs,
    toggleItemSelection,
    handleSelectAll,
    addToQueue,
    clearCompleted,
    retryFailed,
    startProcessing,
    sendToCuration
  } = useNtaiProcessing();

  const [logVisible, setLogVisible] = React.useState(false);
  
  const toggleLogVisibility = () => setLogVisible(!logVisible);

  return (
    <Card id="ntai-processing-section" className="transition-all">
      <CardContent className="p-6 space-y-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-purple-600" />
            <h3 className="text-lg font-medium">Processamento NTAI</h3>
            <Badge className="ml-2 bg-purple-100 text-purple-800" variant="outline">
              {aiConfigs.modelName || 'GPT-4o'}
            </Badge>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={toggleLogVisibility}>
              {logVisible ? "Ocultar Log" : "Exibir Log"}
            </Button>
            <Button variant="outline" size="sm" className="flex items-center gap-1">
              <Settings className="h-4 w-4" />
              <span>Configurações</span>
            </Button>
          </div>
        </div>
        
        <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
          <h4 className="text-sm font-medium mb-2">Informações do Processamento</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Modelo:</span> {aiConfigs.modelName || 'GPT-4o'}
            </div>
            <div>
              <span className="text-gray-500">Temperature:</span> {aiConfigs.temperature || '0.7'}
            </div>
            <div>
              <span className="text-gray-500">Status:</span> {processingActive ? 'Ativo' : 'Inativo'}
            </div>
          </div>
          <div className="mt-2 text-xs text-gray-500">
            Os prompts personalizados serão usados para extrair informações específicas dos estudos.
          </div>
        </div>
        
        {logVisible && <NtaiProcessingLog entries={logEntries} />}
        
        <div className="space-y-4">
          <h4 className="text-sm font-medium">Estudos Disponíveis para Processamento</h4>
          <NtaiStudySelectionTable 
            estudos={estudos}
            selectedItems={selectedItems}
            onToggleSelection={toggleItemSelection}
            onSelectAll={() => handleSelectAll(estudos)}
            onAddToQueue={() => addToQueue(estudos)}
          />
        </div>
        
        <div className="space-y-4">
          <NtaiQueueControls 
            queueLength={processQueue.length}
            processingActive={processingActive}
            hasCompletedItems={processQueue.some(item => item.stage === 'complete')}
            hasFailedItems={processQueue.some(item => item.stage === 'error')}
            onClearCompleted={clearCompleted}
            onRetryFailed={retryFailed}
            onStartProcessing={startProcessing}
          />
          
          {processQueue.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {processQueue.map((item, index) => (
                <NtaiProcessCard 
                  key={`${item.id}-${index}`} 
                  item={item} 
                  isActive={index === activeItemIndex}
                />
              ))}
            </div>
          ) : (
            <div className="border rounded-md p-8 text-center text-gray-500">
              Nenhum item na fila de processamento
            </div>
          )}
        </div>
        
        {analysisResults && analysisResults.length > 0 && (
          <div className="mt-8 space-y-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-medium">Resultados da Análise</h3>
                <ArrowRight className="h-4 w-4 text-gray-400" />
                <Badge variant="outline" className="bg-green-50 text-green-700">
                  {analysisResults.length} Cards Gerados
                </Badge>
              </div>
            </div>

            {analysisResults.map((result, index) => (
              <div key={index} className="border-t pt-4">
                <NtaiAnalysisResults analysisResult={result} />
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default NtaiProcessingSection;
