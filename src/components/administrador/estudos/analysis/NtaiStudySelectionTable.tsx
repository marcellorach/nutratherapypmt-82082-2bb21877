
import React from 'react';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

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
  return (
    <div className="border rounded-md overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[40px]">
              <input 
                type="checkbox"
                checked={selectedItems.length === estudos.length && estudos.length > 0}
                onChange={onSelectAll}
                className="rounded"
              />
            </TableHead>
            <TableHead>Estudo</TableHead>
            <TableHead>Fonte</TableHead>
            <TableHead>Importado</TableHead>
            <TableHead>Status</TableHead>
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
                    onChange={() => onToggleSelection(estudo.id)}
                    className="rounded"
                  />
                </TableCell>
                <TableCell>
                  <div>
                    <div className="font-medium">{estudo.title}</div>
                    {estudo.description && (
                      <div className="text-sm text-gray-500">{estudo.description}</div>
                    )}
                  </div>
                </TableCell>
                <TableCell>{estudo.journal}</TableCell>
                <TableCell className="text-sm text-gray-500">
                  {formatDistanceToNow(new Date(estudo.created_at), {
                    addSuffix: true,
                    locale: ptBR
                  })}
                </TableCell>
                <TableCell>
                  <Badge variant={estudo.kanban_status === "new" ? "default" : "outline"}>
                    {estudo.kanban_status === "new" ? "Novo" : "Em Processamento"}
                  </Badge>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                Nenhum estudo disponível para processamento
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      
      <div className="p-2 bg-gray-50 border-t flex justify-between items-center">
        <span className="text-sm text-gray-500">
          {selectedItems.length} {selectedItems.length === 1 ? 'estudo selecionado' : 'estudos selecionados'}
        </span>
        <Button 
          size="sm" 
          onClick={onAddToQueue}
          disabled={selectedItems.length === 0}
        >
          Adicionar à Fila NTAI
        </Button>
      </div>
    </div>
  );
};

export default NtaiStudySelectionTable;
