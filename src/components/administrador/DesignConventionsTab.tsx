
import React, { useState, useEffect } from 'react';
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ConventionCard } from './design/ConventionCard';
import { EditDesignDialog } from './design/EditDesignDialog';
import { DesignConvention } from '@/types/design';
import { Button } from '@/components/ui/button';
import { Sparkles, Plus } from 'lucide-react';

const DesignConventionsTab = () => {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editText, setEditText] = useState('');
  const [editingSection, setEditingSection] = useState('');
  const [isAIAssistanceActive, setIsAIAssistanceActive] = useState(false);
  const [conventions, setConventions] = useState<DesignConvention[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    // Carrega os dados imediatamente ao montar o componente
    loadExampleConventions();
  }, []);

  const loadExampleConventions = () => {
    setIsLoading(true);
    
    try {
      // Dados de exemplo pré-definidos para garantir que sempre existam dados
      const exampleConventions: DesignConvention[] = [
        {
          id: "1",
          section: "Cores Primárias",
          content: "A paleta de cores primárias deve utilizar tons pastéis em vez de cores vivas. A cor principal do sistema será um azul acinzentado suave (#6E8BA6).",
          status: "approved",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          approved_at: new Date().toISOString(),
          approved_by: "Sistema",
          created_by: "Sistema"
        },
        {
          id: "2",
          section: "Tipografia",
          content: "O sistema utilizará a fonte Montserrat para títulos e Inter para textos, ambas com pesos variados para criar hierarquia visual. Tamanhos devem seguir uma escala modular com razão 1.2.",
          status: "pending",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          approved_at: null,
          approved_by: null,
          created_by: "Sistema"
        },
        {
          id: "3",
          section: "Iconografia",
          content: "Ícones devem ser consistentes em estilo, utilizando linha fina (1.5px) e cantos arredondados. Todos os ícones devem ter o mesmo tamanho base de 24x24px.",
          status: "rejected",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          approved_at: null,
          approved_by: null,
          created_by: "Sistema"
        },
        {
          id: "4",
          section: "Espaçamento",
          content: "O sistema seguirá uma grade de 8px para espaçamentos. Os componentes devem ter margens e preenchimentos que sejam múltiplos de 8px (8, 16, 24, 32, etc).",
          status: "approved",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          approved_at: new Date().toISOString(),
          approved_by: "Sistema",
          created_by: "Sistema"
        },
        {
          id: "5",
          section: "Elementos de Formulário",
          content: "Campos de formulário devem ter altura consistente de 40px, com bordas arredondadas de 4px. Estados de foco, erro e desabilitado devem ser claramente indicados com cores e/ou ícones.",
          status: "pending",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          approved_at: null,
          approved_by: null,
          created_by: "Sistema"
        }
      ];
      
      console.log("Carregando convenções de exemplo:", exampleConventions);
      setConventions(exampleConventions);
      
      toast({
        title: "Dados carregados",
        description: "Convenções de design foram carregadas com sucesso.",
      });
    } catch (error) {
      console.error("Erro ao carregar convenções de exemplo:", error);
      toast({
        title: "Erro ao carregar dados",
        description: "Não foi possível carregar as convenções de design.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchConventions = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('design_conventions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      console.log("Conventions fetched from Supabase:", data);
      
      if (data && data.length > 0) {
        setConventions(data);
      } else {
        // Se não houver dados no Supabase, carregamos os dados de exemplo
        loadExampleConventions();
      }
    } catch (error) {
      console.error("Error fetching conventions:", error);
      toast({
        title: "Erro ao carregar do banco",
        description: "Carregando dados de exemplo localmente.",
        variant: "destructive"
      });
      loadExampleConventions();
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewConvention = () => {
    setEditingSection('Nova Convenção de Design');
    setEditText('');
    setIsEditDialogOpen(true);
  };

  const handleEditClick = (section: string) => {
    const convention = conventions.find(conv => conv.section === section);
    if (convention) {
      setEditingSection(section);
      setEditText(convention.content);
      setIsEditDialogOpen(true);
    }
  };

  const handleAIAssistance = async () => {
    setIsAIAssistanceActive(true);
    try {
      const enhancedText = await enhanceWithAI(editText, editingSection);
      setEditText(enhancedText);
      toast({
        title: "Assistente de IA Aplicado",
        description: "O assistente de IA aprimorou o conteúdo de design.",
      });
    } catch (error) {
      toast({
        title: "Erro na Assistência de IA",
        description: "Não foi possível processar com a IA. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsAIAssistanceActive(false);
    }
  };

  const enhanceWithAI = async (text: string, section: string): Promise<string> => {
    // Simulação de processamento com IA
    await new Promise(resolve => setTimeout(resolve, 1500));
    return `${text}\n\nRecomendações adicionais para ${section}:\n- Manter consistência com outras interfaces do sistema\n- Considerar acessibilidade (contraste mínimo WCAG AA)\n- Testar com usuários reais antes da implementação final`;
  };

  const handleInitiateApproval = async () => {
    try {
      if (editingSection === 'Nova Convenção de Design') {
        // Criando uma nova seção
        const newSection = prompt("Digite o nome da nova seção de design:");
        if (!newSection) return;
        
        // Apenas simulamos a adição - em um ambiente real isso iria para o banco de dados
        const newConvention: DesignConvention = {
          id: `local-${Date.now()}`,
          section: newSection,
          content: editText,
          status: 'pending',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          approved_at: null,
          approved_by: null,
          created_by: "Usuário Local"
        };
        
        setConventions(prev => [newConvention, ...prev]);
      } else {
        // Atualizando uma seção existente - simulamos localmente
        setConventions(prev => 
          prev.map(conv => 
            conv.section === editingSection 
              ? { ...conv, content: editText, status: 'pending', updated_at: new Date().toISOString() } 
              : conv
          )
        );
      }

      toast({
        title: "Solicitação enviada para aprovação",
        description: "As alterações foram enviadas para revisão da equipe de supervisão.",
      });
      
      setIsEditDialogOpen(false);
      
      setTimeout(() => {
        toast({
          title: "Status da aprovação",
          description: "Sua solicitação está em análise. Você receberá uma notificação quando for aprovada.",
        });
      }, 1000);
    } catch (error) {
      console.error("Error submitting approval:", error);
      toast({
        title: "Erro ao enviar para aprovação",
        description: "Não foi possível iniciar o processo de aprovação.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Convenções de Design</h2>
          <p className="text-gray-600">Documentação de padrões visuais e convenções de design do sistema</p>
        </div>
        <Button 
          onClick={handleNewConvention}
          className="flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Nova Convenção
        </Button>
      </div>

      {isLoading ? (
        <div className="py-10 text-center text-gray-500">Carregando convenções de design...</div>
      ) : conventions.length === 0 ? (
        <div className="py-10 text-center border rounded-lg">
          <p className="text-gray-500 mb-4">Nenhuma convenção de design encontrada</p>
          <Button 
            onClick={loadExampleConventions}
            variant="outline"
            className="flex items-center gap-2 mx-auto"
          >
            <Sparkles className="w-4 h-4" />
            Gerar Dados de Exemplo
          </Button>
        </div>
      ) : (
        conventions.map((convention) => (
          <ConventionCard
            key={convention.id}
            convention={convention}
            onEditClick={handleEditClick}
          />
        ))
      )}

      <EditDesignDialog
        isOpen={isEditDialogOpen}
        onClose={() => setIsEditDialogOpen(false)}
        editText={editText}
        editingSection={editingSection}
        onEditTextChange={setEditText}
        onAIAssistance={handleAIAssistance}
        onInitiateApproval={handleInitiateApproval}
        isAIAssistanceActive={isAIAssistanceActive}
      />
    </div>
  );
};

export default DesignConventionsTab;
