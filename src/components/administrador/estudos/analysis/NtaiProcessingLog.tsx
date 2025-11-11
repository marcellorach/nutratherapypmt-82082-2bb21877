
import React, { useRef, useEffect } from 'react';
import { ScrollArea } from "@/components/ui/scroll-area";

interface NtaiProcessingLogProps {
  entries: string[];
}

const NtaiProcessingLog: React.FC<NtaiProcessingLogProps> = ({ entries }) => {
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  
  // Auto-scroll to bottom when new entries are added
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [entries]);
  
  return (
    <div className="border rounded-md mb-4" ref={scrollAreaRef}>
      <div className="bg-gray-100 px-3 py-2 border-b flex items-center justify-between">
        <h4 className="text-sm font-medium">Log de Processamento RAG</h4>
        <span className="text-xs text-gray-500">{entries.length} eventos</span>
      </div>
      
      <ScrollArea className="h-[200px] p-3">
        {entries.length > 0 ? (
          <div className="space-y-1 font-mono text-xs">
            {entries.map((entry, index) => {
              const isError = entry.includes('[ERRO]');
              
              return (
                <div 
                  key={index} 
                  className={`px-2 py-1 rounded ${isError ? 'bg-red-50 text-red-800' : ''}`}
                >
                  {entry}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="h-full flex items-center justify-center text-gray-400 text-sm">
            Log vazio. Inicie um processamento para ver registros.
          </div>
        )}
      </ScrollArea>
    </div>
  );
};

export default NtaiProcessingLog;
