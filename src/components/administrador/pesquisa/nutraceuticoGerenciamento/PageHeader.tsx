
import React from 'react';
import { Database } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BookOpen, FileText } from 'lucide-react';

const PageHeader: React.FC = () => {
  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
      <div className="flex items-center">
        <Database className="h-8 w-8 mr-3 text-blue-600" />
        <div>
          <h1 className="text-3xl font-bold">Banco de Nutracêuticos</h1>
          <p className="text-gray-600">Gerencie e mantenha atualizado o banco de dados de nutracêuticos e estudos científicos</p>
        </div>
      </div>
      
      <div className="flex gap-2 mt-4 md:mt-0">
        <Button variant="outline" className="flex items-center">
          <BookOpen className="mr-2 h-4 w-4" />
          Exportar Dados
        </Button>
        <Button variant="outline" className="flex items-center">
          <FileText className="mr-2 h-4 w-4" />
          Relatórios
        </Button>
      </div>
    </div>
  );
};

export default PageHeader;
