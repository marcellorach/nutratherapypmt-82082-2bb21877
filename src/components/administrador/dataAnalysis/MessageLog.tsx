
import React, { useEffect, useRef } from 'react';
import { AgentMessage } from './types';
import { agents } from './agentData';

interface MessageLogProps {
  messages: AgentMessage[];
  step: 'waiting' | 'processing' | 'completed';
  isPaused: boolean;
}

const MessageLog: React.FC<MessageLogProps> = ({ messages, step, isPaused }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  
  // Auto-scroll para novas mensagens
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const getMessageColor = (message: string) => {
    if (message.includes('ERROR') || message.includes('ERRO') || message.includes('Falha')) {
      return 'text-red-400';
    }
    if (message.includes('WARNING') || message.includes('AVISO') || message.includes('Quebra') || message.includes('reboot')) {
      return 'text-yellow-400';
    }
    if (message.includes('sucesso') || message.includes('concluída') || message.includes('Processamento NTAI')) {
      return 'text-green-400';
    }
    if (message.includes('Iniciando') || message.includes('Coordenando') || message.includes('carregando')) {
      return 'text-blue-400';
    }
    return 'text-green-400';
  };

  return (
    <div 
      ref={scrollRef}
      className="h-[500px] overflow-y-auto rounded-md border border-gray-200 bg-black p-4 text-sm font-mono"
    >
      <div className="space-y-2">
        {messages.map((msg, idx) => {
          const agent = agents.find(a => a.id === msg.agentId);
          const messageColor = getMessageColor(msg.message);
          
          return (
            <div key={idx} className="py-1 flex">
              <span className="text-blue-400 mr-2 flex-shrink-0">[{agent?.name || msg.agentId}]</span>
              <span className={messageColor}>{msg.message}</span>
            </div>
          );
        })}
        {step === 'processing' && !isPaused && (
          <div className="mt-1 flex items-center">
            <span className="ml-1 h-4 w-2 animate-blink bg-green-400"></span>
          </div>
        )}
      </div>
    </div>
  );
};

export default MessageLog;
