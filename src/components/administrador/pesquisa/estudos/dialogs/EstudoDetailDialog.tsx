
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EstudoResultado } from '../../PesquisaEstudosTab';
import { 
  Bookmark, FileText, Download, AlertCircle, Link, Microscope, 
  Calendar, BookOpen, Users, BarChart4, CheckCircle, Clock
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface EstudoDetailDialogProps {
  estudo: EstudoResultado;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onMarcarEstudo: (estudo: EstudoResultado) => void;
  isMarcado: boolean;
}

const EstudoDetailDialog: React.FC<EstudoDetailDialogProps> = ({
  estudo,
  open,
  onOpenChange,
  onMarcarEstudo,
  isMarcado
}) => {
  const [activeTab, setActiveTab] = useState("resumo");
  const { toast } = useToast();
  
  const handleVerPdf = () => {
    toast({
      title: "Visualização do PDF",
      description: `Você será redirecionado para o PDF do estudo '${estudo.title}'`
    });
    window.open(estudo.url, '_blank');
  };
  
  const handleIniciarAnalise = () => {
    toast({
      title: "Análise NTAI iniciada",
      description: "O estudo foi enviado para processamento NTAI",
    });
  };
  
  const handleDownload = () => {
    toast({
      title: "Download iniciado",
      description: "O download do estudo foi iniciado",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">{estudo.title}</DialogTitle>
          <div className="flex flex-wrap gap-2 mt-2">
            {estudo.authors.slice(0, 3).join(', ')}
            {estudo.authors.length > 3 ? ' et al.' : ''} • {estudo.journal} • {new Date(estudo.publishDate).getFullYear()}
          </div>
        </DialogHeader>
        
        <div className="flex justify-between items-center border-b pb-4">
          <div className="flex space-x-4">
            <div className="flex flex-col items-center">
              <div className={`text-sm px-2 py-1 rounded-full ${getScoreColor(estudo.metrics.relevancia)}`}>
                {estudo.metrics.relevancia.toFixed(1)}
              </div>
              <span className="text-xs mt-1 text-gray-500">Relevância</span>
            </div>
            <div className="flex flex-col items-center">
              <div className={`text-sm px-2 py-1 rounded-full ${getScoreColor(estudo.metrics.metodologia)}`}>
                {estudo.metrics.metodologia.toFixed(1)}
              </div>
              <span className="text-xs mt-1 text-gray-500">Metodologia</span>
            </div>
            <div className="flex flex-col items-center">
              <div className={`text-sm px-2 py-1 rounded-full ${getScoreColor(estudo.metrics.impacto)}`}>
                {estudo.metrics.impacto.toFixed(1)}
              </div>
              <span className="text-xs mt-1 text-gray-500">Impacto</span>
            </div>
            <div className="flex flex-col items-center">
              <div className={`text-sm px-2 py-1 rounded-full ${getScoreColor(estudo.metrics.originalidade)}`}>
                {estudo.metrics.originalidade.toFixed(1)}
              </div>
              <span className="text-xs mt-1 text-gray-500">Originalidade</span>
            </div>
          </div>
          
          <Button
            variant={isMarcado ? "default" : "outline"}
            size="sm"
            onClick={() => onMarcarEstudo(estudo)}
            className="flex items-center"
          >
            <Bookmark className="h-4 w-4 mr-1" />
            {isMarcado ? 'Marcado' : 'Marcar'}
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="resumo">
              <FileText className="h-4 w-4 mr-1" />
              Resumo
            </TabsTrigger>
            <TabsTrigger value="metricas">
              <BarChart4 className="h-4 w-4 mr-1" />
              Métricas
            </TabsTrigger>
            <TabsTrigger value="analise">
              <Microscope className="h-4 w-4 mr-1" />
              Análise
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="resumo">
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium mb-2">Resumo</h3>
                <p className="text-gray-700 whitespace-pre-line">
                  {estudo.abstract}
                </p>
              </div>

              <div>
                <h3 className="text-lg font-medium mb-2">Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {estudo.tags.map((tag, idx) => (
                    <Badge key={idx} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-lg font-medium mb-2">Informações</h3>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      <span className="text-sm">Publicado em: {new Date(estudo.publishDate).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-4 w-4 text-gray-500" />
                      <span className="text-sm">Revista: {estudo.journal}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Users className="h-4 w-4 text-gray-500 mt-0.5" />
                      <span className="text-sm">Autores: {estudo.authors.join(', ')}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Link className="h-4 w-4 text-gray-500" />
                      <a href={estudo.url} target="_blank" rel="noreferrer" className="text-sm text-blue-600 hover:underline">
                        Link para o artigo original
                      </a>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium mb-2">Disponibilidade</h3>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-gray-500" />
                      <span className="text-sm">
                        Texto completo: {estudo.fullTextAvailable ? (
                          <span className="text-green-600 font-medium">Disponível</span>
                        ) : (
                          <span className="text-red-600 font-medium">Indisponível</span>
                        )}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-gray-500" />
                      <span className="text-sm">Fonte: {estudo.source}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="metricas">
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium mb-3">Avaliação de Qualidade</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <MetricaCard
                    titulo="Relevância"
                    valor={estudo.metrics.relevancia}
                    descricao="Quão relevante é este estudo para a área de nutracêuticos veterinários"
                    criterios={[
                      "Aborda nutracêuticos específicos de interesse",
                      "Estuda espécies animais relevantes",
                      "Foca em condições prioritárias para o projeto"
                    ]}
                  />
                  <MetricaCard
                    titulo="Metodologia"
                    valor={estudo.metrics.metodologia}
                    descricao="Quão robusto é o desenho do estudo e seus métodos"
                    criterios={[
                      "Desenho experimental apropriado",
                      "Tamanho amostral adequado",
                      "Controles apropriados",
                      "Análise estatística robusta"
                    ]}
                  />
                  <MetricaCard
                    titulo="Impacto"
                    valor={estudo.metrics.impacto}
                    descricao="Potencial de impacto destes achados na prática clínica"
                    criterios={[
                      "Demonstra eficácia clínica significativa",
                      "Resultados são aplicáveis na prática",
                      "Evidências de segurança bem documentadas"
                    ]}
                  />
                  <MetricaCard
                    titulo="Originalidade"
                    valor={estudo.metrics.originalidade}
                    descricao="Quão inovadores são os achados e abordagens"
                    criterios={[
                      "Estudo pioneiro no tópico",
                      "Nova abordagem ou métodos",
                      "Insights não previamente reportados"
                    ]}
                  />
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-medium mb-3">Comparação com a Base de Conhecimento</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm mb-4">
                    Este estudo foi comparado automaticamente com a nossa base de conhecimento existente para identificar sobreposições e novidades.
                  </p>
                  
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-medium flex items-center">
                        <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                        Nutracêuticos Analisados
                      </h4>
                      <div className="ml-6 mt-2 flex flex-wrap gap-2">
                        {estudo.tags.filter(tag => tag.toLowerCase().includes('nutra')).map((tag, idx) => (
                          <Badge key={idx} variant="outline" className="bg-green-50">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="text-sm font-medium flex items-center">
                        <CheckCircle className="h-4 w-4 text-blue-500 mr-2" />
                        Condições Relacionadas
                      </h4>
                      <div className="ml-6 mt-2 flex flex-wrap gap-2">
                        {estudo.tags.filter(tag => !tag.toLowerCase().includes('nutra')).slice(0, 5).map((tag, idx) => (
                          <Badge key={idx} variant="outline" className="bg-blue-50">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="analise">
            <div className="space-y-6">
              <div className="bg-gray-50 p-6 rounded-lg text-center">
                <Microscope className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-medium mb-2">Análise NTAI não realizada</h3>
                <p className="text-gray-500 mb-4">
                  Este estudo ainda não foi processado pelo sistema NTAI para extração detalhada de dados e integração na base de conhecimento.
                </p>
                <div className="flex justify-center gap-2">
                  <Button onClick={handleIniciarAnalise} className="flex items-center">
                    <Clock className="h-4 w-4 mr-2" />
                    Iniciar Análise NTAI
                  </Button>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-medium mb-3">Ações Disponíveis</h3>
                <div className="flex flex-wrap gap-3">
                  <Button variant="outline" onClick={handleDownload} className="flex items-center">
                    <Download className="h-4 w-4 mr-2" />
                    Baixar PDF
                  </Button>
                  
                  <Button variant="outline" onClick={handleVerPdf} className="flex items-center">
                    <FileText className="h-4 w-4 mr-2" />
                    Ver PDF
                  </Button>
                  
                  <Button 
                    variant={isMarcado ? "default" : "outline"}
                    onClick={() => onMarcarEstudo(estudo)}
                    className="flex items-center"
                  >
                    <Bookmark className="h-4 w-4 mr-2" />
                    {isMarcado ? 'Remover Marcação' : 'Marcar para Revisão'}
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

interface MetricaCardProps {
  titulo: string;
  valor: number;
  descricao: string;
  criterios: string[];
}

const MetricaCard: React.FC<MetricaCardProps> = ({ titulo, valor, descricao, criterios }) => {
  return (
    <div className="border rounded-lg p-4">
      <div className="flex justify-between items-center mb-3">
        <h4 className="font-medium">{titulo}</h4>
        <div className={`text-sm px-2.5 py-1 rounded-full ${getScoreColor(valor)}`}>
          {valor.toFixed(1)}/5.0
        </div>
      </div>
      <p className="text-sm text-gray-600 mb-3">{descricao}</p>
      <div className="space-y-1">
        {criterios.map((criterio, idx) => (
          <div key={idx} className="flex items-start text-xs">
            <div className={`w-1 h-1 rounded-full mt-1.5 mr-2 ${valor >= 3.5 ? 'bg-green-500' : 'bg-gray-400'}`} />
            <span>{criterio}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const getScoreColor = (score: number) => {
  if (score >= 4) return 'bg-green-100 text-green-800';
  if (score >= 3) return 'bg-yellow-100 text-yellow-800';
  return 'bg-red-100 text-red-800';
};

export default EstudoDetailDialog;
