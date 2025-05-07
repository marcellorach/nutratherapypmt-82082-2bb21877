
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Loader2, Trash2, FileText, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { NutraceuticalRelationsService } from '@/services/nutraceuticals/relations-service';

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
  
  // Obter título do estudo pelo ID
  const getStudyTitle = (studyId: string) => {
    const study = studies.find(s => s.id === studyId);
    return study?.title || 'Estudo desconhecido';
  };
  
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-4">Associar a Estudos Científicos</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-4">
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
                  {studies && studies.map((study) => (
                    <SelectItem key={study.id} value={study.id}>
                      {study.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
              <Card key={relation.id} className="overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <FileText className="h-4 w-4 text-blue-500" />
                        <h4 className="font-medium">
                          {relation.study?.title || getStudyTitle(relation.study_id)}
                        </h4>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline" className="bg-purple-50 text-purple-700">
                          Relevância: {relation.relevance_score}/5
                        </Badge>
                      </div>
                      {relation.study?.journal && (
                        <p className="text-sm text-muted-foreground">{relation.study.journal}</p>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveRelation(relation.id)}
                      disabled={isSaving}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default StudiesTab;
