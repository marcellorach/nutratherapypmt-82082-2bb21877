
import React from 'react';
import { Button } from '@/components/ui/button';
import { ZoomIn, ZoomOut, Maximize, RefreshCw } from 'lucide-react';
import { Network } from 'vis-network';

interface NetworkControlsProps {
  network: Network | null;
  className?: string;
}

const NetworkControls: React.FC<NetworkControlsProps> = ({ network, className = '' }) => {
  const handleZoomIn = () => {
    if (network) {
      const currentScale = network.getScale();
      network.moveTo({ scale: currentScale * 1.2 });
    }
  };
  
  const handleZoomOut = () => {
    if (network) {
      const currentScale = network.getScale();
      network.moveTo({ scale: currentScale * 0.8 });
    }
  };
  
  const handleFit = () => {
    if (network) {
      network.fit({
        animation: {
          duration: 1000,
          easingFunction: 'easeInOutQuad'
        }
      });
    }
  };
  
  const handleRefresh = () => {
    if (network) {
      network.redraw();
      network.stabilize(100);
    }
  };
  
  const isDisabled = !network;
  
  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <Button 
        variant="outline" 
        size="icon" 
        onClick={handleZoomIn}
        disabled={isDisabled}
        title="Aumentar zoom"
      >
        <ZoomIn className="h-4 w-4" />
      </Button>
      
      <Button 
        variant="outline" 
        size="icon" 
        onClick={handleZoomOut}
        disabled={isDisabled}
        title="Diminuir zoom"
      >
        <ZoomOut className="h-4 w-4" />
      </Button>
      
      <Button 
        variant="outline" 
        size="icon" 
        onClick={handleFit}
        disabled={isDisabled}
        title="Ajustar visualização"
      >
        <Maximize className="h-4 w-4" />
      </Button>
      
      <Button 
        variant="outline" 
        size="icon" 
        onClick={handleRefresh}
        disabled={isDisabled}
        title="Recalcular layout"
      >
        <RefreshCw className="h-4 w-4" />
      </Button>
    </div>
  );
};

export default NetworkControls;
