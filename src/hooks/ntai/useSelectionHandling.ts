
import { useState } from 'react';
import { AvailableStudy } from './types/processing';

export const useSelectionHandling = () => {
  const [selectedItems, setSelectedItems] = useState<string[]>([]);

  const toggleItemSelection = (id: string) => {
    setSelectedItems(prev => 
      prev.includes(id)
        ? prev.filter(item => item !== id)
        : [...prev, id]
    );
  };

  const handleSelectAll = (estudos: AvailableStudy[]) => {
    if (selectedItems.length === estudos.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(estudos.map(estudo => estudo.id));
    }
  };

  return {
    selectedItems,
    setSelectedItems,
    toggleItemSelection,
    handleSelectAll
  };
};
