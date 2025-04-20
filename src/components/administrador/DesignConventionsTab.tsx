
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowUp, ArrowDown, ArrowRight, Edit, Sparkles, CheckCircle, Clock, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface DesignConvention {
  id: string;
  section: string;
  content: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  updated_at: string;
}

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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 flex items-center">
            <CheckCircle className="w-3 h-3 mr-1" />
            Aprovado
          </Badge>
        );
      case 'pending':
        return (
          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 flex items-center">
            <Clock className="w-3 h-3 mr-1" />
            Em Análise
          </Badge>
        );
      case 'rejected':
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 flex items-center">
            <XCircle className="w-3 h-3 mr-1" />
            Rejeitado
          </Badge>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Convenções de Design</h2>
        <p className="text-gray-600">Documentação de padrões visuais e convenções de design do sistema</p>
      </div>

      {conventions.map((convention) => (
        <Card key={convention.id}>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>{convention.section}</CardTitle>
              <CardDescription className="flex items-center gap-2">
                Última atualização: {new Date(convention.updated_at).toLocaleDateString()}
                {getStatusBadge(convention.status)}
              </CardDescription>
            </div>
            <Button 
              onClick={() => handleEditClick(convention.section)} 
              variant="ghost" 
              className="flex items-center gap-2"
              disabled={convention.status === 'pending'}
            >
              <Edit className="w-4 h-4" />
              Propor Alterações
            </Button>
          </CardHeader>
          <CardContent>
            <div className="whitespace-pre-wrap">{convention.content}</div>
          </CardContent>
        </Card>
      ))}

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar {editingSection}</DialogTitle>
            <DialogDescription>
              Use o assistente de IA para ajudar nas alterações de design. As alterações passarão por aprovação antes de serem aplicadas.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <Textarea
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              className="min-h-[200px]"
              placeholder="Descreva as alterações desejadas..."
            />
            
            <div className="flex justify-between items-center">
              <Button 
                onClick={handleAIAssistance} 
                variant="ghost" 
                className="flex items-center gap-2"
                disabled={isAIAssistanceActive}
              >
                <Sparkles className="w-4 h-4" />
                Assistente de IA
              </Button>

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button 
                  onClick={handleInitiateApproval}
                  className="flex items-center gap-2"
                >
                  <ArrowRight className="w-4 h-4" />
                  Iniciar Aprovação
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DesignConventionsTab;
