
import React from 'react';
import { Badge } from "@/components/ui/badge";
import { FileText, Brain, Database, CheckCircle, AlertCircle } from "lucide-react";
import { ProcessingStage } from '@/types/ntai';

interface NtaiProcessStatusProps {
  stage: ProcessingStage;
}

export const NtaiProcessStatus: React.FC<NtaiProcessStatusProps> = ({ stage }) => {
  const getStageIcon = () => {
    switch (stage) {
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
    switch (stage) {
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
    switch (stage) {
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
    <Badge className={getStatusColor()}>
      <span className="flex items-center gap-1">
        {getStageIcon()}
        {getStageLabel()}
      </span>
    </Badge>
  );
};
