
import React from 'react';
import { TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useTranslation } from 'react-i18next';

const TableHeaderComponent: React.FC = () => {
  const { t } = useTranslation();
  
  return (
    <TableHeader>
      <TableRow>
        <TableHead>{t('nutraManagement.table.name')}</TableHead>
        <TableHead>{t('nutraManagement.table.outcome')}</TableHead>
        <TableHead>{t('nutraManagement.table.outcomes')}</TableHead>
        <TableHead>{t('nutraManagement.table.studies')}</TableHead>
        <TableHead>{t('nutraManagement.table.actions')}</TableHead>
      </TableRow>
    </TableHeader>
  );
};

export default TableHeaderComponent;
