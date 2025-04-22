
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Brain, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useNtaiProcessing } from '@/hooks/useNtaiProcessing';
import NtaiProcessCard from './NtaiProcessCard';
import NtaiProcessingLog from './NtaiProcessingLog';
import NtaiProcessingPhases from './NtaiProcessingPhases';
import NtaiAnalysisResults from './NtaiAnalysisResults';
import NtaiStudySelectionTable from './NtaiStudySelectionTable';
import NtaiQueueControls from './NtaiQueueControls';

interface NtaiProcessingSectionProps {
  estudos: any[];
}

const NtaiProcessingSection: React.FC<NtaiProcessingSectionProps> = ({ estudos }) => {
  const {
    processQueue,
    selectedItems,
    processingActive,
    logEntries,
    activeItemIndex,
    analysisResult,
    toggleItemSelection,
    handleSelectAll,
    addToQueue,
    clearCompleted,
    retryFailed,
    startProcessing,
  } = useNtaiProcessing();

  const [logVisible, setLogVisible] = React.useState(false);
  
  const toggleLogVisibility = () => setLogVisible(!logVisible);

  return (
    <Card>
      <CardContent className="p-6 space-y-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-purple-600" />
            <h3 className="text-lg font-medium">Processamento NTAI</h3>
            <Badge className="ml-2 bg-purple-100 text-purple-800" variant="outline">
              GPT-4.5
            </Badge>
          </div>
          <Button variant="outline" size="sm" onClick={toggleLogVisibility}>
            {logVisible ? "Ocultar Log" : "Exibir Log"}
          </Button>
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
      </CardContent>
    </Card>
  );
};

export default NtaiProcessingSection;
