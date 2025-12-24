
import { useState, useCallback, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';

// Pesos para cada tipo de mensagem de log para calcular progresso
const LOG_PROGRESS_MAP: Record<string, number> = {
  '[1/6]': 10,
  '[2/6]': 20,
  '[3/6]': 35,
  '[4/6]': 50,
  '[5/6]': 65,
  '[6/6]': 80,
  'VALIDAÇÃO APROVADA': 85,
  'Analisando': 60,
  'Concluído': 100,
  'SUCESSO': 95,
};

export const useVetGraphRAGLogs = () => {
  const [logEntries, setLogEntries] = useState<string[]>([]);
  const [calculatedProgress, setCalculatedProgress] = useState(0);
  const { toast } = useToast();
  const lastEntryTimeRef = useRef<number>(0);
  const pendingEntriesRef = useRef<Array<{ message: string; isError: boolean }>>([]);
  const isProcessingRef = useRef(false);

  // Processar entradas com delay mínimo
  const processEntryQueue = useCallback(async () => {
    if (isProcessingRef.current || pendingEntriesRef.current.length === 0) return;
    
    isProcessingRef.current = true;
    
    while (pendingEntriesRef.current.length > 0) {
      const entry = pendingEntriesRef.current.shift()!;
      const now = Date.now();
      const timeSinceLastEntry = now - lastEntryTimeRef.current;
      
      // Se a última entrada foi há menos de 150ms, aguardar
      if (timeSinceLastEntry < 150 && lastEntryTimeRef.current > 0) {
        await new Promise(resolve => setTimeout(resolve, 150 - timeSinceLastEntry));
      }
      
      const timestamp = new Date().toLocaleTimeString();
      const formattedMessage = `[${timestamp}] ${entry.message}`;
      
      setLogEntries(prev => [...prev, formattedMessage]);
      lastEntryTimeRef.current = Date.now();
      
      // Calcular progresso baseado na mensagem
      for (const [keyword, progress] of Object.entries(LOG_PROGRESS_MAP)) {
        if (entry.message.includes(keyword)) {
          setCalculatedProgress(prev => Math.max(prev, progress));
          break;
        }
      }
      
      // Se for erro, mostrar um toast
      if (entry.isError) {
        toast({
          title: "Erro no processamento",
          description: entry.message,
          variant: "destructive",
        });
      }
    }
    
    isProcessingRef.current = false;
  }, [toast]);

  const addLogEntry = useCallback((message: string, isError = false) => {
    pendingEntriesRef.current.push({ message, isError });
    processEntryQueue();
  }, [processEntryQueue]);

  const clearLogs = () => {
    setLogEntries([]);
    toast({
      title: "Log limpo",
      description: "Todos os registros do log foram removidos.",
    });
  };
  
  const exportLogs = () => {
    const logText = logEntries.join('\n');
    const blob = new Blob([logText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `vetgraphrag-logs-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Log exportado",
      description: "O arquivo de log foi baixado com sucesso.",
    });
  };

  const resetProgress = useCallback(() => {
    setCalculatedProgress(0);
  }, []);

  return { 
    logEntries, 
    addLogEntry,
    clearLogs,
    exportLogs,
    calculatedProgress,
    resetProgress,
  };
};
