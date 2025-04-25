
import React from 'react';
import { Button } from "@/components/ui/button";
import { Play, RefreshCcw, Trash2, Loader2 } from "lucide-react";

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
  onStartProcessing
}) => {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-gray-50 rounded-md border">
      <div className="text-sm font-medium">
        {queueLength > 0 ? (
          <>
            <span className="mr-2">Fila de processamento:</span>
            <span className="text-blue-600 font-semibold">{queueLength} {queueLength === 1 ? 'item' : 'itens'}</span>
          </>
        ) : (
          <span className="text-gray-500">Nenhum item na fila</span>
        )}
      </div>
      
      <div className="flex flex-wrap gap-2">
        {hasCompletedItems && (
          <Button 
            variant="outline" 
            size="sm"
            onClick={onClearCompleted}
          >
            <Trash2 className="w-4 h-4 mr-1" />
            Limpar Concluídos
          </Button>
        )}
        
        {hasFailedItems && (
          <Button 
            variant="outline" 
            size="sm"
            onClick={onRetryFailed}
            className="text-amber-600 border-amber-200 hover:bg-amber-50"
          >
            <RefreshCcw className="w-4 h-4 mr-1" />
            Tentar Novamente
          </Button>
        )}
        
        <Button 
          size="sm"
          onClick={onStartProcessing}
          disabled={processingActive || queueLength === 0}
          className="bg-purple-600 hover:bg-purple-700"
        >
          {processingActive ? (
            <>
              <Loader2 className="w-4 h-4 mr-1 animate-spin" />
              Processando...
            </>
          ) : (
            <>
              <Play className="w-4 h-4 mr-1" />
              Iniciar Processamento
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default NtaiQueueControls;
