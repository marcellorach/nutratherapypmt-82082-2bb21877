
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface NtaiStudySelectionTableProps {
  estudos: any[];
  selectedItems: string[];
  onToggleSelection: (id: string) => void;
  onSelectAll: () => void;
  onAddToQueue: () => void;
}

const NtaiStudySelectionTable: React.FC<NtaiStudySelectionTableProps> = ({
  estudos,
  selectedItems,
  onToggleSelection,
  onSelectAll,
  onAddToQueue,
}) => {
  const { t } = useTranslation();
  
  // Função auxiliar para determinar o tipo de badge baseado no status
  const getBadgeVariant = (status: string) => {
    switch (status) {
      case "new": return "default";
      case "especial": return "secondary";
      case "processed": return "secondary"; // Alterado de "success" para "secondary" para compatibilidade
      default: return "outline";
    }
  };

  // Função auxiliar para formatar o texto do status
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
    console.log('Clicou em selecionar todos');
    onSelectAll();
  };

  const handleAddToQueue = () => {
    console.log('Chamando onAddToQueue com selectedItems:', selectedItems);
    onAddToQueue();
  };

  // Formatar a data para exibir "há menos de um dia"
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
          </TableRow>
        </TableHeader>
        <TableBody>
          {estudos.length > 0 ? (
            estudos.map((estudo) => (
              <TableRow key={estudo.id} className="hover:bg-gray-50">
                <TableCell>
                  <input 
                    type="checkbox"
                    checked={selectedItems.includes(estudo.id)}
                    onChange={() => {
                      console.log(`Clicou em ${estudo.id}`, estudo);
                      onToggleSelection(estudo.id);
                    }}
                    className="rounded"
                  />
                </TableCell>
                <TableCell>
                  <div>
                    <div className="font-medium">{estudo.title || `${t('studies.ntai.table.studyPrefix')} ${estudo.id.substring(0, 8)}`}</div>
                    {estudo.description && (
                      <div className="text-sm text-gray-500">{estudo.description}</div>
                    )}
                  </div>
                </TableCell>
                <TableCell>{estudo.journal || estudo.meta_summary_filename || t('studies.ntai.table.unknownSource')}</TableCell>
                <TableCell className="text-sm text-gray-500">
                  {formatTimeAgo()}
                </TableCell>
                <TableCell>
                  <Badge variant={getBadgeVariant(estudo.kanban_status || estudo.scispace_status)}>
                    {getStatusText(estudo.kanban_status || estudo.scispace_status)}
                  </Badge>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                {t('studies.ntai.table.noStudies')}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      
      <div className="p-2 bg-gray-50 border-t flex justify-between items-center">
        <span className="text-sm text-gray-500">
          {t('studies.ntai.table.selectedCount', { count: selectedItems.length })}
        </span>
        <Button 
          size="sm" 
          onClick={handleAddToQueue}
          disabled={selectedItems.length === 0}
        >
          {t('studies.ntai.table.addToQueue')}
        </Button>
      </div>
    </div>
  );
};

export default NtaiStudySelectionTable;
