
import React, { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import EstudoCard from '../cards/EstudoCard';
import EstudoSearch from '../EstudoSearch';
// AdicionarEstudoDialog removed - no longer needed in sub-tab layout
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
  
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedEstudo, setSelectedEstudo] = useState<any>(null);
  const { executeApprovalWorkflow } = useStudyApprovalWorkflow();

  // Tab indicator states
  const [isAiProcessing, setIsAiProcessing] = useState(false);
  const [pendingCurationCount, setPendingCurationCount] = useState(0);

  // Fetch tab indicators on mount and periodically
  useEffect(() => {
    const fetchIndicators = async () => {
      try {
        // Check if any study is currently being processed
        const { count: processingCount } = await supabase
          .from('processed_studies')
          .select('*', { count: 'exact', head: true })
          .is('deleted_at', null)
          .in('kanban_status', ['processing', 'parsed']);
        setIsAiProcessing((processingCount ?? 0) > 0);

        // Count pending curation triplets
        const { count: curationCount } = await supabase
          .from('triplet_extractions')
          .select('*', { count: 'exact', head: true })
          .eq('curation_status', 'pending');
        setPendingCurationCount(curationCount ?? 0);
      } catch (e) {
        console.error('Error fetching tab indicators:', e);
      }
    };

    fetchIndicators();
    const interval = setInterval(fetchIndicators, 15000);
    return () => clearInterval(interval);
  }, []);

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

  const inCurationEstudos = filteredEstudos.filter(estudo => 
    estudo.kanban_status === "parsed" || estudo.kanban_status === "review" || estudo.kanban_status === "processed"
  );
  const aprovadosEstudos = filteredEstudos.filter(estudo => estudo.kanban_status === "approved");

  return (
    <>
      <Card>
        <Tabs value={activeTab} className="w-full">
          <TabHeader activeTab={activeTab} scispaceLogo={SCISPACE_LOGO_URL} onProcessWithAI={handleProcessWithAI} />
          <TabNavigation activeTab={activeTab} onTabChange={handleTabChange} isProcessing={isAiProcessing} pendingCurationCount={pendingCurationCount} />

          <div className="p-6">
            <TabsContent value="library">
              <StudiesLibraryTab onNavigateToUpload={() => handleTabChange('file-upload')} />
            </TabsContent>

            <TabsContent value="file-upload">
              <FileUploadTab />
            </TabsContent>

            <TabsContent value="audit-log">
              <HistoryTab />
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

                {/* Sub-tabs: In Curation / Approved */}
                <Tabs defaultValue="in-curation" className="w-full">
                  <TabsList>
                    <TabsTrigger value="in-curation" className="gap-2">
                      {t('studies.curation.inCurationTab')}
                      <Badge variant="secondary" className="text-xs">{inCurationEstudos.length}</Badge>
                    </TabsTrigger>
                    <TabsTrigger value="approved" className="gap-2">
                      {t('studies.curation.approvedTab')}
                      <Badge variant="secondary" className="text-xs">{aprovadosEstudos.length}</Badge>
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="in-curation">
                    {inCurationEstudos.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
                        <p>{t('studies.curation.noStudiesInCuration')}</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 gap-4">
                        {inCurationEstudos.map(estudo => (
                          <EstudoCard
                            key={estudo.id}
                            estudo={estudo}
                            onView={handleViewEstudo}
                            buttonLabel={estudo.kanban_status === 'new' ? t('studies.kanban.startCuration') : undefined}
                            getNutraceuticalScore={getNutraceuticalScore}
                            onDelete={handleDeleteEstudo}
                          />
                        ))}
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="approved">
                    {aprovadosEstudos.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
                        <p>{t('studies.curation.noStudiesApproved')}</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 gap-4">
                        {aprovadosEstudos.map(estudo => (
                          <EstudoCard
                            key={estudo.id}
                            estudo={estudo}
                            onView={handleViewEstudo}
                            getNutraceuticalScore={getNutraceuticalScore}
                            onDelete={handleDeleteEstudo}
                          />
                        ))}
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </Card>

      
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
