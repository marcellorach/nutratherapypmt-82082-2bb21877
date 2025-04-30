
import React from 'react';
import { Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from "@/components/ui/button";
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import PdfFileItem from './PdfFileItem';
import { StudyPdfFile } from './types';

interface PdfFilesListProps {
  files: StudyPdfFile[];
  searchTerm: string;
  onSearchChange: (term: string) => void;
  onNutraceuticalChange: (index: number, value: string) => void;
  onConditionChange: (index: number, value: string) => void;
  onRemoveFile: (index: number) => void;
  onClearAll: () => void;
  isSubmitting: boolean;
}

const PdfFilesList: React.FC<PdfFilesListProps> = ({
  files,
  searchTerm,
  onSearchChange,
  onNutraceuticalChange,
  onConditionChange,
  onRemoveFile,
  onClearAll,
  isSubmitting
}) => {
  const filteredFiles = files.filter(file => 
    file.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (file.nutraceuticalAssociation || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (file.conditionAssociation || '').toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  if (files.length === 0) {
    return null;
  }
  
  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-sm font-medium">{files.length} arquivos</h3>
        
        <div className="flex gap-2 items-center">
          <Input
            placeholder="Filtrar arquivos..."
            className="h-8 w-60"
            value={searchTerm}
            onChange={e => onSearchChange(e.target.value)}
            disabled={isSubmitting}
          />
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={onClearAll}
                  disabled={isSubmitting}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Limpar todos os arquivos</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
      
      <div className="max-h-96 overflow-y-auto border rounded-md">
        <div className="divide-y">
          {filteredFiles.map((file, index) => (
            <PdfFileItem
              key={index}
              file={file}
              index={index}
              onNutraceuticalChange={onNutraceuticalChange}
              onConditionChange={onConditionChange}
              onRemove={onRemoveFile}
              isSubmitting={isSubmitting}
            />
          ))}
        </div>
      </div>
      
      <p className="text-xs text-gray-500 mt-2">
        {filteredFiles.length} de {files.length} arquivos exibidos
      </p>
    </>
  );
};

export default PdfFilesList;
