
import React from 'react';
import { Loader2, Link as LinkIcon } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText } from 'lucide-react';

import PdfUploadZone from './PdfUploadZone';
import PdfFilesList from './PdfFilesList';
import { usePdfProcessing } from './usePdfProcessing';

const PdfStudiesUploadSection: React.FC = () => {
  const {
    pdfFiles,
    searchTerm,
    isSubmitting,
    addFiles,
    removeFile,
    clearAllFiles,
    setSearchTerm,
    handleNutraceuticalAssociation,
    handleConditionAssociation,
    processFiles,
  } = usePdfProcessing();

  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          Upload de Estudos Científicos em PDF
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        <PdfUploadZone 
          onFilesAdded={addFiles}
          disabled={isSubmitting}
        />
        
        {pdfFiles.length > 0 && (
          <PdfFilesList
            files={pdfFiles}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            onNutraceuticalChange={handleNutraceuticalAssociation}
            onConditionChange={handleConditionAssociation}
            onRemoveFile={removeFile}
            onClearAll={clearAllFiles}
            isSubmitting={isSubmitting}
          />
        )}
      </CardContent>
      
      <CardFooter className="flex justify-between">
        <p className="text-xs text-gray-500">
          {pdfFiles.filter(file => 
            file.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (file.nutraceuticalAssociation || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (file.conditionAssociation || '').toLowerCase().includes(searchTerm.toLowerCase())
          ).length} de {pdfFiles.length} arquivos exibidos
        </p>
        <Button 
          onClick={processFiles}
          disabled={pdfFiles.length === 0 || isSubmitting}
          className="gap-2"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Processando...
            </>
          ) : (
            <>
              <LinkIcon className="h-4 w-4" />
              Processar Arquivos
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default PdfStudiesUploadSection;
