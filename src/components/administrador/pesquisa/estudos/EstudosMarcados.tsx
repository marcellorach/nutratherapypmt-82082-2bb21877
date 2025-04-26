
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Bookmark, FileText, Trash2, Share2, FileUp, AlarmClock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EstudoResultado } from '../PesquisaEstudosTab';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import EstudoDetailDialog from './dialogs/EstudoDetailDialog';
import { useToast } from '@/hooks/use-toast';

interface EstudosMarcadosProps {
  estudosMarcados: EstudoResultado[];
  onRemoverEstudo: (id: string) => void;
}

const EstudosMarcados: React.FC<EstudosMarcadosProps> = ({ estudosMarcados, onRemoverEstudo }) => {
  const [visualizacao, setVisualizacao] = useState<'cards' | 'tabela'>('cards');
  const [estudoSelecionado, setEstudoSelecionado] = useState<EstudoResultado | null>(null);
  const { toast } = useToast();

  const iniciarAnaliseNtai = (ids: string[]) => {
    toast({
      title: "Análise NTAI iniciada",
      description: `${ids.length} estudos enviados para processamento`,
    });
  };

  if (estudosMarcados.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <Bookmark className="h-16 w-16 mb-4 text-gray-300" />
        <h3 className="text-lg font-semibold text-gray-500">Nenhum estudo marcado</h3>
        <p className="text-gray-400">
          Marque estudos interessantes para análise posterior
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h3 className="text-lg font-semibold">{estudosMarcados.length} estudos marcados</h3>
          <p className="text-sm text-gray-500">Analise e processe os estudos selecionados</p>
        </div>
        
        <div className="flex gap-2 flex-wrap">
          <Button 
            variant="outline"
            onClick={() => iniciarAnaliseNtai(estudosMarcados.map(e => e.id))}
            className="flex items-center"
          >
            <AlarmClock className="h-4 w-4 mr-2" />
            Agendar Análise NTAI
          </Button>
          
          <Button 
            variant="outline" 
            className="flex items-center"
          >
            <FileUp className="h-4 w-4 mr-2" />
            Exportar Selecionados
          </Button>
          
          <Button 
            variant="outline" 
            className="flex items-center"
          >
            <Share2 className="h-4 w-4 mr-2" />
            Compartilhar
          </Button>
          
          <Tabs value={visualizacao} onValueChange={(v: 'cards' | 'tabela') => setVisualizacao(v)}>
            <TabsList>
              <TabsTrigger value="cards">Cards</TabsTrigger>
              <TabsTrigger value="tabela">Tabela</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>
      
      {visualizacao === 'cards' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {estudosMarcados.map(estudo => (
            <Card key={estudo.id}>
              <CardHeader className="pb-3">
                <CardTitle 
                  className="text-base cursor-pointer hover:text-primary line-clamp-2" 
                  onClick={() => setEstudoSelecionado(estudo)}
                >
                  {estudo.title}
                </CardTitle>
              </CardHeader>
              
              <CardContent className="pb-2">
                <p className="text-sm text-gray-600 line-clamp-3">
                  {estudo.abstract}
                </p>
                
                <div className="flex items-center gap-1 mt-3 flex-wrap">
                  {estudo.tags.slice(0, 3).map((tag, idx) => (
                    <Badge key={idx} variant="secondary" className="font-normal text-xs">
                      {tag}
                    </Badge>
                  ))}
                  {estudo.tags.length > 3 && <span className="text-xs text-gray-500">+{estudo.tags.length - 3}</span>}
                </div>
                
                <div className="flex justify-between items-center mt-4">
                  <div className="flex gap-1">
                    <div className="flex items-center">
                      <span className="text-xs mr-1">Rel:</span>
                      <span className={`text-xs px-1.5 py-0.5 rounded ${getScoreColor(estudo.metrics.relevancia)}`}>
                        {estudo.metrics.relevancia.toFixed(1)}
                      </span>
                    </div>
                    <div className="flex items-center ml-1">
                      <span className="text-xs mr-1">Met:</span>
                      <span className={`text-xs px-1.5 py-0.5 rounded ${getScoreColor(estudo.metrics.metodologia)}`}>
                        {estudo.metrics.metodologia.toFixed(1)}
                      </span>
                    </div>
                  </div>
                  <div className="text-xs text-gray-500">
                    {new Date(estudo.publishDate).getFullYear()} • {estudo.source}
                  </div>
                </div>
              </CardContent>
              
              <CardFooter className="pt-3 pb-3 border-t flex justify-between">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-destructive text-xs"
                  onClick={() => onRemoverEstudo(estudo.id)}
                >
                  <Trash2 className="h-3.5 w-3.5 mr-1" />
                  Remover
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="text-xs"
                  onClick={() => setEstudoSelecionado(estudo)}
                >
                  <FileText className="h-3.5 w-3.5 mr-1" />
                  Detalhes
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <div className="rounded-md border">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-100 text-xs">
                <th className="px-4 py-3 text-left">Título</th>
                <th className="px-4 py-3 text-left">Fonte</th>
                <th className="px-4 py-3 text-center">Ano</th>
                <th className="px-4 py-3 text-center">Relevância</th>
                <th className="px-4 py-3 text-center">Metodologia</th>
                <th className="px-4 py-3 text-center">Ações</th>
              </tr>
            </thead>
            <tbody>
              {estudosMarcados.map((estudo) => (
                <tr key={estudo.id} className="border-t">
                  <td className="px-4 py-3 text-sm font-medium">
                    <div className="line-clamp-2 hover:text-primary cursor-pointer" onClick={() => setEstudoSelecionado(estudo)}>
                      {estudo.title}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs">{estudo.source}</td>
                  <td className="px-4 py-3 text-xs text-center">{new Date(estudo.publishDate).getFullYear()}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center">
                      <span className={`text-xs px-2 py-0.5 rounded ${getScoreColor(estudo.metrics.relevancia)}`}>
                        {estudo.metrics.relevancia.toFixed(1)}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center">
                      <span className={`text-xs px-2 py-0.5 rounded ${getScoreColor(estudo.metrics.metodologia)}`}>
                        {estudo.metrics.metodologia.toFixed(1)}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-1">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-7 w-7 p-0" 
                        onClick={() => setEstudoSelecionado(estudo)}
                      >
                        <FileText className="h-3.5 w-3.5" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-7 w-7 p-0 text-destructive" 
                        onClick={() => onRemoverEstudo(estudo.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {estudoSelecionado && (
        <EstudoDetailDialog 
          estudo={estudoSelecionado} 
          open={!!estudoSelecionado}
          onOpenChange={() => setEstudoSelecionado(null)}
          onMarcarEstudo={() => onRemoverEstudo(estudoSelecionado.id)}
          isMarcado={true}
        />
      )}
    </div>
  );
};

const getScoreColor = (score: number) => {
  if (score >= 4) return 'bg-green-100 text-green-800';
  if (score >= 3) return 'bg-yellow-100 text-yellow-800';
  return 'bg-red-100 text-red-800';
};

export default EstudosMarcados;
