
import React from 'react';
import { TableCell, TableRow } from '@/components/ui/table';

const EmptyState: React.FC = () => {
  return (
    <TableRow>
      <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
        Nenhum nutracêutico encontrado
      </TableCell>
    </TableRow>
  );
};

export default EmptyState;
