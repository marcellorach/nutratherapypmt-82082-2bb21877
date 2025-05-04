
import React from 'react';
import { Button } from "@/components/ui/button";
import { Pencil, Trash2 } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

interface NutraceuticalTableProps {
  filteredNutraceuticals: any[];
  isLoading: boolean;
  onEditClick: (nutraceutical: any) => void;
  onDeleteClick: (nutraceutical: any) => void;
  onConditionsClick: (nutraceutical: any) => void;
  getOutcomeName: (outcomeId: string | null) => string;
}

const NutraceuticalTable: React.FC<NutraceuticalTableProps> = ({
  filteredNutraceuticals,
  isLoading,
  onEditClick,
  onDeleteClick,
  onConditionsClick,
  getOutcomeName,
}) => {
  if (isLoading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>Outcome</TableHead>
            <TableHead>Descrição</TableHead>
            <TableHead>Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredNutraceuticals.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} className="text-center py-6 text-muted-foreground">
                Nenhum nutracêutico encontrado
              </TableCell>
            </TableRow>
          ) : (
            filteredNutraceuticals.map((nutraceutical) => (
              <TableRow key={nutraceutical.id}>
                <TableCell>{nutraceutical.name}</TableCell>
                <TableCell>
                  <Badge variant="outline">
                    {getOutcomeName(nutraceutical.outcome_id)}
                  </Badge>
                </TableCell>
                <TableCell className="max-w-md truncate">
                  {nutraceutical.description || "Sem descrição"}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => onConditionsClick(nutraceutical)}
                      title="Gerenciar condições"
                    >
                      Condições
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => onEditClick(nutraceutical)}
                      title="Editar"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => onDeleteClick(nutraceutical)}
                      title="Excluir"
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default NutraceuticalTable;
