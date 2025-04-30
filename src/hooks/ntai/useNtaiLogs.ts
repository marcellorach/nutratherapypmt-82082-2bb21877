
import { useState } from 'react';

export const useNtaiLogs = () => {
  const [logEntries, setLogEntries] = useState<string[]>([]);

  const addLogEntry = (message: string) => {
    setLogEntries(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`]);
  };

  const clearLogs = () => {
    setLogEntries([]);
  };

  return { 
    logEntries, 
    addLogEntry,
    clearLogs
  };
};
