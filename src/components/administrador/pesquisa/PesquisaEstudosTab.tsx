
import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PesquisaEstudosHeader from './estudos/PesquisaEstudosHeader';
import PesquisaEstudosResults from './estudos/PesquisaEstudosResults';
import PesquisaEstudosFiltros from './estudos/PesquisaEstudosFiltros';
import PesquisaSalvas from './estudos/PesquisaSalvas';
import EstudosMarcados from './estudos/EstudosMarcados';
import { useToast } from '@/hooks/use-toast';
import { simulateEstudoSearch } from './estudos/utils/searchSimulation';

export interface EstudoResultado {
  id: string;
  title: string;
  authors: string[];
  journal: string;
  publishDate: string;
  abstract: string;
  metrics: {
    relevancia: number;
    metodologia: number;
    impacto: number;
    originalidade: number;
  };
  tags: string[];
  url: string;
  source: string;
  fullTextAvailable: boolean;
}

export interface BuscaSalva {
  id: string;
  nome: string;
  termos: string;
  filtros: Record<string, any>;
  dataCriacao: string;
  resultadosTotal: number;
}

const PesquisaEstudosTab: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('buscar');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [searchResults, setSearchResults] = useState<EstudoResultado[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [buscasSalvas, setBuscasSalvas] = useState<BuscaSalva[]>([]);
  const [estudosMarcados, setEstudosMarcados] = useState<EstudoResultado[]>([]);
  const [filtrosAtivos, setFiltrosAtivos] = useState<Record<string, any>>({});
  
  const { toast } = useToast();

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      toast({
        title: "Campo de busca vazio",
        description: "Por favor, digite um termo para buscar",
        variant: "destructive",
      });
      return;
    }

    setIsSearching(true);
    try {
      // Simulação de busca - em produção, seria uma chamada de API real
      const resultados = await simulateEstudoSearch(searchTerm, filtrosAtivos);
      setSearchResults(resultados);
      
      toast({
        title: "Busca concluída",
        description: `${resultados.length} estudos encontrados`,
      });
    } catch (error) {
      console.error("Erro na busca:", error);
      toast({
        title: "Erro na busca",
        description: "Não foi possível completar a busca. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  };

  const salvarBusca = () => {
    if (!searchTerm.trim()) {
      toast({
        title: "Campo de busca vazio",
        description: "Por favor, digite um termo para salvar a busca",
        variant: "destructive",
      });
      return;
    }
    
    const novaBusca: BuscaSalva = {
      id: `busca-${Date.now()}`,
      nome: `Busca: ${searchTerm.substring(0, 30)}${searchTerm.length > 30 ? '...' : ''}`,
      termos: searchTerm,
      filtros: filtrosAtivos,
      dataCriacao: new Date().toISOString(),
      resultadosTotal: searchResults.length,
    };
    
    setBuscasSalvas(prev => [...prev, novaBusca]);
    
    toast({
      title: "Busca salva",
      description: "Esta busca foi salva e pode ser acessada posteriormente",
    });
  };

  const marcarEstudo = (estudo: EstudoResultado) => {
    if (estudosMarcados.some(e => e.id === estudo.id)) {
      setEstudosMarcados(prev => prev.filter(e => e.id !== estudo.id));
      toast({
        title: "Estudo removido",
        description: "O estudo foi removido dos itens marcados",
      });
    } else {
      setEstudosMarcados(prev => [...prev, estudo]);
      toast({
        title: "Estudo marcado",
        description: "O estudo foi adicionado aos itens marcados para análise posterior",
      });
    }
  };

  const carregarBuscaSalva = (busca: BuscaSalva) => {
    setSearchTerm(busca.termos);
    setFiltrosAtivos(busca.filtros);
    setActiveTab('buscar');
    
    toast({
      title: "Busca carregada",
      description: "Os termos da busca foram restaurados. Clique em Buscar para executá-la novamente.",
    });
  };

  const removerBuscaSalva = (id: string) => {
    setBuscasSalvas(prev => prev.filter(busca => busca.id !== id));
    toast({
      title: "Busca removida",
      description: "A busca salva foi removida com sucesso",
    });
  };

  const handleFiltrosChange = (filtros: Record<string, any>) => {
    setFiltrosAtivos(filtros);
  };

  return (
    <div className="space-y-6">
      <PesquisaEstudosHeader />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full border-b">
          <TabsTrigger value="buscar">Buscar Estudos</TabsTrigger>
          <TabsTrigger value="salvas">Buscas Salvas</TabsTrigger>
          <TabsTrigger value="marcados">Estudos Marcados</TabsTrigger>
        </TabsList>
        
        <TabsContent value="buscar" className="pt-4">
          <div className="flex flex-col lg:flex-row gap-6">
            <div className="w-full lg:w-3/4">
              <div className="flex flex-col gap-6">
                <div className="flex items-center gap-4">
                  <input
                    type="text"
                    placeholder="Busque por termo, autor, nutracêutico, condição de saúde..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  />
                  <button 
                    className="bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 inline-flex items-center justify-center rounded-md text-sm font-medium"
                    onClick={handleSearch}
                    disabled={isSearching}
                  >
                    {isSearching ? 'Buscando...' : 'Buscar'}
                  </button>
                  {searchResults.length > 0 && (
                    <button 
                      className="border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2 inline-flex items-center justify-center rounded-md text-sm font-medium"
                      onClick={salvarBusca}
                    >
                      Salvar Busca
                    </button>
                  )}
                </div>
                
                <PesquisaEstudosResults 
                  resultados={searchResults} 
                  isSearching={isSearching} 
                  onMarcarEstudo={marcarEstudo}
                  estudosMarcados={estudosMarcados}
                />
              </div>
            </div>
            
            <div className="w-full lg:w-1/4">
              <PesquisaEstudosFiltros 
                filtros={filtrosAtivos} 
                onFiltrosChange={handleFiltrosChange} 
              />
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="salvas" className="pt-4">
          <PesquisaSalvas 
            buscasSalvas={buscasSalvas} 
            onCarregarBusca={carregarBuscaSalva}
            onRemoverBusca={removerBuscaSalva} 
          />
        </TabsContent>
        
        <TabsContent value="marcados" className="pt-4">
          <EstudosMarcados 
            estudosMarcados={estudosMarcados} 
            onRemoverEstudo={(id) => marcarEstudo(estudosMarcados.find(e => e.id === id)!)} 
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PesquisaEstudosTab;
