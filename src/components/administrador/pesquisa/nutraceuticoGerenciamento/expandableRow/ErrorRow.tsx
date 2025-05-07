
import React from 'react';
import { TableRow, TableCell } from '@/components/ui/table';

const ErrorRow: React.FC = () => {
  return (
    <TableRow>
      <TableCell colSpan={5}>
        <div className="text-center text-red-500">
          Erro ao exibir este nutracêutico. Dados inválidos.
        </div>
      </TableCell>
    </TableRow>
  );
};

export default ErrorRow;
