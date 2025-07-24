
import React from 'react';
import { AgentConnection } from './types';
import SophisticatedAgentNetwork from './network/SophisticatedAgentNetwork';

interface AgentNetworkProps {
  connections: AgentConnection[];
  activeAgent: string | null;
}

const AgentNetwork: React.FC<AgentNetworkProps> = ({ connections, activeAgent }) => {
  return (
    <SophisticatedAgentNetwork
      connections={connections}
      activeAgent={activeAgent}
    />
  );
};

export default AgentNetwork;
