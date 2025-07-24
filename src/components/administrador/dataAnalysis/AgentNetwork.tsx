
import React from 'react';
import { AgentConnection } from './types';
import ProfessionalAgentNetwork from './network/ProfessionalAgentNetwork';

interface AgentNetworkProps {
  connections: AgentConnection[];
  activeAgent: string | null;
}

const AgentNetwork: React.FC<AgentNetworkProps> = ({ connections, activeAgent }) => {
  return (
    <ProfessionalAgentNetwork
      connections={connections}
      activeAgent={activeAgent}
    />
  );
};

export default AgentNetwork;
