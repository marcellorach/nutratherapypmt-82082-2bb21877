
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Check, AlertTriangle, FileText, ChevronDown, ChevronUp } from 'lucide-react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { StudyPdfFile } from '@/components/administrador/estudos/import/PdfFileItem';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface ImportResultsViewProps {
  results: any;
  onImport: () => void;
  onCancel: () => void;
  studyFiles?: StudyPdfFile[];
}

const ImportResultsView: React.FC<ImportResultsViewProps> = ({
  results,
  onImport,
  onCancel,
  studyFiles = []
}) => {
  const [expandedNutraceutical, setExpandedNutraceutical] = useState<string | null>(null);
  
  const toggleExpand = (name: string) => {
    setExpandedNutraceutical(expandedNutraceutical === name ? null : name);
  };
  
  const formatDateString = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  return (
    <div className="space-y-6">
      <div className="bg-green-50 rounded-md p-4 flex items-start gap-3">
        <Check className="h-6 w-6 text-green-600 flex-shrink-0 mt-0.5" />
        <div>
          <h3 className="font-medium text-green-800">Dados Processados com Sucesso</h3>
          <p className="text-sm text-green-700 mt-1">
            O arquivo <span className="font-medium">{results.originalFileName}</span> foi processado em {formatDateString(results.processedAt)}.
          </p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatsCard
          title="Nutracêuticos"
          value={results.nutraceuticalsCount}
          description="nutracêuticos identificados"
        />
        <StatsCard
          title="Condições"
          value={results.conditionsCount}
          description="condições de saúde identificadas"
        />
        <StatsCard
          title="Relações"
          value={results.relationsCount}
          description="relações nutracêutico-condição encontradas"
        />
      </div>
      
      {results.warnings && results.warnings.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-md p-4">
          <div className="flex gap-2 items-center mb-2">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
            <h4 className="font-medium text-amber-800">Atenção:</h4>
          </div>
          <ul className="list-disc list-inside pl-2 space-y-1">
            {results.warnings.map((warning: string, idx: number) => (
              <li key={idx} className="text-sm text-amber-700">{warning}</li>
            ))}
          </ul>
        </div>
      )}

      <Card>
        <CardContent className="pt-6 px-6">
          <h3 className="text-lg font-medium mb-4">Nutracêuticos Identificados</h3>
          <div className="divide-y">
            {results.nutraceuticals.map((nutra: any, idx: number) => (
              <div key={idx} className="py-3">
                <Collapsible
                  open={expandedNutraceutical === nutra.name}
                >
                  <CollapsibleTrigger asChild>
                    <div
                      className="flex items-center justify-between cursor-pointer hover:bg-gray-50 p-2 rounded-md"
                      onClick={() => toggleExpand(nutra.name)}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">{nutra.name}</h4>
                          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                            {nutra.category}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-500 truncate">{nutra.description}</p>
                      </div>
                      {expandedNutraceutical === nutra.name ? (
                        <ChevronUp className="h-5 w-5 text-gray-500" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-gray-500" />
                      )}
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="pl-6 pr-2 py-3 space-y-3">
                      <div className="text-sm">
                        <span className="font-medium">Descrição:</span> {nutra.description}
                      </div>
                      
                      <div className="space-y-1">
                        <h5 className="font-medium text-sm">Condições Relacionadas:</h5>
                        <div className="grid gap-3">
                          {nutra.conditions.map((cond: any, condIdx: number) => (
                            <div key={condIdx} className="bg-gray-50 p-3 rounded-md">
                              <div className="flex justify-between items-center">
                                <h6 className="font-medium text-sm">{cond.name}</h6>
                                <div className="flex gap-1">
                                  <Badge className="bg-green-100 text-green-800 border-0">
                                    P: {cond.efficacyScores.prevention.toFixed(1)}
                                  </Badge>
                                  <Badge className="bg-blue-100 text-blue-800 border-0">
                                    T: {cond.efficacyScores.treatment.toFixed(1)}
                                  </Badge>
                                  <Badge className="bg-purple-100 text-purple-800 border-0">
                                    S: {cond.efficacyScores.support.toFixed(1)}
                                  </Badge>
                                </div>
                              </div>
                              
                              {cond.studies && cond.studies.length > 0 && (
                                <div className="mt-2">
                                  <h6 className="text-xs font-medium mb-1 text-gray-600">Estudos Associados:</h6>
                                  <ul className="text-xs space-y-1">
                                    {cond.studies.map((study: string, studyIdx: number) => (
                                      <li key={studyIdx} className="flex items-start gap-1">
                                        <FileText className="h-3 w-3 text-blue-500 mt-0.5 flex-shrink-0" />
                                        <span className="text-gray-700">{study}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </div>
            ))}
          </div>
        </CardContent>
        
        {studyFiles && studyFiles.length > 0 && (
          <div className="px-6 pb-3">
            <div className="border-t pt-3">
              <h4 className="font-medium mb-2">Arquivos de Estudos Científicos ({studyFiles.length})</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {studyFiles.map((file) => (
                  <div key={file.id} className="border rounded p-2 flex items-center gap-2">
                    <FileText className="h-4 w-4 text-blue-500" />
                    <span className="text-sm truncate">{file.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        
        <CardFooter className="border-t flex justify-end gap-2 p-4">
          <Button variant="outline" onClick={onCancel}>Cancelar</Button>
          <Button onClick={onImport}>Confirmar Importação</Button>
        </CardFooter>
      </Card>
    </div>
  );
};

// Componente para cartões de estatísticas
const StatsCard: React.FC<{ title: string; value: number; description: string }> = ({
  title,
  value,
  description
}) => (
  <div className="bg-white border rounded-md p-4 flex flex-col gap-1">
    <h4 className="text-sm text-gray-500 uppercase tracking-wide">{title}</h4>
    <div className="text-2xl font-bold">{value}</div>
    <p className="text-sm text-gray-600">{description}</p>
  </div>
);

export default ImportResultsView;
