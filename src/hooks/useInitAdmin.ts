
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useInitAdmin = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const initAdmin = async () => {
      try {
        setLoading(true);
        
        // Verificar se há uma sessão de usuário
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          console.log('Usuário não autenticado, não inicializando administrador');
          setLoading(false);
          return;
        }
        
        // Fazer uma chamada para a função Edge para inicializar o administrador
        const { error } = await supabase.functions.invoke('init-admin-user', {
          headers: {
            Authorization: `Bearer ${session.access_token}`
          }
        });
        
        if (error) {
          throw error;
        }
        
      } catch (err) {
        console.error('Erro ao inicializar administrador:', err);
        setError(err.message || 'Erro desconhecido');
      } finally {
        setLoading(false);
      }
    };
    
    initAdmin();
  }, []);
  
  return { loading, error };
};
