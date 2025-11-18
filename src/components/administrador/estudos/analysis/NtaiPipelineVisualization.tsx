import React from 'react';
import { CheckCircle, Circle, Loader2, AlertCircle, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PipelineStage {
  name: string;
  status: 'pending' | 'processing' | 'complete' | 'error';
  description: string;
}

interface NtaiPipelineVisualizationProps {
  stages: PipelineStage[];
  currentStage?: number;
}

const NtaiPipelineVisualization: React.FC<NtaiPipelineVisualizationProps> = ({ 
  stages, 
  currentStage = -1 
}) => {
  const getStageIcon = (status: PipelineStage['status'], index: number) => {
    if (status === 'complete') {
      return <CheckCircle className="h-6 w-6 text-green-600" />;
    }
    if (status === 'processing' || index === currentStage) {
      return <Loader2 className="h-6 w-6 text-blue-600 animate-spin" />;
    }
    if (status === 'error') {
      return <AlertCircle className="h-6 w-6 text-red-600" />;
    }
    return <Circle className="h-6 w-6 text-gray-300" />;
  };

  const getStageColor = (status: PipelineStage['status'], index: number) => {
    if (status === 'complete') return 'bg-green-100 border-green-300';
    if (status === 'processing' || index === currentStage) return 'bg-blue-100 border-blue-300';
    if (status === 'error') return 'bg-red-100 border-red-300';
    return 'bg-gray-50 border-gray-200';
  };

  return (
    <div className="w-full py-6">
      <div className="flex items-center justify-between gap-2">
        {stages.map((stage, index) => (
          <React.Fragment key={index}>
            <div className="flex-1 min-w-0">
              <div
                className={cn(
                  'p-4 rounded-lg border-2 transition-all duration-300',
                  getStageColor(stage.status, index)
                )}
              >
                <div className="flex items-center gap-3 mb-2">
                  {getStageIcon(stage.status, index)}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm truncate">{stage.name}</h4>
                    <p className="text-xs text-muted-foreground truncate">
                      {stage.description}
                    </p>
                  </div>
                </div>
                <div className="text-xs font-medium">
                  {stage.status === 'complete' && (
                    <span className="text-green-700">✓ Complete</span>
                  )}
                  {stage.status === 'processing' && (
                    <span className="text-blue-700">Processing...</span>
                  )}
                  {stage.status === 'error' && (
                    <span className="text-red-700">Error</span>
                  )}
                  {stage.status === 'pending' && (
                    <span className="text-gray-500">Pending</span>
                  )}
                </div>
              </div>
            </div>
            {index < stages.length - 1 && (
              <ArrowRight className="h-5 w-5 text-gray-400 flex-shrink-0" />
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

export default NtaiPipelineVisualization;
