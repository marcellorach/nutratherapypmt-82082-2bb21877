
import { useState, useCallback } from 'react';

export function useZoom(initialScale = 1) {
  const [scale, setScale] = useState(initialScale);
  
  const handleZoomIn = useCallback(() => {
    setScale(prev => Math.min(prev + 0.1, 2));
  }, []);

  const handleZoomOut = useCallback(() => {
    setScale(prev => Math.max(prev - 0.1, 0.5));
  }, []);

  const handleResetZoom = useCallback(() => {
    setScale(initialScale);
  }, [initialScale]);

  return {
    scale,
    handleZoomIn,
    handleZoomOut,
    handleResetZoom
  };
}
