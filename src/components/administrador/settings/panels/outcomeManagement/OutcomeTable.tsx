
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
import { Edit, Trash2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface OutcomeTableProps {
  filteredOutcomes: any[];
  isLoading: boolean;
  onEditClick: (outcome: any) => void;
  onDeleteClick: (outcome: any) => void;
}

const OutcomeTable: React.FC<OutcomeTableProps> = ({
  filteredOutcomes,
  isLoading,
  onEditClick,
  onDeleteClick,
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
              <TableHead className="w-[100px]">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array(5).fill(0).map((_, index) => (
              <TableRow key={index}>
                <TableCell><Skeleton className="h-6 w-[200px]" /></TableCell>
                <TableCell><Skeleton className="h-6 w-full" /></TableCell>
                <TableCell><Skeleton className="h-9 w-[100px]" /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  // Se não houver outcomes para exibir
  if (filteredOutcomes.length === 0) {
    return (
      <div className="rounded-md border p-8 text-center">
        <p className="text-muted-foreground">
          Nenhum outcome encontrado. Crie um novo outcome para começar.
        </p>
      </div>
    );
  }

  // Renderiza a tabela com os outcomes
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>Família</TableHead>
            <TableHead>Descrição</TableHead>
            <TableHead className="w-[100px]">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredOutcomes.map((outcome) => (
            <TableRow key={outcome.id}>
              <TableCell className="font-medium">{outcome.name}</TableCell>
              <TableCell>
                {outcome.family ? (
                  <div className="flex items-center gap-2">
                    <span>{outcome.family.icon}</span>
                    <span className="text-sm">{outcome.family.name}</span>
                  </div>
                ) : (
                  <span className="text-muted-foreground">Sem família</span>
                )}
              </TableCell>
              <TableCell>{outcome.description || "-"}</TableCell>
              <TableCell>
                <div className="flex space-x-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onEditClick(outcome)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:text-destructive/90"
                    onClick={() => onDeleteClick(outcome)}
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

export default OutcomeTable;
