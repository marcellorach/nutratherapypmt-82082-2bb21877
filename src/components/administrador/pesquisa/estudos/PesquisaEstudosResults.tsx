
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bookmark, ExternalLink, FileText, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EstudoResultado } from '../PesquisaEstudosTab';
import EstudoDetailDialog from './dialogs/EstudoDetailDialog';

interface PesquisaEstudosResultsProps {
  resultados: EstudoResultado[];
  isSearching: boolean;
  onMarcarEstudo: (estudo: EstudoResultado) => void;
  estudosMarcados: EstudoResultado[];
}

const PesquisaEstudosResults: React.FC<PesquisaEstudosResultsProps> = ({
  resultados,
  isSearching,
  onMarcarEstudo,
  estudosMarcados
}) => {
  const [estudoSelecionado, setEstudoSelecionado] = useState<EstudoResultado | null>(null);

  if (isSearching) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (resultados.length === 0) {
    return (
      <div className="flex flex-col justify-center items-center h-64 text-center">
        <FileText className="h-16 w-16 mb-4 text-gray-300" />
        <h3 className="text-lg font-semibold text-gray-500">Nenhum resultado encontrado</h3>
        <p className="text-gray-400">
          Experimente ajustar seus termos de busca ou filtros para encontrar mais estudos
        </p>
      </div>
    );
  }

  const renderQualityBadge = (value: number, label: string) => {
    let color = 'bg-red-100 text-red-800';
    if (value >= 4) color = 'bg-green-100 text-green-800';
    else if (value >= 3) color = 'bg-yellow-100 text-yellow-800';
    
    return (
      <div className="flex flex-col items-center">
        <div className={`text-xs px-2 py-1 rounded-full ${color}`}>
          {value.toFixed(1)}
        </div>
        <span className="text-xs mt-1 text-gray-500">{label}</span>
      </div>
    );
  };

  return (
    <div>
      <div className="mb-4 flex justify-between items-center">
        <h3 className="text-lg font-semibold">{resultados.length} resultados encontrados</h3>
      </div>
      
      <div className="grid grid-cols-1 gap-4">
        {resultados.map(estudo => {
          const isMarcado = estudosMarcados.some(e => e.id === estudo.id);
          
          return (
            <Card key={estudo.id} className="overflow-hidden hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle 
                      className="text-lg text-primary hover:text-primary/80 cursor-pointer" 
                      onClick={() => setEstudoSelecionado(estudo)}
                    >
                      {estudo.title}
                    </CardTitle>
                    <CardDescription className="mt-1">
                      {estudo.authors.slice(0, 3).join(', ')}
                      {estudo.authors.length > 3 ? ' et al.' : ''} • {estudo.journal} • {new Date(estudo.publishDate).getFullYear()}
                    </CardDescription>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onMarcarEstudo(estudo)}
                    className={isMarcado ? "text-primary" : "text-gray-400"}
                  >
                    <Bookmark className="h-5 w-5" />
                  </Button>
                </div>
              </CardHeader>
              
              <CardContent className="pb-2">
                <p className="text-gray-700 line-clamp-3">
                  {estudo.abstract}
                </p>
                
                <div className="flex flex-wrap gap-2 mt-3">
                  {estudo.tags.slice(0, 5).map((tag, idx) => (
                    <Badge key={idx} variant="secondary" className="font-normal">
                      {tag}
                    </Badge>
                  ))}
                  {estudo.tags.length > 5 && (
                    <Badge variant="outline" className="font-normal">
                      +{estudo.tags.length - 5}
                    </Badge>
                  )}
                </div>
              </CardContent>
              
              <CardFooter className="flex flex-col sm:flex-row justify-between pt-4 pb-4 border-t">
                <div className="flex space-x-5 mb-3 sm:mb-0">
                  {renderQualityBadge(estudo.metrics.relevancia, "Relevância")}
                  {renderQualityBadge(estudo.metrics.metodologia, "Metodologia")}
                  {renderQualityBadge(estudo.metrics.impacto, "Impacto")}
                  {renderQualityBadge(estudo.metrics.originalidade, "Originalidade")}
                </div>
                
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="flex items-center"
                    onClick={() => window.open(estudo.url, '_blank')}
                  >
                    <ExternalLink className="h-4 w-4 mr-1" />
                    Ver Original
                  </Button>
                  <Button 
                    size="sm"
                    className="flex items-center"
                    onClick={() => setEstudoSelecionado(estudo)}
                  >
                    <FileText className="h-4 w-4 mr-1" />
                    Detalhes
                  </Button>
                </div>
              </CardFooter>
            </Card>
          );
        })}
      </div>
      
      {estudoSelecionado && (
        <EstudoDetailDialog 
          estudo={estudoSelecionado} 
          open={!!estudoSelecionado}
          onOpenChange={() => setEstudoSelecionado(null)}
          onMarcarEstudo={onMarcarEstudo}
          isMarcado={estudosMarcados.some(e => e.id === estudoSelecionado.id)}
        />
      )}
    </div>
  );
};

export default PesquisaEstudosResults;
