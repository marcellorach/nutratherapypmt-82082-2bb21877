
import React from 'react';
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
                <TableCell className="font-medium">{estudo.title}</TableCell>
                <TableCell>{estudo.journal}</TableCell>
                <TableCell>
                  <Badge variant={estudo.status === "new" ? "default" : "outline"}>
                    {estudo.status === "new" ? "Novo" : "Em Curadoria"}
                  </Badge>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={4} className="text-center py-8 text-gray-500">
                Nenhum estudo disponível para processamento
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      
      {estudos.length > 0 && (
        <div className="p-2 bg-gray-50 border-t flex justify-end">
          <Button 
            size="sm" 
            onClick={onAddToQueue}
            disabled={selectedItems.length === 0}
          >
            Adicionar à Fila NTAI
          </Button>
        </div>
      )}
    </div>
  );
};

export default NtaiStudySelectionTable;
