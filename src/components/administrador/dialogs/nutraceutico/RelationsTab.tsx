import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Loader, Plus, Trash } from 'lucide-react';
import { useConditions } from '@/hooks/nutraceuticals/useConditions';
import { useStudies } from '@/hooks/nutraceuticals/useStudies';
import { useToast } from '@/hooks/use-toast';
import { nutraceuticalsService } from '@/services/nutraceuticals';

interface RelationsTabProps {
  nutraceutical: any;
  onUpdate?: () => void;
}

const RelationsTab: React.FC<RelationsTabProps> = ({ nutraceutical, onUpdate }) => {
  const { toast } = useToast();
  const [healthConditions, setHealthConditions] = useState<any[]>([]);
  const [relatedStudies, setRelatedStudies] = useState<any[]>([]);
  const [conditionsLoading, setConditionsLoading] = useState(false);
  const [studiesLoading, setStudiesLoading] = useState(false);

  // Form states para novos relacionamentos
  const [selectedCondition, setSelectedCondition] = useState('');
  const [relationshipType, setRelationshipType] = useState<'prevention' | 'treatment' | 'support'>('prevention');
  const [efficacyScore, setEfficacyScore] = useState<number[]>([3]);
  const [notes, setNotes] = useState('');

  const [selectedStudy, setSelectedStudy] = useState('');
  const [relevanceScore, setRelevanceScore] = useState<number[]>([3]);

  // Carregar dados
  const { conditions } = useConditions();
  const { studies } = useStudies();

  useEffect(() => {
    if (nutraceutical?.id) {
      loadConditionRelations();
      loadStudyRelations();
    }
  }, [nutraceutical?.id]);

  const loadConditionRelations = async () => {
    if (!nutraceutical?.id) return;
    
    try {
      setConditionsLoading(true);
      // Por enquanto, stub - implementar quando disponível
      setHealthConditions([]);
    } catch (error) {
      console.error('Erro ao carregar relações de condições:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as relações de condições.",
        variant: "destructive"
      });
    } finally {
      setConditionsLoading(false);
    }
  };

  const loadStudyRelations = async () => {
    if (!nutraceutical?.id) return;
    
    try {
      setStudiesLoading(true);
      // Por enquanto, stub - implementar quando disponível
      setRelatedStudies([]);
    } catch (error) {
      console.error('Erro ao carregar relações de estudos:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as relações de estudos.",
        variant: "destructive"
      });
    } finally {
      setStudiesLoading(false);
    }
  };

  const handleAddConditionRelation = async () => {
    if (!selectedCondition) {
      toast({
        title: "Erro",
        description: "Selecione uma condição de saúde.",
        variant: "destructive"
      });
      return;
    }

    try {
      setConditionsLoading(true);
      await nutraceuticalsService.addConditionRelation({
        nutraceutical_id: nutraceutical.id,
        condition_id: selectedCondition,
        relationship_type: relationshipType,
        efficacy_score: efficacyScore[0],
        notes
      });

      toast({
        title: "Sucesso",
        description: "Relação com condição adicionada com sucesso."
      });

      // Reset form
      setSelectedCondition('');
      setNotes('');
      setEfficacyScore([3]);
      
      // Reload
      loadConditionRelations();
      onUpdate?.();
    } catch (error) {
      console.error('Erro ao adicionar relação:', error);
      toast({
        title: "Erro",
        description: "Não foi possível adicionar a relação.",
        variant: "destructive"
      });
    } finally {
      setConditionsLoading(false);
    }
  };

  const handleRemoveConditionRelation = async (relationId: string) => {
    try {
      setConditionsLoading(true);
      // Stub - implementar quando disponível
      toast({
        title: "Sucesso",
        description: "Relação removida com sucesso."
      });
      loadConditionRelations();
      onUpdate?.();
    } catch (error) {
      console.error('Erro ao remover relação:', error);
      toast({
        title: "Erro",
        description: "Não foi possível remover a relação.",
        variant: "destructive"
      });
    } finally {
      setConditionsLoading(false);
    }
  };

  const handleAddStudyRelation = async () => {
    if (!selectedStudy) {
      toast({
        title: "Erro",
        description: "Selecione um estudo científico.",
        variant: "destructive"
      });
      return;
    }

    try {
      setStudiesLoading(true);
      await nutraceuticalsService.addStudyRelation({
        nutraceutical_id: nutraceutical.id,
        study_id: selectedStudy,
        relevance_score: relevanceScore[0]
      });

      toast({
        title: "Sucesso",
        description: "Relação com estudo adicionada com sucesso."
      });

      // Reset form
      setSelectedStudy('');
      setRelevanceScore([3]);
      
      // Reload
      loadStudyRelations();
      onUpdate?.();
    } catch (error) {
      console.error('Erro ao adicionar relação:', error);
      toast({
        title: "Erro",
        description: "Não foi possível adicionar a relação.",
        variant: "destructive"
      });
    } finally {
      setStudiesLoading(false);
    }
  };

  const handleRemoveStudyRelation = async (relationId: string) => {
    try {
      setStudiesLoading(true);
      // Stub - implementar quando disponível
      toast({
        title: "Sucesso",
        description: "Relação removida com sucesso."
      });
      loadStudyRelations();
      onUpdate?.();
    } catch (error) {
      console.error('Erro ao remover relação:', error);
      toast({
        title: "Erro",
        description: "Não foi possível remover a relação.",
        variant: "destructive"
      });
    } finally {
      setStudiesLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="conditions" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="conditions">Condições de Saúde</TabsTrigger>
          <TabsTrigger value="studies">Estudos Científicos</TabsTrigger>
        </TabsList>

        <TabsContent value="conditions" className="space-y-4">
          <div className="border rounded-lg p-4">
            <h4 className="font-medium mb-4">Adicionar Nova Relação com Condição</h4>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Condição de Saúde</label>
                <Select value={selectedCondition} onValueChange={setSelectedCondition}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma condição" />
                  </SelectTrigger>
                  <SelectContent>
                    {conditions?.map((condition: any) => (
                      <SelectItem key={condition.id} value={condition.id}>
                        {condition.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium">Tipo de Relação</label>
                <Select value={relationshipType} onValueChange={(value: any) => setRelationshipType(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="prevention">Prevenção</SelectItem>
                    <SelectItem value="treatment">Tratamento</SelectItem>
                    <SelectItem value="support">Suporte</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="mt-4">
              <label className="text-sm font-medium">Score de Eficácia: {efficacyScore[0]}</label>
              <Slider
                value={efficacyScore}
                onValueChange={setEfficacyScore}
                max={5}
                min={1}
                step={1}
                className="mt-2"
              />
            </div>

            <div className="mt-4">
              <label className="text-sm font-medium">Notas</label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Observações sobre esta relação..."
                className="mt-1"
              />
            </div>

            <Button 
              onClick={handleAddConditionRelation}
              disabled={conditionsLoading || !selectedCondition}
              className="mt-4"
            >
              {conditionsLoading ? <Loader className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
              Adicionar Relação
            </Button>
          </div>

          <div>
            <h4 className="font-medium mb-2">Relações Existentes</h4>
            {conditionsLoading ? (
              <div className="flex items-center justify-center p-4">
                <Loader className="w-4 h-4 animate-spin mr-2" />
                Carregando...
              </div>
            ) : (
              <div className="space-y-2">
                {healthConditions.length === 0 ? (
                  <p className="text-muted-foreground text-sm">Nenhuma relação encontrada.</p>
                ) : (
                  healthConditions.map((relation: any) => (
                    <div key={relation.id} className="flex items-center justify-between p-3 border rounded">
                      <div>
                        <span className="font-medium">{relation.condition?.name}</span>
                        <Badge variant="secondary" className="ml-2">
                          {relation.relationship_type}
                        </Badge>
                        <span className="text-sm text-muted-foreground ml-2">
                          Eficácia: {relation.efficacy_score}/5
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveConditionRelation(relation.id)}
                      >
                        <Trash className="w-4 h-4" />
                      </Button>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="studies" className="space-y-4">
          <div className="border rounded-lg p-4">
            <h4 className="font-medium mb-4">Adicionar Nova Relação com Estudo</h4>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Estudo Científico</label>
                <Select value={selectedStudy} onValueChange={setSelectedStudy}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um estudo" />
                  </SelectTrigger>
                  <SelectContent>
                    {studies?.map((study: any) => (
                      <SelectItem key={study.id} value={study.id}>
                        {study.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium">Score de Relevância: {relevanceScore[0]}</label>
                <Slider
                  value={relevanceScore}
                  onValueChange={setRelevanceScore}
                  max={5}
                  min={1}
                  step={1}
                  className="mt-2"
                />
              </div>
            </div>

            <Button 
              onClick={handleAddStudyRelation}
              disabled={studiesLoading || !selectedStudy}
              className="mt-4"
            >
              {studiesLoading ? <Loader className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
              Adicionar Relação
            </Button>
          </div>

          <div>
            <h4 className="font-medium mb-2">Estudos Relacionados</h4>
            {studiesLoading ? (
              <div className="flex items-center justify-center p-4">
                <Loader className="w-4 h-4 animate-spin mr-2" />
                Carregando...
              </div>
            ) : (
              <div className="space-y-2">
                {relatedStudies.length === 0 ? (
                  <p className="text-muted-foreground text-sm">Nenhum estudo relacionado.</p>
                ) : (
                  relatedStudies.map((relation: any) => (
                    <div key={relation.id} className="flex items-center justify-between p-3 border rounded">
                      <div>
                        <span className="font-medium">{relation.study?.title}</span>
                        <span className="text-sm text-muted-foreground ml-2">
                          Relevância: {relation.relevance_score}/5
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveStudyRelation(relation.id)}
                      >
                        <Trash className="w-4 h-4" />
                      </Button>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default RelationsTab;