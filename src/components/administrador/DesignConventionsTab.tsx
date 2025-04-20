
import React, { useState, useEffect } from 'react';
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ConventionCard } from './design/ConventionCard';
import { EditDesignDialog } from './design/EditDesignDialog';
import { DesignConvention } from '@/types/design';

const DesignConventionsTab = () => {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editText, setEditText] = useState('');
  const [editingSection, setEditingSection] = useState('');
  const [isAIAssistanceActive, setIsAIAssistanceActive] = useState(false);
  const [conventions, setConventions] = useState<DesignConvention[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    fetchConventions();
  }, []);

  const fetchConventions = async () => {
    try {
      const { data, error } = await supabase
        .from('design_conventions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setConventions(data || []);
    } catch (error) {
      toast({
        title: "Erro ao carregar convenções",
        description: "Não foi possível carregar as convenções de design.",
        variant: "destructive"
      });
    }
  };

  const handleEditClick = (section: string) => {
    setEditingSection(section);
    setEditText(`Ajude-me a ajustar as convenções de design para ${section}: [descreva suas alterações]`);
    setIsEditDialogOpen(true);
  };

  const handleAIAssistance = async () => {
    setIsAIAssistanceActive(true);
    try {
      toast({
        title: "Assistente de IA Ativado",
        description: "O assistente de IA está pronto para ajudar com as convenções de design.",
      });
    } catch (error) {
      toast({
        title: "Erro na Assistência de IA",
        description: "Não foi possível iniciar a assistência de IA.",
        variant: "destructive"
      });
      setIsAIAssistanceActive(false);
    }
  };

  const handleInitiateApproval = async () => {
    try {
      const { error } = await supabase
        .from('design_conventions')
        .insert({
          section: editingSection,
          content: editText,
          status: 'pending',
          created_by: (await supabase.auth.getUser()).data.user?.id
        });

      if (error) throw error;

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
      toast({
        title: "Erro ao enviar para aprovação",
        description: "Não foi possível iniciar o processo de aprovação.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Convenções de Design</h2>
        <p className="text-gray-600">Documentação de padrões visuais e convenções de design do sistema</p>
      </div>

      {conventions.map((convention) => (
        <ConventionCard
          key={convention.id}
          convention={convention}
          onEditClick={handleEditClick}
        />
      ))}

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
