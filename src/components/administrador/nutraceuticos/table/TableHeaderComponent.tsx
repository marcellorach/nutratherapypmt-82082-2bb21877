
import React from 'react';
import { TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useTranslation } from 'react-i18next';

const TableHeaderComponent: React.FC = () => {
  const { t } = useTranslation();
  
  return (
    <TableHeader>
      <TableRow>
        <TableHead>{t('research.nutraceuticals.table.headers.name')}</TableHead>
        <TableHead>{t('nutraceuticals.relations.relationshipTypes.prevention')}</TableHead>
        <TableHead>{t('nutraceuticals.relations.relationshipTypes.treatment')}</TableHead>
        <TableHead>{t('nutraceuticals.relations.relationshipTypes.support')}</TableHead>
        <TableHead className="text-right">{t('research.nutraceuticals.table.headers.actions')}</TableHead>
      </TableRow>
    </TableHeader>
  );
};

export default TableHeaderComponent;
