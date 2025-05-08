
import React from 'react';
import EnhancedSankeyComponent from './enhancedSankey/EnhancedSankeyComponent';
import { EnhancedSankeyData } from './sankey/types';

interface EnhancedSankeyDiagramProps {
  initialData?: EnhancedSankeyData;
  height?: number;
  showControls?: boolean;
  showFilters?: boolean;
  showLegend?: boolean;
}

/**
 * Componente principal do diagrama Sankey avançado
 * Este componente agora apenas repassa props para o componente refatorado
 */
const EnhancedSankeyDiagram: React.FC<EnhancedSankeyDiagramProps> = (props) => {
  return <EnhancedSankeyComponent {...props} />;
};

export default EnhancedSankeyDiagram;
