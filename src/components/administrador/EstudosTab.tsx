
import React, { useState, useEffect } from 'react';
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Database, FileText, FileCode, ArrowDown, ArrowUp, ListCheck, Filter } from "lucide-react";
import { supabase } from '@/integrations/supabase/client';
import AdicionarEstudoDialog from './dialogs/AdicionarEstudoDialog';
import EstudoDetailDialog from './dialogs/EstudoDetailDialog';
import EstudosHeader from './estudos/EstudosHeader';
import EstudoSearch from './estudos/EstudoSearch';
import EstudosColumn from './estudos/EstudosColumn';
import SciImportSection from './estudos/import/SciImportSection';
import { UploadEstudoForm } from './estudos/UploadEstudoForm';
import { useTranslation } from 'react-i18next';
import './estudos/estudos.css';

const EstudosTab: React.FC = () => {
  const { t } = useTranslation();
  const [mainTab, setMainTab] = useState<string>("importar");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedEstudo, setSelectedEstudo] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [estudos, setEstudos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Fetch estudos from database
  useEffect(() => {
    fetchEstudos();
    
    // Set up realtime subscription
    const channel = supabase
      .channel('processed_studies_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'processed_studies'
        },
        () => {
          fetchEstudos();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchEstudos = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('processed_studies')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setEstudos(data || []);
    } catch (error) {
      console.error('Error fetching studies:', error);
      toast({
        title: "Erro ao carregar estudos",
        description: "Não foi possível carregar os estudos do banco de dados.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  
  const handleAddEstudo = () => {
    setDialogOpen(true);
  };
  
  const handleEstudoAdicionado = () => {
    setDialogOpen(false);
    fetchEstudos(); // Refresh list
    toast({
      title: t('studies.toast.studyAdded'),
      description: t('studies.toast.studyAddedDesc'),
    });
  };

  const handleViewEstudo = (estudo: any) => {
    setSelectedEstudo(estudo);
    setDetailDialogOpen(true);
  };

  const handleAdvanceApproval = (estudoId: string) => {
    toast({
      title: t('studies.toast.stageAdvanced'),
      description: t('studies.toast.stageAdvancedDesc'),
    });
    setDetailDialogOpen(false);
  };

  const filteredEstudos = estudos.filter(estudo => 
    (estudo.title && estudo.title.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (estudo.description && estudo.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (estudo.original_filename && estudo.original_filename.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (estudo.journal && estudo.journal.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const novoEstudos = filteredEstudos.filter(estudo => estudo.kanban_status === "new");
  const emRevEstudos = filteredEstudos.filter(estudo => estudo.kanban_status === "parsed" || estudo.kanban_status === "review");
  const aprovadosEstudos = filteredEstudos.filter(estudo => estudo.kanban_status === "approved");
  
  const getNutraceuticalScore = (name: string): number => {
    const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % 50;
    return 2 + (hash / 10); // Pontuação entre 2.0 e 6.9
  };

  return (
    <>
      <EstudosHeader onAddEstudo={handleAddEstudo} />
      
      <Tabs value={mainTab} onValueChange={setMainTab} className="w-full mb-6">
        <div className="flex flex-col md:flex-row md:justify-between items-start md:items-center border-b mb-4 pb-2">
          <TabsList className="mb-4 md:mb-0">
            <TabsTrigger value="importar" className="flex items-center gap-2">
              <Database className="w-4 h-4" />
              <span>{t('studies.tabs.importAndProcess')}</span>
            </TabsTrigger>
            <TabsTrigger value="gerenciar" className="flex items-center gap-2">
              <ListCheck className="w-4 h-4" />
              <span>{t('studies.tabs.manage')}</span>
            </TabsTrigger>
          </TabsList>

          {mainTab === "gerenciar" && (
            <div className="flex items-center gap-2">
              <EstudoSearch searchTerm={searchTerm} onSearchChange={setSearchTerm} />
            </div>
          )}
        </div>
        
        <TabsContent value="importar" className="mt-0 space-y-6">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <FileText className="h-4 w-4 text-green-600" />
              <h3 className="text-lg font-medium">Upload e Extração Automática (Gemini AI)</h3>
            </div>
            <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/20">
              {t('common.recommended')}
            </Badge>
          </div>
          <UploadEstudoForm />
          
          <div className="flex items-center space-x-2 mb-2 mt-8">
            <ArrowDown className="h-4 w-4 text-blue-600" />
            <h3 className="text-lg font-medium">{t('studies.import.sectionTitle')}</h3>
          </div>
          <SciImportSection />
        </TabsContent>
        
        <TabsContent value="gerenciar" className="mt-0 space-y-6">
          <div className="flex flex-col space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <EstudosColumn
                title={t('studies.kanban.newStudies')}
                icon="new"
                estudos={novoEstudos}
                onViewEstudo={handleViewEstudo}
                onAddEstudo={handleAddEstudo}
                buttonLabel={t('studies.kanban.startCuration')}
                getNutraceuticalScore={getNutraceuticalScore}
              />
              
              <EstudosColumn
                title={t('studies.kanban.inReview')}
                icon="review"
                estudos={emRevEstudos}
                onViewEstudo={handleViewEstudo}
                getNutraceuticalScore={getNutraceuticalScore}
              />
              
              <EstudosColumn
                title={t('studies.kanban.approved')}
                icon="approved"
                estudos={aprovadosEstudos}
                onViewEstudo={handleViewEstudo}
                getNutraceuticalScore={getNutraceuticalScore}
              />
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <AdicionarEstudoDialog 
        open={dialogOpen} 
        onClose={() => setDialogOpen(false)}
        onEstudoAdicionado={handleEstudoAdicionado}
      />
      
      <EstudoDetailDialog
        open={detailDialogOpen}
        onOpenChange={setDetailDialogOpen}
        estudo={selectedEstudo}
        onAdvanceApproval={handleAdvanceApproval}
      />
    </>
  );
};

export default EstudosTab;
