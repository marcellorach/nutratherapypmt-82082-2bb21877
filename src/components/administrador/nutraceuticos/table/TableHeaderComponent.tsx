
import React from 'react';
import { TableHead, TableHeader, TableRow } from "@/components/ui/table";

const TableHeaderComponent: React.FC = () => {
  return (
    <TableHeader>
      <TableRow>
        <TableHead>Nome</TableHead>
        <TableHead>Condição de Saúde</TableHead>
        <TableHead>Evidência</TableHead>
        <TableHead className="text-right">Ações</TableHead>
      </TableRow>
    </TableHeader>
  );
};

export default TableHeaderComponent;
