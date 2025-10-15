
import React from 'react';
import { TableHead, TableHeader, TableRow } from '@/components/ui/table';

const TableHeaderComponent: React.FC = () => {
  return (
    <TableHeader>
      <TableRow>
        <TableHead>Nome</TableHead>
        <TableHead>Outcome</TableHead>
        <TableHead>Outcomes</TableHead>
        <TableHead>Estudos</TableHead>
        <TableHead>Ações</TableHead>
      </TableRow>
    </TableHeader>
  );
};

export default TableHeaderComponent;
