
import { useState } from 'react';
import { AvailableStudy } from './types/processing';
import { useToast } from "@/hooks/use-toast";

export const useSelectionHandling = () => {
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const { toast } = useToast();

  const toggleItemSelection = (id: string) => {
    console.log(`Toggling selection for item: ${id}`);
    setSelectedItems(prev => 
      prev.includes(id)
        ? prev.filter(item => item !== id)
        : [...prev, id]
    );
  };

  const handleSelectAll = (estudos: AvailableStudy[]) => {
    console.log(`Handle select all - current selected: ${selectedItems.length}, total: ${estudos.length}`);
    if (selectedItems.length === estudos.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(estudos.map(estudo => estudo.id));
    }
  };

  const clearSelection = () => {
    console.log("Clearing selection");
    setSelectedItems([]);
  };

  return {
    selectedItems,
    setSelectedItems,
    toggleItemSelection,
    handleSelectAll,
    clearSelection
  };
};
