
import { useState } from 'react';

export const useSelectionHandling = () => {
  const [selectedItems, setSelectedItems] = useState<string[]>([]);

  // Alternar seleção de um item
  const toggleItemSelection = (id: string) => {
    setSelectedItems(prev => 
      prev.includes(id)
        ? prev.filter(item => item !== id)
        : [...prev, id]
    );
  };

  // Selecionar ou desselecionar todos os itens
  const handleSelectAll = (items: Array<{ id: string }>) => {
    if (selectedItems.length === items.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(items.map(item => item.id));
    }
  };

  // Limpar a seleção
  const clearSelection = () => {
    setSelectedItems([]);
  };

  return {
    selectedItems,
    toggleItemSelection,
    handleSelectAll,
    clearSelection
  };
};
