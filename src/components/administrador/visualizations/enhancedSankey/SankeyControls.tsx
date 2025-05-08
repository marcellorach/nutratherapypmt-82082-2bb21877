
import React from 'react';
import { Button } from "@/components/ui/button";
import { ZoomIn, ZoomOut, RotateCw } from 'lucide-react';

interface SankeyControlsProps {
  scale: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
}

const SankeyControls: React.FC<SankeyControlsProps> = ({
  scale,
  onZoomIn,
  onZoomOut,
  onResetZoom
}) => {
  return (
    <div className="bg-white border rounded-md p-1 shadow-sm">
      <Button 
        onClick={onZoomIn} 
        variant="ghost" 
        size="icon" 
        className="h-8 w-8"
        title="Ampliar"
      >
        <ZoomIn size={16} />
      </Button>
      <Button 
        onClick={onZoomOut} 
        variant="ghost" 
        size="icon" 
        className="h-8 w-8"
        title="Reduzir"
      >
        <ZoomOut size={16} />
      </Button>
      <Button 
        onClick={onResetZoom} 
        variant="ghost" 
        size="icon" 
        className="h-8 w-8"
        title="Resetar zoom"
      >
        <RotateCw size={16} />
      </Button>
    </div>
  );
};

export default SankeyControls;
