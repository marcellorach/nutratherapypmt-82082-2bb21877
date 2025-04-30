
import React from 'react';
import { FileText, Trash2, AlertTriangle, Check } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { StudyPdfFile } from './types';

interface PdfFileItemProps {
  file: StudyPdfFile;
  index: number;
  onNutraceuticalChange: (index: number, value: string) => void;
  onConditionChange: (index: number, value: string) => void;
  onRemove: (index: number) => void;
  isSubmitting: boolean;
}

const PdfFileItem: React.FC<PdfFileItemProps> = ({
  file,
  index,
  onNutraceuticalChange,
  onConditionChange,
  onRemove,
  isSubmitting
}) => {
  return (
    <div className="p-3 hover:bg-gray-50">
      <div className="flex justify-between mb-2">
        <div className="flex items-center">
          <FileText className="h-5 w-5 text-blue-600 mr-2" />
          <span className="font-medium truncate max-w-xs">{file.name}</span>
          <Badge variant="outline" className="ml-2 text-xs">
            {(file.size / 1024).toFixed(1)} KB
          </Badge>
        </div>
        
        <div className="flex gap-1">
          {file.processingState === 'waiting' && (
            <Button
              size="icon"
              variant="ghost"
              onClick={() => onRemove(index)}
              disabled={isSubmitting}
            >
              <Trash2 className="h-4 w-4 text-gray-500" />
            </Button>
          )}
          
          {file.processingState === 'error' && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>{file.error || 'Erro no processamento'}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          
          {file.processingState === 'success' && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Check className="h-5 w-5 text-green-500" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Processado com sucesso</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-2 mb-2">
        <Input 
          placeholder="Nutracêutico relacionado" 
          size="sm"
          value={file.nutraceuticalAssociation || ''}
          onChange={(e) => onNutraceuticalChange(index, e.target.value)}
          disabled={file.processingState !== 'waiting' || isSubmitting}
        />
        <Input 
          placeholder="Condição de saúde" 
          size="sm"
          value={file.conditionAssociation || ''}
          onChange={(e) => onConditionChange(index, e.target.value)}
          disabled={file.processingState !== 'waiting' || isSubmitting}
        />
      </div>
      
      {(file.processingState === 'uploading' || file.processingState === 'processing') && (
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-gray-500">
            <span>{file.processingState === 'uploading' ? 'Enviando...' : 'Processando...'}</span>
            <span>{Math.round(Number(file.uploadProgress))}%</span>
          </div>
          <Progress value={Number(file.uploadProgress)} className="h-1" />
        </div>
      )}
    </div>
  );
};

export default PdfFileItem;
