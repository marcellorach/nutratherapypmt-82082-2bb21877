
import React, { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Brain, ArrowRight, CheckCircle, AlertCircle, FileText, Database, FileCode } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import NtaiProcessCard from './NtaiProcessCard';
import NtaiProcessingLog from './NtaiProcessingLog';

interface NtaiProcessingSectionProps {
  estudos: any[];
}

type ProcessingStage = 'idle' | 'extracting' | 'analyzing' | 'standardizing' | 'complete' | 'error';

interface ProcessingItem {
  id: string;
  title: string;
  stage: ProcessingStage;
  progress: number;
  error?: string;
  sourceFile?: string;
  originalFormat?: string;
}

const NtaiProcessingSection: React.FC<NtaiProcessingSectionProps> = ({ estudos }) => {
  const [processQueue, setProcessQueue] = useState<ProcessingItem[]>([]);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [processingActive, setProcessingActive] = useState(false);
  const [logVisible, setLogVisible] = useState(false);
  const [logEntries, setLogEntries] = useState<string[]>([]);
  
  const { toast } = useToast();
  
  const toggleLogVisibility = () => {
    setLogVisible(!logVisible);
  };
  
  const toggleItemSelection = (id: string) => {
    if (selectedItems.includes(id)) {
      setSelectedItems(selectedItems.filter(itemId => itemId !== id));
    } else {
      setSelectedItems([...selectedItems, id]);
    }
  };
  
  const handleSelectAll = () => {
    if (selectedItems.length === estudos.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(estudos.map(estudo => estudo.id));
    }
  };
  
  const addToQueue = () => {
    if (selectedItems.length === 0) {
      toast({
        title: "Nenhum estudo selecionado",
        description: "Selecione pelo menos um estudo para processar.",
        variant: "destructive",
      });
      return;
    }
    
    const newItems = selectedItems.map(id => {
      const estudo = estudos.find(e => e.id === id);
      return {
        id,
        title: estudo?.title || `Estudo ${id}`,
        stage: 'idle' as ProcessingStage,
        progress: 0,
        sourceFile: estudo?.title || '',
        originalFormat: 'PDF'
      };
    });
    
    setProcessQueue([...processQueue, ...newItems]);
    setSelectedItems([]);
    
    toast({
      title: "Estudos adicionados à fila",
      description: `${newItems.length} estudos adicionados para processamento NTAI.`,
    });
  };
  
  const startProcessing = () => {
    if (processQueue.length === 0 || processingActive) return;
    
    setProcessingActive(true);
    const updatedQueue = [...processQueue];
    
    // Simulação de processamento
    const processNextItem = (index: number) => {
      if (index >= updatedQueue.length) {
        setProcessingActive(false);
        return;
      }
      
      const item = updatedQueue[index];
      if (item.stage === 'complete' || item.stage === 'error') {
        processNextItem(index + 1);
        return;
      }
      
      // Extração
      setLogEntries(prev => [...prev, `[${new Date().toLocaleTimeString()}] Iniciando extração para: ${item.title}`]);
      
      updatedQueue[index] = { ...item, stage: 'extracting', progress: 10 };
      setProcessQueue([...updatedQueue]);
      
      setTimeout(() => {
        setLogEntries(prev => [...prev, `[${new Date().toLocaleTimeString()}] Extração de texto concluída para: ${item.title}`]);
        
        // Análise
        updatedQueue[index] = { ...updatedQueue[index], stage: 'analyzing', progress: 40 };
        setProcessQueue([...updatedQueue]);
        
        setTimeout(() => {
          setLogEntries(prev => [...prev, `[${new Date().toLocaleTimeString()}] Análise NTAI concluída para: ${item.title}`]);
          
          // Padronização
          updatedQueue[index] = { ...updatedQueue[index], stage: 'standardizing', progress: 70 };
          setProcessQueue([...updatedQueue]);
          
          setTimeout(() => {
            // 10% de chance de erro
            const hasError = Math.random() < 0.1;
            
            if (hasError) {
              setLogEntries(prev => [...prev, `[${new Date().toLocaleTimeString()}] [ERRO] Falha na padronização para: ${item.title} - Formato incompatível`]);
              updatedQueue[index] = { 
                ...updatedQueue[index], 
                stage: 'error', 
                progress: 85,
                error: 'Formato incompatível de dados na padronização'
              };
            } else {
              setLogEntries(prev => [...prev, `[${new Date().toLocaleTimeString()}] Padronização concluída para: ${item.title}`]);
              updatedQueue[index] = { ...updatedQueue[index], stage: 'complete', progress: 100 };
            }
            
            setProcessQueue([...updatedQueue]);
            processNextItem(index + 1);
          }, 1500);
        }, 2000);
      }, 1500);
    };
    
    processNextItem(0);
  };
  
  const clearCompleted = () => {
    setProcessQueue(processQueue.filter(item => item.stage !== 'complete'));
    toast({
      title: "Itens completos removidos",
      description: "Os itens processados com sucesso foram removidos da fila.",
    });
  };
  
  const retryFailed = () => {
    const updatedQueue = processQueue.map(item => 
      item.stage === 'error' ? { ...item, stage: 'idle', progress: 0, error: undefined } : item
    );
    
    setProcessQueue(updatedQueue);
    toast({
      title: "Itens com falha reiniciados",
      description: "Os itens com erro foram reiniciados para novo processamento.",
    });
  };
  
  return (
    <Card>
      <CardContent className="p-6 space-y-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-purple-600" />
            <h3 className="text-lg font-medium">Processamento NTAI</h3>
          </div>
          <Button variant="outline" size="sm" onClick={toggleLogVisibility}>
            {logVisible ? "Ocultar Log" : "Exibir Log"}
          </Button>
        </div>
        
        {logVisible && (
          <NtaiProcessingLog entries={logEntries} />
        )}
        
        <div className="space-y-4">
          <h4 className="text-sm font-medium flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Estudos Disponíveis para Processamento
          </h4>
          
          <div className="border rounded-md overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[40px]">
                    <input 
                      type="checkbox"
                      checked={selectedItems.length === estudos.length && estudos.length > 0}
                      onChange={handleSelectAll}
                      className="rounded"
                    />
                  </TableHead>
                  <TableHead>Estudo</TableHead>
                  <TableHead>Fonte</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {estudos.length > 0 ? (
                  estudos.map((estudo) => (
                    <TableRow key={estudo.id} className="hover:bg-gray-50">
                      <TableCell>
                        <input 
                          type="checkbox"
                          checked={selectedItems.includes(estudo.id)}
                          onChange={() => toggleItemSelection(estudo.id)}
                          className="rounded"
                        />
                      </TableCell>
                      <TableCell className="font-medium">{estudo.title}</TableCell>
                      <TableCell>{estudo.journal}</TableCell>
                      <TableCell>
                        <Badge variant={estudo.status === "new" ? "default" : "outline"}>
                          {estudo.status === "new" ? "Novo" : "Em Curadoria"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-gray-500">
                      Nenhum estudo disponível para processamento
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
            
            {estudos.length > 0 && (
              <div className="p-2 bg-gray-50 border-t flex justify-end">
                <Button 
                  size="sm" 
                  onClick={addToQueue}
                  disabled={selectedItems.length === 0}
                >
                  Adicionar à Fila NTAI
                </Button>
              </div>
            )}
          </div>
        </div>
        
        <div className="space-y-4 mt-6">
          <div className="flex justify-between items-center">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <Database className="h-4 w-4" />
              Fila de Processamento
              {processQueue.length > 0 && (
                <Badge variant="outline" className="ml-2">
                  {processQueue.length} item(s)
                </Badge>
              )}
            </h4>
            
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={clearCompleted}
                disabled={!processQueue.some(item => item.stage === 'complete')}
              >
                Limpar Completos
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={retryFailed}
                disabled={!processQueue.some(item => item.stage === 'error')}
              >
                Repetir Falhas
              </Button>
              <Button 
                size="sm" 
                onClick={startProcessing}
                disabled={processingActive || processQueue.length === 0 || !processQueue.some(item => item.stage === 'idle')}
              >
                Iniciar Processamento
              </Button>
            </div>
          </div>
          
          {processQueue.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {processQueue.map((item, index) => (
                <NtaiProcessCard key={`${item.id}-${index}`} item={item} />
              ))}
            </div>
          ) : (
            <div className="border rounded-md p-8 text-center text-gray-500">
              Nenhum item na fila de processamento
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default NtaiProcessingSection;
