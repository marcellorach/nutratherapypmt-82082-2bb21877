
import React, { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from 'react-i18next';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RefreshCcw } from "lucide-react";
import { supabase } from '@/integrations/supabase/client';

import TabHeader from './TabHeader';
import TabNavigation from './TabNavigation';
import FileUploadTab from './FileUploadTab';
import SciSpace2StepImport from './SciSpace2StepImport';
import AIProcessingTab from './AIProcessingTab';
import StudiesLibraryTab from '../library/StudiesLibraryTab';
import EstudosColumn from '../EstudosColumn';
import EstudoSearch from '../EstudoSearch';
import AdicionarEstudoDialog from '../../dialogs/AdicionarEstudoDialog';
import EstudoDetailDialog from '../../dialogs/EstudoDetailDialog';
import { useStudyApprovalWorkflow } from '@/hooks/useStudyApprovalWorkflow';

const SCISPACE_LOGO_URL = "/lovable-uploads/1abbfa4b-69b7-42ab-8e69-bf156f88568a.png";

const SciImportSection: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>("library");
  const { toast } = useToast();
  const { t } = useTranslation();

  // Kanban state
  const [estudos, setEstudos] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedEstudo, setSelectedEstudo] = useState<any>(null);
  const { executeApprovalWorkflow } = useStudyApprovalWorkflow();

  // Listen for custom event to navigate to AI Processing tab
  useEffect(() => {
    const handleStudyImportedToAI = (e: CustomEvent) => {
      if (e.detail?.navigateToAI) {
        setActiveTab('ai-processing');
      }
    };
    
    window.addEventListener('studyImportedToAI', handleStudyImportedToAI as EventListener);
    return () => window.removeEventListener('studyImportedToAI', handleStudyImportedToAI as EventListener);
  }, []);

  // Fetch estudos when curation tab is active
  useEffect(() => {
    if (activeTab === 'curation') {
      fetchEstudos();
    }
  }, [activeTab]);

  // Realtime subscription for estudos
  useEffect(() => {
    const channel = supabase
      .channel('processed_studies_changes_pipeline')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'processed_studies' }, () => {
        if (activeTab === 'curation') fetchEstudos();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [activeTab]);

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
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
  };

  const handleProcessWithAI = () => {
    setActiveTab('ai-processing');
    toast({
      title: t('studies.toast.selectStudies'),
      description: t('studies.toast.selectStudiesDesc')
    });
  };

  const handleViewEstudo = (estudo: any) => {
    setSelectedEstudo(estudo);
    setDetailDialogOpen(true);
  };

  const handleAdvanceApproval = async (estudoId: string) => {
    try {
      await executeApprovalWorkflow(estudoId);
      setDetailDialogOpen(false);
      fetchEstudos();
    } catch (error) {
      console.error('Error in approval workflow:', error);
    }
  };

  const handleDeleteEstudo = () => {
    fetchEstudos();
  };

  const getNutraceuticalScore = (name: string): number => {
    const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % 50;
    return 2 + (hash / 10);
  };

  const filteredEstudos = estudos.filter(estudo => 
    (estudo.title && estudo.title.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (estudo.description && estudo.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (estudo.original_filename && estudo.original_filename.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (estudo.journal && estudo.journal.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const novoEstudos = filteredEstudos.filter(estudo => estudo.kanban_status === "new");
  const emRevEstudos = filteredEstudos.filter(estudo => estudo.kanban_status === "parsed" || estudo.kanban_status === "review" || estudo.kanban_status === "processed");
  const aprovadosEstudos = filteredEstudos.filter(estudo => estudo.kanban_status === "approved");

  return (
    <>
      <Card>
        <Tabs value={activeTab} className="w-full">
          <TabHeader activeTab={activeTab} scispaceLogo={SCISPACE_LOGO_URL} onProcessWithAI={handleProcessWithAI} />
          <TabNavigation activeTab={activeTab} onTabChange={handleTabChange} />

          <div className="p-6">
            <TabsContent value="library">
              <StudiesLibraryTab onNavigateToUpload={() => handleTabChange('file-upload')} />
            </TabsContent>

            <TabsContent value="file-upload">
              <FileUploadTab />
            </TabsContent>

            <TabsContent value="scispace-api">
              <SciSpace2StepImport />
            </TabsContent>

            <TabsContent value="ai-processing">
              <AIProcessingTab />
            </TabsContent>

            <TabsContent value="curation">
              <div className="space-y-4">
                {/* Curation header with search & refresh */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-medium">{t('studies.kanban.inReview')}</h3>
                    <Badge variant="secondary">{estudos.length}</Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button 
                      onClick={fetchEstudos} 
                      variant="outline" 
                      size="sm"
                      disabled={loading}
                      className="flex items-center gap-2"
                    >
                      <RefreshCcw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                      {loading ? t('common.updating') : t('common.update')}
                    </Button>
                    <EstudoSearch searchTerm={searchTerm} onSearchChange={setSearchTerm} />
                  </div>
                </div>

                {/* Kanban columns */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <EstudosColumn
                    title={t('studies.kanban.newStudies')}
                    icon="new"
                    estudos={novoEstudos}
                    onViewEstudo={handleViewEstudo}
                    onAddEstudo={() => setDialogOpen(true)}
                    buttonLabel={t('studies.kanban.startCuration')}
                    getNutraceuticalScore={getNutraceuticalScore}
                    onDeleteEstudo={handleDeleteEstudo}
                  />
                  <EstudosColumn
                    title={t('studies.kanban.inReview')}
                    icon="review"
                    estudos={emRevEstudos}
                    onViewEstudo={handleViewEstudo}
                    getNutraceuticalScore={getNutraceuticalScore}
                    onDeleteEstudo={handleDeleteEstudo}
                  />
                  <EstudosColumn
                    title={t('studies.kanban.approved')}
                    icon="approved"
                    estudos={aprovadosEstudos}
                    onViewEstudo={handleViewEstudo}
                    getNutraceuticalScore={getNutraceuticalScore}
                    onDeleteEstudo={handleDeleteEstudo}
                  />
                </div>
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </Card>

      <AdicionarEstudoDialog 
        open={dialogOpen} 
        onClose={() => setDialogOpen(false)}
        onEstudoAdicionado={() => {
          setDialogOpen(false);
          fetchEstudos();
          toast({
            title: t('studies.toast.studyAdded'),
            description: t('studies.toast.studyAddedDesc'),
          });
        }}
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

export default SciImportSection;
