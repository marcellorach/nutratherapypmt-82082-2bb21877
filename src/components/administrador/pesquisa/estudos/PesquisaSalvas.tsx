
import React from 'react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Search, Trash2, Calendar, FileText, Tag } from 'lucide-react';
import { BuscaSalva } from '../PesquisaEstudosTab';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface PesquisaSalvasProps {
  buscasSalvas: BuscaSalva[];
  onCarregarBusca: (busca: BuscaSalva) => void;
  onRemoverBusca: (id: string) => void;
}

const PesquisaSalvas: React.FC<PesquisaSalvasProps> = ({ 
  buscasSalvas, 
  onCarregarBusca, 
  onRemoverBusca 
}) => {
  if (buscasSalvas.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <Search className="h-16 w-16 mb-4 text-gray-300" />
        <h3 className="text-lg font-semibold text-gray-500">Nenhuma busca salva</h3>
        <p className="text-gray-400">
          Ao salvar buscas, você poderá acessá-las facilmente mais tarde
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {buscasSalvas.map(busca => (
        <Card key={busca.id}>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between mb-2">
              <h3 className="font-medium text-base line-clamp-1">{busca.nome}</h3>
            </div>
            
            <div className="space-y-3 mt-3">
              <div className="flex items-start gap-2">
                <Search className="h-4 w-4 text-gray-400 shrink-0 mt-0.5" />
                <p className="text-sm line-clamp-2 text-gray-600">{busca.termos}</p>
              </div>
              
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-400" />
                <p className="text-xs text-gray-600">
                  {format(new Date(busca.dataCriacao), "d 'de' MMMM 'de' yyyy", { locale: ptBR })}
                </p>
              </div>
              
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-gray-400" />
                <p className="text-xs text-gray-600">
                  {busca.resultadosTotal} {busca.resultadosTotal === 1 ? 'resultado' : 'resultados'}
                </p>
              </div>
              
              {Object.keys(busca.filtros).filter(k => busca.filtros[k] === true).length > 0 && (
                <div className="flex items-start gap-2">
                  <Tag className="h-4 w-4 text-gray-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-gray-600">
                    {Object.keys(busca.filtros)
                      .filter(k => busca.filtros[k] === true)
                      .slice(0, 3)
                      .join(', ')}
                    {Object.keys(busca.filtros).filter(k => busca.filtros[k] === true).length > 3 && '...'}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
          
          <CardFooter className="pt-2 pb-4 flex justify-between">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => onRemoverBusca(busca.id)}
              className="text-xs"
            >
              <Trash2 className="h-3.5 w-3.5 mr-1" />
              Remover
            </Button>
            <Button 
              size="sm" 
              onClick={() => onCarregarBusca(busca)}
              className="text-xs"
            >
              <Search className="h-3.5 w-3.5 mr-1" />
              Carregar
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
};

export default PesquisaSalvas;
