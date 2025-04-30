
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, FileSpreadsheet, AlertTriangle, FileText, ArrowRightLeft } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface ImportResultsViewProps {
  results: any;
  onImport: () => void;
  onCancel: () => void;
}

// Componente para exibir a lista de nutracêuticos
const NutraceuticalsTable = ({ nutraceuticals }: { nutraceuticals: any[] }) => (
  <Card className="mt-4">
    <CardHeader className="py-4">
      <CardTitle className="text-sm font-medium">Nutracêuticos Identificados</CardTitle>
    </CardHeader>
    <CardContent className="p-0">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>Categoria</TableHead>
            <TableHead>Condições</TableHead>
            <TableHead className="text-right">Eficácia Média</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {nutraceuticals.map((nutra, idx) => (
            <TableRow key={idx}>
              <TableCell>
                <div className="font-medium">{nutra.name}</div>
                <div className="text-xs text-gray-500 truncate max-w-xs">{nutra.description}</div>
              </TableCell>
              <TableCell>{nutra.category}</TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-1">
                  {nutra.conditions.map((cond: any, cidx: number) => (
                    <Badge key={cidx} variant="outline" className="text-xs">
                      {cond.name}
                    </Badge>
                  ))}
                </div>
              </TableCell>
              <TableCell className="text-right">
                {calculateAverageEfficacy(nutra.conditions).toFixed(1)}/5
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </CardContent>
  </Card>
);

// Componente para exibir relações detalhadas
const RelationshipsTable = ({ nutraceuticals }: { nutraceuticals: any[] }) => {
  // Preparar dados de relações
  const relationships = nutraceuticals.flatMap(nutra => 
    nutra.conditions.flatMap(cond => 
      cond.relationshipTypes.map(rel => ({
        nutraceutical: nutra.name,
        condition: cond.name,
        type: rel.type,
        efficacyScore: rel.efficacyScore,
        studiesCount: rel.studies.length
      }))
    )
  );

  return (
    <Card className="mt-4">
      <CardHeader className="py-4">
        <CardTitle className="text-sm font-medium">Relações Nutracêuticos-Condições</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nutracêutico</TableHead>
              <TableHead>Condição</TableHead>
              <TableHead>Tipo de Relação</TableHead>
              <TableHead className="text-right">Eficácia</TableHead>
              <TableHead className="text-right">Estudos</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {relationships.map((rel, idx) => (
              <TableRow key={idx}>
                <TableCell>{rel.nutraceutical}</TableCell>
                <TableCell>{rel.condition}</TableCell>
                <TableCell>
                  <Badge 
                    variant={getBadgeVariant(rel.type)} 
                    className="text-xs"
                  >
                    {formatRelationType(rel.type)}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">{rel.efficacyScore.toFixed(1)}/5</TableCell>
                <TableCell className="text-right">{rel.studiesCount}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

// Componente para exibir estudos referenciados
const StudiesTable = ({ nutraceuticals }: { nutraceuticals: any[] }) => {
  // Extrair todos os estudos únicos
  const studiesMap = new Map();
  
  nutraceuticals.forEach(nutra => 
    nutra.conditions.forEach(cond => 
      cond.relationshipTypes.forEach(rel => 
        rel.studies.forEach(study => {
          const key = study.toLowerCase();
          if (!studiesMap.has(key)) {
            studiesMap.set(key, {
              name: study,
              references: [{
                nutraceutical: nutra.name,
                condition: cond.name,
                type: rel.type
              }]
            });
          } else {
            studiesMap.get(key).references.push({
              nutraceutical: nutra.name,
              condition: cond.name,
              type: rel.type
            });
          }
        })
      )
    )
  );
  
  const studies = Array.from(studiesMap.values());

  return (
    <Card className="mt-4">
      <CardHeader className="py-4">
        <CardTitle className="text-sm font-medium">Estudos Científicos Referenciados</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome do Arquivo</TableHead>
              <TableHead>Referenciado por</TableHead>
              <TableHead className="text-right">Total de Referências</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {studies.map((study, idx) => (
              <TableRow key={idx}>
                <TableCell>
                  <div className="flex items-center">
                    <FileText className="w-4 h-4 mr-2 text-blue-500" />
                    <span className="font-medium">{study.name}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1 max-w-xs">
                    {study.references.slice(0, 3).map((ref, ridx) => (
                      <Badge key={ridx} variant="outline" className="text-xs">
                        {ref.nutraceutical} → {ref.condition}
                      </Badge>
                    ))}
                    {study.references.length > 3 && (
                      <Badge variant="secondary" className="text-xs">
                        +{study.references.length - 3} mais
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-right">{study.references.length}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

// Função para calcular eficácia média
const calculateAverageEfficacy = (conditions: any[]): number => {
  if (!conditions || conditions.length === 0) return 0;
  
  const scores: number[] = [];
  conditions.forEach(cond => {
    cond.relationshipTypes?.forEach((rel: any) => {
      scores.push(rel.efficacyScore || 0);
    });
  });
  
  if (scores.length === 0) return 0;
  return scores.reduce((sum, score) => sum + score, 0) / scores.length;
};

// Funções de formatação
const formatRelationType = (type: string): string => {
  switch (type.toLowerCase()) {
    case 'prevention': return 'Prevenção';
    case 'treatment': return 'Tratamento';
    case 'support': return 'Suporte';
    default: return type;
  }
};

const getBadgeVariant = (type: string): any => {
  switch (type.toLowerCase()) {
    case 'prevention': return 'outline';
    case 'treatment': return 'secondary';
    case 'support': return 'default';
    default: return 'outline';
  }
};

const ImportResultsView: React.FC<ImportResultsViewProps> = ({ 
  results, 
  onImport, 
  onCancel 
}) => {
  const [activeTab, setActiveTab] = useState('overview');
  
  if (!results) return null;

  const { nutraceuticals, stats, warnings, recommendedActions } = results;
  
  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <FileSpreadsheet className="h-5 w-5 text-green-600" />
        <h3 className="text-lg font-medium">Resultados do Processamento</h3>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Nutracêuticos</CardTitle>
            <CardDescription>Total identificado</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats?.nutraceuticalsCount || 0}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Condições</CardTitle>
            <CardDescription>Condições de saúde únicas</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats?.conditionsCount || 0}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Relações & Estudos</CardTitle>
            <CardDescription>Relações identificadas com estudos</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <p className="text-2xl font-bold">{stats?.relationsCount || 0}</p>
              <ArrowRightLeft className="h-4 w-4 text-muted-foreground" />
              <p className="text-2xl font-bold">{stats?.studiesCount || 0}</p>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {warnings && warnings.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-md p-4">
          <div className="flex gap-2 mb-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            <h4 className="font-medium text-amber-800">Atenção</h4>
          </div>
          <ul className="space-y-1 text-sm text-amber-800">
            {warnings.map((warning, i) => (
              <li key={i} className="flex items-start gap-2">
                <span>•</span>
                <span>{warning}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full justify-start">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="nutraceuticals">Nutracêuticos</TabsTrigger>
          <TabsTrigger value="relationships">Relações</TabsTrigger>
          <TabsTrigger value="studies">Estudos</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview">
          <Card>
            <CardHeader>
              <CardTitle>Resumo da Importação</CardTitle>
              <CardDescription>
                Dados identificados a partir da planilha: {results.originalFileName || 'arquivo'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Ações Recomendadas</h4>
                  <ul className="space-y-2">
                    {recommendedActions?.map((action, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <Check className="h-4 w-4 mt-0.5 text-green-500" />
                        <span>{action}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">Estatísticas</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Nutracêuticos:</p>
                      <p className="text-lg font-medium">{stats?.nutraceuticalsCount || 0}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Condições:</p>
                      <p className="text-lg font-medium">{stats?.conditionsCount || 0}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Relações:</p>
                      <p className="text-lg font-medium">{stats?.relationsCount || 0}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Estudos:</p>
                      <p className="text-lg font-medium">{stats?.studiesCount || 0}</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="nutraceuticals">
          <NutraceuticalsTable nutraceuticals={nutraceuticals} />
        </TabsContent>
        
        <TabsContent value="relationships">
          <RelationshipsTable nutraceuticals={nutraceuticals} />
        </TabsContent>
        
        <TabsContent value="studies">
          <StudiesTable nutraceuticals={nutraceuticals} />
        </TabsContent>
      </Tabs>
      
      <div className="flex justify-end space-x-4">
        <Button variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button onClick={onImport}>
          <Check className="mr-2 h-4 w-4" /> Importar Dados
        </Button>
      </div>
    </div>
  );
};

export default ImportResultsView;
