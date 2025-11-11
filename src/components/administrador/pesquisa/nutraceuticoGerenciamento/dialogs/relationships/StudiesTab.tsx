
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Loader2, Plus, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { NutraceuticalRelationsService } from '@/services/nutraceuticals/relations-service';
import { supabase } from '@/integrations/supabase/client';
import StudyCard from './StudyCard';
import EditRelevanceDialog from './EditRelevanceDialog';
import StudyDetailModal from './StudyDetailModal';

interface StudiesTabProps {
  nutraceutical: any;
  studies: any[];
  isLoading: boolean;
  onSuccess?: () => void;
}

const StudiesTab: React.FC<StudiesTabProps> = ({
  nutraceutical,
  studies,
  isLoading,
  onSuccess
}) => {
  const [selectedStudyId, setSelectedStudyId] = useState<string>('');
  const [relevanceScore, setRelevanceScore] = useState<number>(3);
  const [existingRelations, setExistingRelations] = useState<any[]>([]);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isLoadingRelations, setIsLoadingRelations] = useState<boolean>(true);
  const [studySearchTerm, setStudySearchTerm] = useState<string>('');
  const [selectedStudyForDetail, setSelectedStudyForDetail] = useState<any>(null);
  const [selectedRelationForEdit, setSelectedRelationForEdit] = useState<any>(null);
  
  const { toast } = useToast();
  
  // Carregar relações existentes quando o componente é montado
  useEffect(() => {
    if (nutraceutical?.id) {
      loadExistingRelations();
    }
  }, [nutraceutical]);
  
  // Carregar relações existentes entre o nutracêutico e estudos
  const loadExistingRelations = async () => {
    setIsLoadingRelations(true);
    try {
      const relations = await NutraceuticalRelationsService.getStudyRelations(nutraceutical.id);
      console.log('Relações de estudos carregadas:', relations);
      setExistingRelations(relations || []);
    } catch (error) {
      console.error('Erro ao carregar relações existentes com estudos:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar as relações com estudos',
        variant: 'destructive'
      });
    } finally {
      setIsLoadingRelations(false);
    }
  };
  
  // Adicionar nova relação entre nutracêutico e estudo
  const handleAddRelation = async () => {
    if (!selectedStudyId) {
      toast({
        title: 'Erro',
        description: 'Selecione um estudo para adicionar',
        variant: 'destructive'
      });
      return;
    }
    
    // VALIDAÇÃO: Verificar se o estudo realmente existe
    const studyExists = studies.find(s => s.id === selectedStudyId);
    if (!studyExists) {
      toast({
        title: 'Erro',
        description: 'Estudo selecionado não encontrado no banco de dados',
        variant: 'destructive'
      });
      return;
    }
    
    // Verificar se já existe uma relação com este estudo
    const existingRelation = existingRelations.find(rel => rel.study_id === selectedStudyId);
    if (existingRelation) {
      toast({
        title: 'Aviso',
        description: 'Este estudo já está relacionado a este nutracêutico',
        variant: 'default'
      });
      return;
    }
    
    setIsSaving(true);
    try {
      console.log('Adicionando estudo:', { 
        nutraceuticalId: nutraceutical.id, 
        studyId: selectedStudyId, 
        relevanceScore 
      });
      
      await NutraceuticalRelationsService.relateToStudy(
        nutraceutical.id,
        selectedStudyId,
        relevanceScore
      );
      
      toast({
        title: 'Sucesso',
        description: 'Estudo relacionado com sucesso',
      });
      
      // Limpar campos
      setSelectedStudyId('');
      setRelevanceScore(3);
      
      // Recarregar relações
      await loadExistingRelations();
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Erro ao adicionar relação com estudo:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível relacionar o estudo',
        variant: 'destructive'
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  // Remover relação existente
  const handleRemoveRelation = async (relationId: string) => {
    setIsSaving(true);
    try {
      await NutraceuticalRelationsService.removeStudyRelation(relationId);
      
      toast({
        title: 'Sucesso',
        description: 'Relação com estudo removida com sucesso',
      });
      
      // Recarregar relações
      await loadExistingRelations();
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Erro ao remover relação com estudo:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível remover a relação com o estudo',
        variant: 'destructive'
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  // Handlers para modals
  const handleViewDetails = (relation: any) => {
    setSelectedStudyForDetail(relation);
  };

  const handleEditRelevance = (relation: any) => {
    setSelectedRelationForEdit(relation);
  };

  const handleSaveRelevance = async (relationId: string, newScore: number) => {
    try {
      const { error } = await supabase
        .from('nutraceutical_studies')
        .update({ relevance_score: newScore })
        .eq('id', relationId);

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: 'Relevância atualizada com sucesso',
      });

      // Recarregar relações
      await loadExistingRelations();
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Erro ao atualizar relevância:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar a relevância',
        variant: 'destructive'
      });
      throw error;
    }
  };

  // Filtrar estudos por busca
  const filteredStudies = studies.filter(study =>
    study.title?.toLowerCase().includes(studySearchTerm.toLowerCase()) ||
    study.journal?.toLowerCase().includes(studySearchTerm.toLowerCase()) ||
    study.authors?.some((author: string) => 
      author.toLowerCase().includes(studySearchTerm.toLowerCase())
    )
  );
  
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-4">Associar a Estudos Científicos</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-4">
            {/* Campo de busca */}
            <div>
              <Label htmlFor="studySearch">Buscar Estudo</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="studySearch"
                  placeholder="Buscar por título, journal ou autor..."
                  value={studySearchTerm}
                  onChange={(e) => setStudySearchTerm(e.target.value)}
                  className="pl-9"
                  disabled={isLoading || isSaving}
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="studySelect">Estudo Científico</Label>
              <Select
                value={selectedStudyId}
                onValueChange={setSelectedStudyId}
                disabled={isLoading || isSaving}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione um estudo" />
                </SelectTrigger>
                <SelectContent>
                  {filteredStudies && filteredStudies.map((study) => (
                    <SelectItem key={study.id} value={study.id}>
                      {study.title}
                      {study.year && ` (${study.year})`}
                    </SelectItem>
                  ))}
                  {filteredStudies.length === 0 && (
                    <div className="p-2 text-sm text-muted-foreground text-center">
                      Nenhum estudo encontrado
                    </div>
                  )}
                </SelectContent>
              </Select>
              {studySearchTerm && (
                <p className="text-xs text-muted-foreground mt-1">
                  {filteredStudies.length} estudo(s) encontrado(s)
                </p>
              )}
            </div>
          </div>
          
          <div className="space-y-4">
            <div>
              <Label>Relevância ({relevanceScore})</Label>
              <Slider
                value={[relevanceScore]}
                min={1}
                max={5}
                step={1}
                onValueChange={(value) => setRelevanceScore(value[0])}
                disabled={isLoading || isSaving}
                className="py-4"
              />
            </div>
          </div>
        </div>
        
        <Button 
          onClick={handleAddRelation}
          disabled={!selectedStudyId || isLoading || isSaving}
          className="mt-4"
        >
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Salvando...
            </>
          ) : (
            <>
              <Plus className="mr-2 h-4 w-4" />
              Adicionar Estudo
            </>
          )}
        </Button>
      </div>
      
      <div>
        <h3 className="text-lg font-medium mb-4">Estudos Relacionados</h3>
        
        {isLoadingRelations ? (
          <div className="flex items-center justify-center p-6">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : existingRelations.length === 0 ? (
          <div className="text-center p-6 text-muted-foreground border rounded-md">
            Nenhum estudo relacionado a este nutracêutico
          </div>
        ) : (
          <div className="space-y-3">
            {existingRelations.map((relation) => (
              <StudyCard
                key={relation.id}
                relation={relation}
                onViewDetails={handleViewDetails}
                onEditRelevance={handleEditRelevance}
                onRemove={handleRemoveRelation}
                isSaving={isSaving}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      {selectedStudyForDetail && (
        <StudyDetailModal
          isOpen={!!selectedStudyForDetail}
          onClose={() => setSelectedStudyForDetail(null)}
          relation={selectedStudyForDetail}
        />
      )}

      {selectedRelationForEdit && (
        <EditRelevanceDialog
          isOpen={!!selectedRelationForEdit}
          onClose={() => setSelectedRelationForEdit(null)}
          relation={selectedRelationForEdit}
          onSave={handleSaveRelevance}
        />
      )}
    </div>
  );
};

export default StudiesTab;
