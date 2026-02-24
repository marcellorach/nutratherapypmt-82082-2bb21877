
import React from 'react';
import { useTranslation } from 'react-i18next';
import { TableCell, TableRow } from "@/components/ui/table";

const EmptyState: React.FC = () => {
  const { t } = useTranslation();
  
  return (
    <TableRow>
      <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
        {t('nutraceuticals.table.emptyState')}
      </TableCell>
    </TableRow>
  );
};

export default EmptyState;
