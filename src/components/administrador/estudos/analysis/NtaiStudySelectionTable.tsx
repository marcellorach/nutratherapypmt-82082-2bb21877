
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
  // Função auxiliar para determinar o tipo de badge baseado no status
  const getBadgeVariant = (status: string) => {
    switch (status) {
      case "new": return "default";
      case "especial": return "secondary";
      case "processed": return "success";
      default: return "outline";
    }
  };

  // Função auxiliar para formatar o texto do status
  const getStatusText = (status: string) => {
    switch (status) {
      case "new": return "Novo";
      case "especial": return "Especial";
      case "processed": return "Processado";
      case "in-review": return "Em Revisão";
      case "manual": return "Manual";
      default: return status || "Desconhecido";
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
    return "há menos de um dia";
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
                    onChange={() => {
                      console.log(`Clicou em ${estudo.id}`, estudo);
                      onToggleSelection(estudo.id);
                    }}
                    className="rounded"
                  />
                </TableCell>
                <TableCell>
                  <div>
                    <div className="font-medium">{estudo.title || `Estudo ${estudo.id.substring(0, 8)}`}</div>
                    {estudo.description && (
                      <div className="text-sm text-gray-500">{estudo.description}</div>
                    )}
                  </div>
                </TableCell>
                <TableCell>{estudo.journal || estudo.meta_summary_filename || 'Desconhecida'}</TableCell>
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
          onClick={handleAddToQueue}
          disabled={selectedItems.length === 0}
        >
          Adicionar à Fila NTAI
        </Button>
      </div>
    </div>
  );
};

export default NtaiStudySelectionTable;
