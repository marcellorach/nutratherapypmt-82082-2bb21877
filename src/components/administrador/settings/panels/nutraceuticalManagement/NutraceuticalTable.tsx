
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
import { NutraceuticalTableProps } from './types';
import { useTranslation } from 'react-i18next';
import { useLocalizedField } from '@/hooks/useLocalizedField';

const NutraceuticalTable: React.FC<NutraceuticalTableProps> = ({
  filteredNutraceuticals,
  isLoading,
  onEditClick,
  onDeleteClick,
  onOutcomesClick,
  getOutcomeName,
}) => {
  const { t } = useTranslation();
  const { localizedField } = useLocalizedField();
  
  // Renderiza linhas de skeleton quando estiver carregando
  if (isLoading) {
    return (
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('nutraceuticals.table.name')}</TableHead>
              <TableHead>{t('nutraceuticals.table.description')}</TableHead>
              <TableHead>{t('nutraceuticals.table.outcomes')}</TableHead>
              <TableHead className="w-[150px]">{t('nutraceuticals.table.actions')}</TableHead>
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
          {t('nutraceuticals.table.notFound')}
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
            <TableHead>{t('nutraceuticals.table.name')}</TableHead>
            <TableHead>{t('nutraceuticals.table.description')}</TableHead>
            <TableHead>{t('nutraceuticals.table.outcomes')}</TableHead>
            <TableHead className="w-[150px]">{t('nutraceuticals.table.actions')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredNutraceuticals.map((nutra) => (
            <TableRow key={nutra.id}>
              <TableCell className="font-medium">{localizedField(nutra, 'name')}</TableCell>
              <TableCell>{(localizedField(nutra, 'description') || "-").substring(0, 100)}{(localizedField(nutra, 'description') || "").length > 100 ? "..." : ""}</TableCell>
              <TableCell>
                {nutra.outcome_id ? (
                  <Badge variant="outline" className="bg-blue-50">
                    {getOutcomeName(nutra.outcome_id)}
                  </Badge>
                ) : (
                  <span className="text-muted-foreground text-sm">{t('nutraceuticals.table.notDefined')}</span>
                )}
              </TableCell>
              <TableCell>
                <div className="flex space-x-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onEditClick(nutra)}
                    title={t('nutraceuticals.table.editTitle')}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onOutcomesClick(nutra)}
                    title={t('nutraceuticals.table.manageOutcomes')}
                  >
                    <List className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:text-destructive/90"
                    onClick={() => onDeleteClick(nutra)}
                    title={t('nutraceuticals.table.deleteTitle')}
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
