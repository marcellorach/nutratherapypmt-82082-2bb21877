
import React from 'react';
import { AgentConnection } from './types';
import TheatricalAgentNetwork from './network/TheatricalAgentNetwork';

interface AgentNetworkProps {
  connections: AgentConnection[];
  activeAgent: string | null;
}

const AgentNetwork: React.FC<AgentNetworkProps> = ({ connections, activeAgent }) => {
  return (
    <TheatricalAgentNetwork
      connections={connections}
      activeAgent={activeAgent}
    />
  );
};

export default AgentNetwork;
