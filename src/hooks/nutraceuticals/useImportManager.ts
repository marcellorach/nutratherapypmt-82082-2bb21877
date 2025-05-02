
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { NutraceuticalImportManager } from '@/utils/import-manager';

/**
 * Hook para gerenciar importações de nutracêuticos
 */
export const useImportManager = () => {
  const [imports, setImports] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  const { toast } = useToast();
  
  // Carregar importações
  const fetchImports = async (limit?: number) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await NutraceuticalImportManager.listRecentImports(limit);
      setImports(data);
      return data;
    } catch (err: any) {
      console.error('Erro ao carregar importações:', err);
      setError('Não foi possível carregar as importações');
      
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar as importações',
        variant: 'destructive',
      });
      throw err;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Excluir uma importação
  const deleteImport = async (importId: string) => {
    try {
      const result = await NutraceuticalImportManager.deleteImport(importId);
      
      if (result.success) {
        setImports(prev => prev.filter(imp => imp.id !== importId));
        
        toast({
          title: 'Sucesso',
          description: 'Importação excluída com sucesso',
        });
      } else {
        toast({
          title: 'Erro',
          description: result.message,
          variant: 'destructive',
        });
      }
      
      return result;
    } catch (err: any) {
      console.error('Erro ao excluir importação:', err);
      
      toast({
        title: 'Erro',
        description: 'Não foi possível excluir a importação',
        variant: 'destructive',
      });
      
      throw err;
    }
  };

  return {
    imports,
    isLoading,
    error,
    fetchImports,
    deleteImport
  };
};
