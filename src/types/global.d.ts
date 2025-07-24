declare global {
  interface Window {
    setAgentError?: (agentId: string, errorState: 'none' | 'warning' | 'error' | 'recovery') => void;
  }
}

export {};