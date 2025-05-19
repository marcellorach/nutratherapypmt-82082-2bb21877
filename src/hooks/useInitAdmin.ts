
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';

export const useInitAdmin = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  useEffect(() => {
    const initAdmin = async () => {
      try {
        // Verificar se já foi inicializado para evitar múltiplas chamadas
        const initialized = localStorage.getItem('admin_initialized');
        if (initialized === 'true') {
          console.log('Administrador já foi inicializado anteriormente');
          setSuccess(true);
          setLoading(false);
          return;
        }
        
        setLoading(true);
        console.log('Inicializando usuário administrador...');
        
        // Fazer uma chamada para a função Edge para inicializar o administrador
        const { data, error } = await supabase.functions.invoke('init-admin-user');
        
        if (error) {
          console.error('Erro ao invocar função init-admin-user:', error);
          throw error;
        }
        
        console.log('Resposta da função init-admin-user:', data);
        
        // Marcar como inicializado mesmo em caso de usuário já existente
        if (data && (data.success || (data.message && data.message.includes('já existe')))) {
          localStorage.setItem('admin_initialized', 'true');
          setSuccess(true);
          toast({
            title: 'Inicialização do Administrador',
            description: data.message || 'Usuário administrador configurado com sucesso',
          });
        } else {
          toast({
            title: 'Aviso de inicialização',
            description: 'Não foi possível inicializar o administrador automaticamente. Tente fazer login com as credenciais padrão: mrachlyn@gmail.com / nutra12',
            variant: 'default',
          });
        }
        
      } catch (err) {
        console.error('Erro ao inicializar administrador:', err);
        setError(err.message || 'Erro desconhecido');
        toast({
          title: 'Erro ao inicializar administrador',
          description: 'Tente fazer login com as credenciais padrão: mrachlyn@gmail.com / nutra12',
          variant: 'default',
        });
      } finally {
        setLoading(false);
      }
    };
    
    initAdmin();
  }, []);
  
  return { loading, error, success };
};
