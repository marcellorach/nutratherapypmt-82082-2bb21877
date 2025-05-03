
import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Pencil } from 'lucide-react';

interface NutraceuticosTableProps {
  nutraceuticals: any[];
  onEditClick: (nutraceutical: any) => void;
}

export const NutraceuticosTable: React.FC<NutraceuticosTableProps> = ({ 
  nutraceuticals, 
  onEditClick
}) => {
  // Função para formatar a eficácia com cores
  const getEfficacyDisplay = (score: number) => {
    const color = score >= 4 ? 'bg-green-100 text-green-800' : 
                 score >= 3 ? 'bg-yellow-100 text-yellow-800' : 
                 'bg-red-100 text-red-800';
    
    return <Badge variant="outline" className={color}>{score}</Badge>;
  };
  
  // Função para obter o nome da categoria/outcome
  const getCategoryName = (nutraceutical: any) => {
    if (!nutraceutical.outcome) return 'Sem categoria';
    return nutraceutical.outcome.name;
  };

  // Função para obter o número de condições associadas
  const getConditionsCount = (nutraceutical: any) => {
    if (!nutraceutical.conditions) return 0;
    return nutraceutical.conditions.length;
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>Categoria</TableHead>
            <TableHead className="hidden md:table-cell">Fonte</TableHead>
            <TableHead className="hidden md:table-cell">Dosagem</TableHead>
            <TableHead className="hidden md:table-cell">Eficácia</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {nutraceuticals.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="h-24 text-center">
                Nenhum resultado encontrado.
              </TableCell>
            </TableRow>
          ) : (
            nutraceuticals.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">{item.name}</TableCell>
                <TableCell>
                  <Badge variant="outline">{getCategoryName(item)}</Badge>
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  {item.source || '-'}
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  {item.dosage || '-'}
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  {item.scientific_metadata?.efficacy_score ? 
                    getEfficacyDisplay(item.scientific_metadata.efficacy_score) : '-'}
                </TableCell>
                <TableCell className="text-right">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => onEditClick(item)}
                    title="Editar nutracêutico, condições e estudos"
                  >
                    <Pencil className="h-4 w-4" />
                    <span className="sr-only">Editar</span>
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
};
