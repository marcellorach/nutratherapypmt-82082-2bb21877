
import React from 'react';
import { TableCell, TableRow } from "@/components/ui/table";

const EmptyState: React.FC = () => {
  return (
    <TableRow>
      <TableCell colSpan={4} className="text-center py-8 text-gray-500">
        Nenhum nutracêutico encontrado com os filtros selecionados.
      </TableCell>
    </TableRow>
  );
};

export default EmptyState;
