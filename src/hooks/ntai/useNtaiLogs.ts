
import { useState } from 'react';

export const useNtaiLogs = () => {
  const [logEntries, setLogEntries] = useState<string[]>([]);

  const addLogEntry = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogEntries(prev => [...prev, `[${timestamp}] ${message}`]);
  };

  return {
    logEntries,
    addLogEntry,
    setLogEntries,
  };
};
