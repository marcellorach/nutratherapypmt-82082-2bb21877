
import React from 'react';
import { CheckCircle, AlertCircle, FileText, ArrowRight, Brain, Database } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

type ProcessingStage = 'idle' | 'extracting' | 'analyzing' | 'standardizing' | 'complete' | 'error';

interface ProcessingItem {
  id: string;
  title: string;
  stage: ProcessingStage;
  progress: number;
  error?: string;
  sourceFile?: string;
  originalFormat?: string;
}

interface NtaiProcessCardProps {
  item: ProcessingItem;
}

const NtaiProcessCard: React.FC<NtaiProcessCardProps> = ({ item }) => {
  const getStageIcon = () => {
    switch (item.stage) {
      case 'idle':
        return <FileText className="h-4 w-4 text-gray-400" />;
      case 'extracting':
        return <FileText className="h-4 w-4 text-blue-400 animate-pulse" />;
      case 'analyzing':
        return <Brain className="h-4 w-4 text-purple-400 animate-pulse" />;
      case 'standardizing':
        return <Database className="h-4 w-4 text-indigo-400 animate-pulse" />;
      case 'complete':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
    }
  };
  
  const getStageLabel = () => {
    switch (item.stage) {
      case 'idle':
        return 'Na fila';
      case 'extracting':
        return 'Extraindo texto';
      case 'analyzing':
        return 'Analisando conteúdo';
      case 'standardizing':
        return 'Padronizando formato';
      case 'complete':
        return 'Processamento concluído';
      case 'error':
        return 'Erro no processamento';
    }
  };
  
  const getStatusColor = () => {
    switch (item.stage) {
      case 'idle':
        return 'bg-gray-100 text-gray-800';
      case 'extracting':
      case 'analyzing':
      case 'standardizing':
        return 'bg-blue-100 text-blue-800';
      case 'complete':
        return 'bg-green-100 text-green-800';
      case 'error':
        return 'bg-red-100 text-red-800';
    }
  };

  return (
    <div className="border rounded-md p-4 hover:shadow-sm transition">
      <div className="flex justify-between items-start mb-3">
        <h4 className="font-medium text-sm truncate max-w-[70%]" title={item.title}>
          {item.title}
        </h4>
        <Badge className={getStatusColor()}>
          <span className="flex items-center gap-1">
            {getStageIcon()}
            {getStageLabel()}
          </span>
        </Badge>
      </div>
      
      <Progress value={item.progress} className="h-2 mb-3" />
      
      <div className="flex justify-between text-xs text-gray-500">
        <div>
          {item.sourceFile && (
            <span title={item.sourceFile}>
              Fonte: {item.sourceFile.length > 20 
                ? item.sourceFile.substring(0, 20) + '...' 
                : item.sourceFile}
            </span>
          )}
        </div>
        <div>{item.progress}%</div>
      </div>
      
      {item.error && (
        <div className="mt-2 text-xs text-red-500 bg-red-50 p-2 rounded">
          {item.error}
        </div>
      )}
      
      {item.stage === 'complete' && (
        <div className="mt-2 text-xs text-green-600 flex items-center justify-end gap-1">
          <span>Estudo padronizado disponível</span>
          <ArrowRight className="h-3 w-3" />
        </div>
      )}
    </div>
  );
};

export default NtaiProcessCard;
