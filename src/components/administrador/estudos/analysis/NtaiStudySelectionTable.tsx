
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RefreshCw, Network } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface NtaiStudySelectionTableProps {
  estudos: any[];
  selectedItems: string[];
  onToggleSelection: (id: string) => void;
  onSelectAll: () => void;
  onAddToQueue: () => void;
  onDelete: () => void;
  onRegenerateVetGraphRAG?: (studyId: string) => void;
}

const NtaiStudySelectionTable: React.FC<NtaiStudySelectionTableProps> = ({
  estudos,
  selectedItems,
  onToggleSelection,
  onSelectAll,
  onAddToQueue,
  onDelete,
  onRegenerateVetGraphRAG,
}) => {
  const { t } = useTranslation();
  
  const getBadgeVariant = (status: string) => {
    switch (status) {
      case "new": return "default";
      case "especial": return "secondary";
      case "processed": return "secondary";
      default: return "outline";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "new": return t('studies.ntai.table.statusNew');
      case "especial": return t('studies.ntai.table.statusSpecial');
      case "processed": return t('studies.ntai.table.statusProcessed');
      case "in-review": return t('studies.ntai.table.statusInReview');
      case "manual": return t('studies.ntai.table.statusManual');
      default: return status || t('studies.ntai.table.statusUnknown');
    }
  };

  const allSelected = estudos.length > 0 && selectedItems.length === estudos.length;
  
  const handleSelectAll = () => {
    onSelectAll();
  };

  const handleAddToQueue = () => {
    onAddToQueue();
  };

  const formatTimeAgo = () => {
    return t('studies.ntai.table.lessThanDay');
  };

  return (
    <div className="border rounded-md overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[40px]">
              <input 
                type="checkbox"
                checked={allSelected}
                onChange={handleSelectAll}
                className="rounded"
              />
            </TableHead>
            <TableHead>{t('studies.ntai.table.study')}</TableHead>
            <TableHead>{t('studies.ntai.table.source')}</TableHead>
            <TableHead>{t('studies.ntai.table.imported')}</TableHead>
            <TableHead>{t('studies.ntai.table.status')}</TableHead>
            <TableHead className="w-[120px]">VetGraphRAG</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {estudos.length > 0 ? (
            estudos.map((estudo) => (
              <TableRow key={estudo.id} className="hover:bg-muted/50">
                <TableCell>
                  <input 
                    type="checkbox"
                    checked={selectedItems.includes(estudo.id)}
                    onChange={() => onToggleSelection(estudo.id)}
                    className="rounded"
                  />
                </TableCell>
                <TableCell>
                  <div>
                    <div className="font-medium">{estudo.title || `${t('studies.ntai.table.studyPrefix')} ${estudo.id.substring(0, 8)}`}</div>
                    {estudo.description && (
                      <div className="text-sm text-muted-foreground">{estudo.description}</div>
                    )}
                  </div>
                </TableCell>
                <TableCell>{estudo.journal || estudo.meta_summary_filename || t('studies.ntai.table.unknownSource')}</TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {formatTimeAgo()}
                </TableCell>
                <TableCell>
                  <Badge variant={getBadgeVariant(estudo.kanban_status || estudo.scispace_status)}>
                    {getStatusText(estudo.kanban_status || estudo.scispace_status)}
                  </Badge>
                </TableCell>
                <TableCell>
                  {onRegenerateVetGraphRAG && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => onRegenerateVetGraphRAG(estudo.id)}
                            className="h-7 text-xs gap-1"
                          >
                            <Network className="h-3 w-3" />
                            <RefreshCw className="h-3 w-3" />
                            <span>{t('studies.ntai.vetGraphRAG.regenerate')}</span>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{t('studies.ntai.vetGraphRAG.regenerateTooltip')}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                {t('studies.ntai.table.noStudies')}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      
      <div className="p-2 bg-muted/50 border-t flex justify-between items-center">
        <span className="text-sm text-muted-foreground">
          {t('studies.ntai.table.selectedCount', { count: selectedItems.length })}
        </span>
        <div className="flex gap-2">
          <Button 
            size="sm" 
            onClick={handleAddToQueue}
            disabled={selectedItems.length === 0}
          >
            {t('studies.ntai.table.addToQueue')}
          </Button>
          <Button 
            size="sm" 
            onClick={onDelete}
            disabled={selectedItems.length === 0}
            variant="destructive"
          >
            {t('studies.ntai.table.deleteSelected')}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NtaiStudySelectionTable;
