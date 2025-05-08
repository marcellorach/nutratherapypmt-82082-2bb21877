
import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronDown, ChevronUp, Eye, FileHeart } from "lucide-react";

interface Condition {
  id: string;
  name: string;
  description: string;
  treatabilityScore: number;
  preventionScore: number;
  speciesAffected: string[];
  breedsAffected: string[];
  recommendedPackages: number;
}

interface HealthConditionsTableProps {
  conditions: Condition[];
  isLoading: boolean;
}

const HealthConditionsTable: React.FC<HealthConditionsTableProps> = ({
  conditions,
  isLoading
}) => {
  const [expandedRows, setExpandedRows] = React.useState<Record<string, boolean>>({});
  
  const toggleRow = (id: string) => {
    setExpandedRows(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };
  
  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }
  
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[50px]"></TableHead>
            <TableHead>Nome</TableHead>
            <TableHead>Tratabilidade</TableHead>
            <TableHead>Prevenção</TableHead>
            <TableHead>Espécies Afetadas</TableHead>
            <TableHead>Pacotes Recomendados</TableHead>
            <TableHead className="w-[100px]">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {conditions.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                Nenhuma condição encontrada
              </TableCell>
            </TableRow>
          ) : (
            conditions.map(condition => (
              <React.Fragment key={condition.id}>
                <TableRow>
                  <TableCell>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => toggleRow(condition.id)}
                    >
                      {expandedRows[condition.id] ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </Button>
                  </TableCell>
                  <TableCell className="font-medium">{condition.name}</TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div 
                          className={`h-2.5 rounded-full ${
                            condition.treatabilityScore >= 75 ? "bg-green-500" : 
                            condition.treatabilityScore >= 50 ? "bg-yellow-500" : "bg-red-500"
                          }`} 
                          style={{ width: `${condition.treatabilityScore}%` }}
                        ></div>
                      </div>
                      <span className="ml-2 text-sm">{condition.treatabilityScore}%</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div 
                          className={`h-2.5 rounded-full ${
                            condition.preventionScore >= 75 ? "bg-purple-500" : 
                            condition.preventionScore >= 50 ? "bg-blue-500" : "bg-orange-500"
                          }`} 
                          style={{ width: `${condition.preventionScore}%` }}
                        ></div>
                      </div>
                      <span className="ml-2 text-sm">{condition.preventionScore}%</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {condition.speciesAffected.join(', ')}
                  </TableCell>
                  <TableCell>{condition.recommendedPackages}</TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Button variant="outline" size="icon">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="icon">
                        <FileHeart className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
                
                {expandedRows[condition.id] && (
                  <TableRow>
                    <TableCell colSpan={7} className="bg-gray-50 p-4">
                      <div className="space-y-4">
                        <div>
                          <h4 className="text-sm font-semibold">Descrição</h4>
                          <p className="text-sm text-gray-600">{condition.description}</p>
                        </div>
                        <div>
                          <h4 className="text-sm font-semibold">Raças mais afetadas</h4>
                          <p className="text-sm text-gray-600">{condition.breedsAffected.join(', ')}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <h4 className="text-sm font-semibold">Pacotes de Tratamento</h4>
                            <ul className="text-sm text-gray-600 list-disc pl-5">
                              <li>Pack Articular Premium (82% eficácia)</li>
                              <li>Pack Anti-inflamatório Plus (78% eficácia)</li>
                            </ul>
                          </div>
                          <div>
                            <h4 className="text-sm font-semibold">Pacotes de Prevenção</h4>
                            <ul className="text-sm text-gray-600 list-disc pl-5">
                              <li>Pack Preventivo Articular (92% eficácia)</li>
                              <li>Pack Suporte Imune (87% eficácia)</li>
                            </ul>
                          </div>
                        </div>
                        <div className="flex justify-end">
                          <Button variant="outline">Ver Análise Detalhada</Button>
                          <Button className="ml-2">Ver Pacotes Recomendados</Button>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </React.Fragment>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default HealthConditionsTable;
