
import React from 'react';
import { Microscope, BookOpen, BookMarked, Search, Database } from 'lucide-react';
import { Button } from '@/components/ui/button';

const PesquisaEstudosHeader: React.FC = () => {
  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
      <div className="flex items-center">
        <Search className="h-8 w-8 mr-3 text-purple-600" />
        <div>
          <h1 className="text-3xl font-bold">Pesquisa de Estudos</h1>
          <p className="text-gray-600">Encontre e avalie os estudos científicos mais recentes e relevantes</p>
        </div>
      </div>
      
      <div className="flex gap-2 mt-4 md:mt-0">
        <Button variant="outline" className="flex items-center">
          <BookOpen className="mr-2 h-4 w-4" />
          Bases de Dados
        </Button>
        <Button variant="outline" className="flex items-center">
          <BookMarked className="mr-2 h-4 w-4" />
          Integrar Biblioteca
        </Button>
        <Button variant="outline" className="flex items-center">
          <Microscope className="mr-2 h-4 w-4" />
          Estratégias de Busca
        </Button>
        <Button variant="outline" className="flex items-center">
          <Database className="mr-2 h-4 w-4" />
          Banco de Nutracêuticos
        </Button>
      </div>
    </div>
  );
};

export default PesquisaEstudosHeader;
