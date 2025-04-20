
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
    fetchConventions();
  }, []);

  const fetchConventions = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('design_conventions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      console.log("Conventions fetched:", data);
      setConventions(data || []);
      
      // If no conventions exist, create some example ones
      if (!data || data.length === 0) {
        await createExampleConventions();
      }
    } catch (error) {
      console.error("Error fetching conventions:", error);
      toast({
        title: "Erro ao carregar convenções",
        description: "Não foi possível carregar as convenções de design.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const createExampleConventions = async () => {
    const exampleConventions = [
      {
        section: "Cores Primárias",
        content: "A paleta de cores primárias deve utilizar tons pastéis em vez de cores vivas. A cor principal do sistema será um azul acinzentado suave (#6E8BA6).",
        status: "approved",
        approved_at: new Date().toISOString(),
        approved_by: "Sistema"
      },
      {
        section: "Tipografia",
        content: "O sistema utilizará a fonte Montserrat para títulos e Inter para textos, ambas com pesos variados para criar hierarquia visual. Tamanhos devem seguir uma escala modular com razão 1.2.",
        status: "pending"
      },
      {
        section: "Iconografia",
        content: "Ícones devem ser consistentes em estilo, utilizando linha fina (1.5px) e cantos arredondados. Todos os ícones devem ter o mesmo tamanho base de 24x24px.",
        status: "rejected"
      }
    ];

    try {
      for (const convention of exampleConventions) {
        await supabase.from('design_conventions').insert(convention);
      }
      toast({
        title: "Dados de exemplo criados",
        description: "Convenções de design de exemplo foram adicionadas ao sistema.",
      });
      fetchConventions();
    } catch (error) {
      console.error("Error creating example conventions:", error);
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
        
        const { error } = await supabase
          .from('design_conventions')
          .insert({
            section: newSection,
            content: editText,
            status: 'pending'
          });

        if (error) throw error;
      } else {
        // Atualizando uma seção existente
        const { error } = await supabase
          .from('design_conventions')
          .insert({
            section: editingSection,
            content: editText,
            status: 'pending'
          });

        if (error) throw error;
      }

      toast({
        title: "Solicitação enviada para aprovação",
        description: "As alterações foram enviadas para revisão da equipe de supervisão.",
      });
      
      setIsEditDialogOpen(false);
      fetchConventions();
      
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
            onClick={createExampleConventions}
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
