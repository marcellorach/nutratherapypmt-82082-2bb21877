
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Calendar, Check, Minus, Plus, RotateCcw } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface FiltersProps {
  filtros: Record<string, any>;
  onFiltrosChange: (filtros: Record<string, any>) => void;
}

const PesquisaEstudosFiltros: React.FC<FiltersProps> = ({ filtros, onFiltrosChange }) => {
  const [locaisFiltro, setLocaisFiltro] = useState<Record<string, boolean>>({
    pubmed: filtros.pubmed || false,
    scienceDirect: filtros.scienceDirect || false,
    googleScholar: filtros.googleScholar || false,
    vetMed: filtros.vetMed || false,
  });

  const [tiposFiltro, setTiposFiltro] = useState<Record<string, boolean>>({
    rct: filtros.rct || false,
    metaAnalise: filtros.metaAnalise || false,
    revisao: filtros.revisao || false,
    casoControle: filtros.casoControle || false,
    observacional: filtros.observacional || false,
  });

  const [notaMinimaFiltro, setNotaMinimaFiltro] = useState<number>(filtros.notaMinima || 0);
  
  const [dataInicio, setDataInicio] = useState<Date | undefined>(
    filtros.dataInicio ? new Date(filtros.dataInicio) : undefined
  );
  
  const [dataFim, setDataFim] = useState<Date | undefined>(
    filtros.dataFim ? new Date(filtros.dataFim) : undefined
  );
  
  const [mostrarAvancados, setMostrarAvancados] = useState(false);
  
  useEffect(() => {
    const newFiltros = {
      ...locaisFiltro,
      ...tiposFiltro,
      notaMinima: notaMinimaFiltro,
      dataInicio: dataInicio?.toISOString(),
      dataFim: dataFim?.toISOString(),
    };
    
    onFiltrosChange(newFiltros);
  }, [locaisFiltro, tiposFiltro, notaMinimaFiltro, dataInicio, dataFim]);
  
  const limparFiltros = () => {
    setLocaisFiltro({
      pubmed: false,
      scienceDirect: false,
      googleScholar: false,
      vetMed: false,
    });
    
    setTiposFiltro({
      rct: false,
      metaAnalise: false,
      revisao: false,
      casoControle: false,
      observacional: false,
    });
    
    setNotaMinimaFiltro(0);
    setDataInicio(undefined);
    setDataFim(undefined);
  };
  
  const atualizarLocalFiltro = (key: string, checked: boolean) => {
    setLocaisFiltro(prev => ({ ...prev, [key]: checked }));
  };
  
  const atualizarTipoFiltro = (key: string, checked: boolean) => {
    setTiposFiltro(prev => ({ ...prev, [key]: checked }));
  };
  
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg">Filtros</CardTitle>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={limparFiltros}
            className="h-8 text-xs"
          >
            <RotateCcw className="h-3.5 w-3.5 mr-1" />
            Limpar
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <div>
          <h4 className="text-sm font-medium mb-3">Bases de Dados</h4>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="pubmed" 
                checked={locaisFiltro.pubmed} 
                onCheckedChange={(checked) => 
                  atualizarLocalFiltro('pubmed', checked as boolean)
                }
              />
              <label htmlFor="pubmed" className="text-sm cursor-pointer">PubMed</label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="scienceDirect" 
                checked={locaisFiltro.scienceDirect} 
                onCheckedChange={(checked) => 
                  atualizarLocalFiltro('scienceDirect', checked as boolean)
                }
              />
              <label htmlFor="scienceDirect" className="text-sm cursor-pointer">Science Direct</label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="googleScholar" 
                checked={locaisFiltro.googleScholar} 
                onCheckedChange={(checked) => 
                  atualizarLocalFiltro('googleScholar', checked as boolean)
                }
              />
              <label htmlFor="googleScholar" className="text-sm cursor-pointer">Google Scholar</label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="vetMed" 
                checked={locaisFiltro.vetMed} 
                onCheckedChange={(checked) => 
                  atualizarLocalFiltro('vetMed', checked as boolean)
                }
              />
              <label htmlFor="vetMed" className="text-sm cursor-pointer">VetMed Database</label>
            </div>
          </div>
        </div>

        <div>
          <h4 className="text-sm font-medium mb-3">Período</h4>
          <div className="flex flex-col gap-2">
            <div className="grid grid-cols-2 gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "justify-start text-left font-normal",
                      !dataInicio && "text-muted-foreground"
                    )}
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    {dataInicio ? format(dataInicio, "dd/MM/yyyy") : <span>De</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={dataInicio}
                    onSelect={setDataInicio}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
              
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "justify-start text-left font-normal",
                      !dataFim && "text-muted-foreground"
                    )}
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    {dataFim ? format(dataFim, "dd/MM/yyyy") : <span>Até</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={dataFim}
                    onSelect={setDataFim}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </div>
        
        <div>
          <h4 className="text-sm font-medium mb-3">Qualidade Mínima</h4>
          <div className="space-y-4">
            <Slider
              value={[notaMinimaFiltro]}
              min={0}
              max={5}
              step={0.5}
              onValueChange={([value]) => setNotaMinimaFiltro(value)}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>0</span>
              <span>1</span>
              <span>2</span>
              <span>3</span>
              <span>4</span>
              <span>5</span>
            </div>
            <div className="text-center text-sm font-medium">
              {notaMinimaFiltro.toFixed(1)} / 5
            </div>
          </div>
        </div>
        
        <div className="pt-2 pb-2">
          <Button 
            variant="ghost" 
            className="w-full justify-between"
            onClick={() => setMostrarAvancados(!mostrarAvancados)}
          >
            <span className="flex items-center">
              <span>Filtros avançados</span>
            </span>
            {mostrarAvancados ? (
              <Minus className="h-4 w-4" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
          </Button>
        </div>
        
        {mostrarAvancados && (
          <div className="pt-2">
            <h4 className="text-sm font-medium mb-3">Tipo de Estudo</h4>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="rct" 
                  checked={tiposFiltro.rct} 
                  onCheckedChange={(checked) => 
                    atualizarTipoFiltro('rct', checked as boolean)
                  }
                />
                <label htmlFor="rct" className="text-sm cursor-pointer">Ensaio Clínico Randomizado</label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="metaAnalise" 
                  checked={tiposFiltro.metaAnalise} 
                  onCheckedChange={(checked) => 
                    atualizarTipoFiltro('metaAnalise', checked as boolean)
                  }
                />
                <label htmlFor="metaAnalise" className="text-sm cursor-pointer">Meta-análise</label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="revisao" 
                  checked={tiposFiltro.revisao} 
                  onCheckedChange={(checked) => 
                    atualizarTipoFiltro('revisao', checked as boolean)
                  }
                />
                <label htmlFor="revisao" className="text-sm cursor-pointer">Revisão Sistemática</label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="casoControle" 
                  checked={tiposFiltro.casoControle} 
                  onCheckedChange={(checked) => 
                    atualizarTipoFiltro('casoControle', checked as boolean)
                  }
                />
                <label htmlFor="casoControle" className="text-sm cursor-pointer">Caso-controle</label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="observacional" 
                  checked={tiposFiltro.observacional} 
                  onCheckedChange={(checked) => 
                    atualizarTipoFiltro('observacional', checked as boolean)
                  }
                />
                <label htmlFor="observacional" className="text-sm cursor-pointer">Observacional</label>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PesquisaEstudosFiltros;
