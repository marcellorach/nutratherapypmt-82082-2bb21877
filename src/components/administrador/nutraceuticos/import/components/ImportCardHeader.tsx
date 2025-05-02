
import React from 'react';
import { FileSpreadsheet } from 'lucide-react';
import { CardHeader, CardTitle } from '@/components/ui/card';

const ImportCardHeader: React.FC = () => {
  return (
    <CardHeader>
      <CardTitle className="flex items-center">
        <FileSpreadsheet className="h-5 w-5 mr-2" />
        Importar Dados de Nutracêuticos
      </CardTitle>
    </CardHeader>
  );
};

export default ImportCardHeader;
