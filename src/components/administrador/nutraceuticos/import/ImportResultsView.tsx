
import React, { useState } from 'react';
import { 
  Check, 
  AlertTriangle, 
  FileSpreadsheet, 
  ChevronDown, 
  ChevronRight,
  Database
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useToast } from '@/hooks/use-toast';
import { NutraceuticalsService } from '@/services/nutraceuticals-service';
import EvidenceTag from '@/components/administrador/tags/EvidenceTag';
import { getEfficacyColor } from '@/rules/general/evidence-levels';

interface ProcessedNutraceutical {
  name: string;
  description: string;
  category: string;
  conditions: Array<{
    name: string;
    efficacyScores: {
      prevention: number;
      treatment: number;
      support: number;
    };
  }>;
}

interface ImportResults {
  nutraceuticals: ProcessedNutraceutical[];
  originalFileName: string;
  processedAt: string;
  nutraceuticalsCount: number;
  conditionsCount: number;
  relationsCount: number;
  warnings: string[];
}

interface ImportResultsViewProps {
  results: ImportResults;
  onImport: () => void;
  onCancel: () => void;
}

const ImportResultsView: React.FC<ImportResultsViewProps> = ({
  results,
  onImport,
  onCancel
}) => {
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [expandedNutraceuticals, setExpandedNutraceuticals] = useState<string[]>([]);
  const { toast } = useToast();
  
  const toggleExpand = (name: string) => {
    if (expandedNutraceuticals.includes(name)) {
      setExpandedNutraceuticals(expandedNutraceuticals.filter(n => n !== name));
    } else {
      setExpandedNutraceuticals([...expandedNutraceuticals, name]);
    }
  };
  
  const handleImport = async () => {
    setImporting(true);
    setProgress(0);
    
    try {
      // Simulação de progresso
      const interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 95) {
            clearInterval(interval);
            return 95;
          }
          return prev + Math.random() * 5;
        });
      }, 200);
      
      // Aqui implementaríamos a criação real dos nutracêuticos
      // usando os serviços existentes
      
      // Para demonstração, simularemos uma pausa
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      clearInterval(interval);
      setProgress(100);
      
      toast({
        title: "Importação concluída",
        description: `${results.nutraceuticalsCount} nutracêuticos e ${results.relationsCount} relações importados com sucesso.`,
      });
      
      // Chamar callback de conclusão
      setTimeout(() => {
        onImport();
      }, 1000);
      
    } catch (error: any) {
      toast({
        title: "Erro na importação",
        description: error.message || "Ocorreu um erro ao importar os dados",
        variant: "destructive",
      });
    }
  };
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center">
          <FileSpreadsheet className="h-5 w-5 mr-2" />
          Revisão de Dados Importados
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Resumo */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gray-50 p-4 rounded-md">
            <p className="text-sm text-gray-500">Nutracêuticos</p>
            <p className="text-2xl font-bold">{results.nutraceuticalsCount}</p>
          </div>
          <div className="bg-gray-50 p-4 rounded-md">
            <p className="text-sm text-gray-500">Condições de Saúde</p>
            <p className="text-2xl font-bold">{results.conditionsCount}</p>
          </div>
          <div className="bg-gray-50 p-4 rounded-md">
            <p className="text-sm text-gray-500">Relações</p>
            <p className="text-2xl font-bold">{results.relationsCount}</p>
          </div>
        </div>
        
        {/* Alertas */}
        {results.warnings && results.warnings.length > 0 && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Atenção</AlertTitle>
            <AlertDescription>
              <ul className="list-disc pl-4 space-y-1 text-sm">
                {results.warnings.map((warning, index) => (
                  <li key={index}>{warning}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}
        
        {/* Tabela de Nutracêuticos */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[300px]">Nutracêutico</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Condições</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {results.nutraceuticals.map((nutra) => {
                const isExpanded = expandedNutraceuticals.includes(nutra.name);
                
                return (
                  <React.Fragment key={nutra.name}>
                    <TableRow className="hover:bg-gray-50">
                      <TableCell className="font-medium">
                        <div className="flex items-center">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleExpand(nutra.name)}
                            className="mr-2 p-1 h-6 w-6"
                          >
                            {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                          </Button>
                          {nutra.name}
                        </div>
                      </TableCell>
                      <TableCell>
                        {nutra.category ? (
                          <Badge variant="outline">{nutra.category}</Badge>
                        ) : (
                          <span className="text-gray-400 text-xs">Não definida</span>
                        )}
                      </TableCell>
                      <TableCell>{nutra.conditions.length}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" className="h-8">
                          <Database className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                    
                    {isExpanded && (
                      <TableRow>
                        <TableCell colSpan={4} className="bg-gray-50 p-0">
                          <div className="p-4 border-t">
                            <p className="text-sm text-gray-600 mb-3">{nutra.description}</p>
                            
                            <h4 className="text-sm font-medium mb-2">Condições relacionadas:</h4>
                            <div className="bg-white rounded-md border overflow-hidden">
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead>Condição</TableHead>
                                    <TableHead>Prevenção</TableHead>
                                    <TableHead>Tratamento</TableHead>
                                    <TableHead>Suporte</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {nutra.conditions.map((condition, idx) => (
                                    <TableRow key={idx}>
                                      <TableCell>{condition.name}</TableCell>
                                      <TableCell>
                                        <EvidenceTag 
                                          score={condition.efficacyScores.prevention || 0} 
                                          showLabel={false}
                                        />
                                      </TableCell>
                                      <TableCell>
                                        <EvidenceTag 
                                          score={condition.efficacyScores.treatment || 0} 
                                          showLabel={false}
                                        />
                                      </TableCell>
                                      <TableCell>
                                        <EvidenceTag 
                                          score={condition.efficacyScores.support || 0} 
                                          showLabel={false}
                                        />
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                );
              })}
            </TableBody>
          </Table>
        </div>
        
        {importing && (
          <div className="space-y-2">
            <Progress value={progress} />
            <div className="flex justify-between text-xs text-gray-500">
              <span>Importando dados...</span>
              <span>{Math.round(progress)}%</span>
            </div>
          </div>
        )}
      </CardContent>
      
      <CardFooter className="flex justify-between">
        <div>
          <p className="text-xs text-gray-500">
            Arquivo original: {results.originalFileName}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onCancel} disabled={importing}>
            Cancelar
          </Button>
          <Button onClick={handleImport} disabled={importing}>
            {importing ? (
              <>
                <span className="animate-spin mr-2">●</span>
                Importando...
              </>
            ) : (
              <>
                <Check className="h-4 w-4 mr-2" />
                Confirmar Importação
              </>
            )}
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};

export default ImportResultsView;
