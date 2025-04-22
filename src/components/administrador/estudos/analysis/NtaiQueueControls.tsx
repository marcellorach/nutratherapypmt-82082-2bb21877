
import React from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Database } from "lucide-react";

interface NtaiQueueControlsProps {
  queueLength: number;
  processingActive: boolean;
  hasCompletedItems: boolean;
  hasFailedItems: boolean;
  onClearCompleted: () => void;
  onRetryFailed: () => void;
  onStartProcessing: () => void;
}

const NtaiQueueControls: React.FC<NtaiQueueControlsProps> = ({
  queueLength,
  processingActive,
  hasCompletedItems,
  hasFailedItems,
  onClearCompleted,
  onRetryFailed,
  onStartProcessing,
}) => {
  return (
    <div className="flex justify-between items-center">
      <h4 className="text-sm font-medium flex items-center gap-2">
        <Database className="h-4 w-4" />
        Fila de Processamento
        {queueLength > 0 && (
          <Badge variant="outline" className="ml-2">
            {queueLength} item(s)
          </Badge>
        )}
      </h4>
      
      <div className="flex gap-2">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onClearCompleted}
          disabled={!hasCompletedItems}
        >
          Limpar Completos
        </Button>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onRetryFailed}
          disabled={!hasFailedItems}
        >
          Repetir Falhas
        </Button>
        <Button 
          size="sm" 
          onClick={onStartProcessing}
          disabled={processingActive || queueLength === 0}
        >
          Iniciar Processamento
        </Button>
      </div>
    </div>
  );
};

export default NtaiQueueControls;
