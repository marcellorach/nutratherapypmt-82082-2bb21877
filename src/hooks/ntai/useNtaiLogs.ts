
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

export const useNtaiLogs = () => {
  const [logEntries, setLogEntries] = useState<string[]>([]);
  const { toast } = useToast();

  const addLogEntry = (message: string, isError = false) => {
    const timestamp = new Date().toLocaleTimeString();
    const formattedMessage = `[${timestamp}] ${message}`;
    
    setLogEntries(prev => [...prev, formattedMessage]);
    
    // Se for erro, mostrar um toast
    if (isError) {
      toast({
        title: "Erro no processamento",
        description: message,
        variant: "destructive",
      });
    }
  };

  const clearLogs = () => {
    setLogEntries([]);
  };
  
  const exportLogs = () => {
    const logText = logEntries.join('\n');
    const blob = new Blob([logText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `ntai-logs-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return { 
    logEntries, 
    addLogEntry,
    clearLogs,
    exportLogs
  };
};
