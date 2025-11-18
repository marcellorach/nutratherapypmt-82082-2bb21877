
import React from 'react';
import { TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useTranslation } from 'react-i18next';

const TableHeaderComponent: React.FC = () => {
  const { t } = useTranslation();
  
  return (
    <TableHeader>
      <TableRow>
        <TableHead>{t('nutraceuticals.table.headers.name')}</TableHead>
        <TableHead>{t('nutraceuticals.table.headers.prevention')}</TableHead>
        <TableHead>{t('nutraceuticals.table.headers.treatment')}</TableHead>
        <TableHead>{t('nutraceuticals.table.headers.support')}</TableHead>
        <TableHead className="text-right">{t('nutraceuticals.table.headers.actions')}</TableHead>
      </TableRow>
    </TableHeader>
  );
};

export default TableHeaderComponent;
