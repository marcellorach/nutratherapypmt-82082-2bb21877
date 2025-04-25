
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Check, AlertTriangle, FileText, Loader2 } from "lucide-react";
import { ProcessingItem } from '@/types/ntai';

interface NtaiProcessCardProps {
  item: ProcessingItem;
  isActive: boolean;
}

const NtaiProcessCard: React.FC<NtaiProcessCardProps> = ({ item, isActive }) => {
  const getStatusIcon = () => {
    switch (item.stage) {
      case 'complete':
        return <Check className="h-5 w-5 text-green-500" />;
      case 'error':
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
      case 'extracting':
      case 'analyzing':
      case 'standardizing':
        return <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />;
      default:
        return <FileText className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusText = () => {
    switch (item.stage) {
      case 'complete':
        return 'Processado';
      case 'error':
        return 'Erro';
      case 'extracting':
        return 'Extraindo texto';
      case 'analyzing':
        return 'Analisando conteúdo';
      case 'standardizing':
        return 'Padronizando dados';
      default:
        return 'Pendente';
    }
  };

  const getBorderClass = () => {
    if (isActive) {
      return 'border-2 border-blue-300 bg-blue-50';
    }
    
    switch (item.stage) {
      case 'complete':
        return 'border-green-200';
      case 'error':
        return 'border-red-200';
      case 'extracting':
      case 'analyzing':
      case 'standardizing':
        return 'border-blue-200';
      default:
        return 'border-gray-200';
    }
  };

  return (
    <Card className={`shadow-sm transition-all ${getBorderClass()}`}>
      <CardHeader className="py-3 px-4">
        <CardTitle className="text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getStatusIcon()}
            <span className="truncate max-w-[180px]">{item.title}</span>
          </div>
          <span className="text-xs text-gray-500 font-normal">
            {getStatusText()}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="py-2 px-4 space-y-3">
        <div className="space-y-1">
          <div className="flex justify-between items-center text-xs">
            <span>{getStatusText()}</span>
            <span>{item.progress}%</span>
          </div>
          <Progress value={item.progress} className="h-2" />
        </div>
        
        {item.sourceFile && (
          <div className="text-xs text-gray-500">
            Fonte: {item.sourceFile}
          </div>
        )}
        
        {item.error && (
          <div className="p-2 bg-red-50 text-red-700 text-xs rounded border border-red-200">
            {item.error}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default NtaiProcessCard;
