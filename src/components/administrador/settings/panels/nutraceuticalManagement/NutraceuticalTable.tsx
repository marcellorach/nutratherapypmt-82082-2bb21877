
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
import { Edit, Trash2, List } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

interface NutraceuticalTableProps {
  filteredNutraceuticals: any[];
  isLoading: boolean;
  onEditClick: (nutraceutical: any) => void;
  onDeleteClick: (nutraceutical: any) => void;
  onOutcomesClick: (nutraceutical: any) => void;
  getOutcomeName: (outcomeId: string | null) => string;
}

const NutraceuticalTable: React.FC<NutraceuticalTableProps> = ({
  filteredNutraceuticals,
  isLoading,
  onEditClick,
  onDeleteClick,
  onOutcomesClick,
  getOutcomeName,
}) => {
  // Renderiza linhas de skeleton quando estiver carregando
  if (isLoading) {
    return (
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead>Outcomes</TableHead>
              <TableHead className="w-[150px]">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array(5).fill(0).map((_, index) => (
              <TableRow key={index}>
                <TableCell><Skeleton className="h-6 w-[150px]" /></TableCell>
                <TableCell><Skeleton className="h-6 w-full" /></TableCell>
                <TableCell><Skeleton className="h-6 w-[100px]" /></TableCell>
                <TableCell><Skeleton className="h-9 w-[150px]" /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  // Se não houver nutracêuticos para exibir
  if (filteredNutraceuticals.length === 0) {
    return (
      <div className="rounded-md border p-8 text-center">
        <p className="text-muted-foreground">
          Nenhum nutracêutico encontrado.
        </p>
      </div>
    );
  }

  // Renderiza a tabela com os nutracêuticos
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>Descrição</TableHead>
            <TableHead>Outcomes</TableHead>
            <TableHead className="w-[150px]">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredNutraceuticals.map((nutra) => (
            <TableRow key={nutra.id}>
              <TableCell className="font-medium">{nutra.name}</TableCell>
              <TableCell>{nutra.description?.substring(0, 100) || "-"}{nutra.description?.length > 100 ? "..." : ""}</TableCell>
              <TableCell>
                {nutra.outcome_id ? (
                  <Badge variant="outline" className="bg-blue-50">
                    {getOutcomeName(nutra.outcome_id)}
                  </Badge>
                ) : (
                  <span className="text-muted-foreground text-sm">Não definido</span>
                )}
              </TableCell>
              <TableCell>
                <div className="flex space-x-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onEditClick(nutra)}
                    title="Editar"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onOutcomesClick(nutra)}
                    title="Gerenciar Outcomes"
                  >
                    <List className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:text-destructive/90"
                    onClick={() => onDeleteClick(nutra)}
                    title="Excluir"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default NutraceuticalTable;
