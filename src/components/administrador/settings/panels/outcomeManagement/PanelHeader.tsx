
import React from 'react';
import { Button } from "@/components/ui/button";

interface PanelHeaderProps {
  onCreateClick: () => void;
}

const PanelHeader: React.FC<PanelHeaderProps> = ({ onCreateClick }) => {
  return (
    <div className="flex items-center justify-between">
      <h3 className="text-lg font-medium">Gerenciamento de Outcomes</h3>
      <Button onClick={onCreateClick}>
        Novo Outcome
      </Button>
    </div>
  );
};

export default PanelHeader;
