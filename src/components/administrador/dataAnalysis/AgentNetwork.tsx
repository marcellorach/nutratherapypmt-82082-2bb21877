
import React from 'react';
import { AgentConnection } from './types';
import SophisticatedAgentNetwork from './network/SophisticatedAgentNetwork';

interface AgentNetworkProps {
  connections: AgentConnection[];
  activeAgent: string | null;
  step?: string;
}

const AgentNetwork: React.FC<AgentNetworkProps> = ({ connections, activeAgent, step }) => {
  return (
    <SophisticatedAgentNetwork
      connections={connections}
      activeAgent={activeAgent}
      step={step}
    />
  );
};

export default AgentNetwork;
