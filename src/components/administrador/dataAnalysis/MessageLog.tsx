
import React from 'react';
import { AgentMessage } from './types';
import { agents } from './agentData';

interface MessageLogProps {
  messages: AgentMessage[];
  step: 'waiting' | 'processing' | 'completed';
  isPaused: boolean;
}

const MessageLog: React.FC<MessageLogProps> = ({ messages, step, isPaused }) => {
  return (
    <div className="h-64 overflow-y-auto rounded-md border border-gray-200 bg-black p-4 text-sm font-mono">
      <div className="space-y-2 text-green-400">
        {messages.map((msg, idx) => {
          const agent = agents.find(a => a.id === msg.agentId);
          return (
            <div key={idx} className="py-1 flex">
              <span className="text-blue-400 mr-2">[{agent?.name || msg.agentId}]</span>
              <span>{msg.message}</span>
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
