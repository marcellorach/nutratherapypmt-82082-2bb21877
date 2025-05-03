
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
import { NutraceuticalsService } from '@/services/nutraceuticals';

interface RelationsTabProps {
  nutraceutical: any;
  onUpdate?: () => void;
}

export const RelationsTab: React.FC<RelationsTabProps> = ({ nutraceutical, onUpdate }) => {
  const [activeTab, setActiveTab] = useState('conditions');
  const { toast } = useToast();
  
  // Condições de saúde
  const [selectedCondition, setSelectedCondition] = useState<string>('');
  const [relationshipType, setRelationshipType] = useState<'prevention' | 'treatment' | 'support'>('prevention');
  const [efficacyScore, setEfficacyScore] = useState<number>(3);
  const [notes, setNotes] = useState<string>('');
  const [conditionsLoading, setConditionsLoading] = useState<boolean>(false);
  const [healthConditions, setHealthConditions] = useState<any[]>([]);
  
  // Estudos
  const [selectedStudy, setSelectedStudy] = useState<string>('');
  const [relevanceScore, setRelevanceScore] = useState<number>(3);
  const [studiesLoading, setStudiesLoading] = useState<boolean>(false);
  const [relatedStudies, setRelatedStudies] = useState<any[]>([]);
  
  const { conditions, fetchConditions, isLoading: isLoadingConditions } = useConditions();
  const { studies, fetchStudies, isLoading: isLoadingStudies } = useStudies();
  
  // Carrega dados iniciais
  useEffect(() => {
    fetchConditions();
    fetchStudies();
    
    if (nutraceutical?.id) {
      loadHealthConditions();
      loadStudies();
    }
  }, [nutraceutical?.id]);
  
  // Carrega as condições de saúde relacionadas ao nutracêutico
  const loadHealthConditions = async () => {
    try {
      setConditionsLoading(true);
      const response = await NutraceuticalsService.getConditionRelations(nutraceutical.id);
      setHealthConditions(response || []);
    } catch (error) {
      console.error("Erro ao carregar condições de saúde:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as condições de saúde",
        variant: "destructive"
      });
    } finally {
      setConditionsLoading(false);
    }
  };
  
  // Carrega os estudos relacionados ao nutracêutico
  const loadStudies = async () => {
    try {
      setStudiesLoading(true);
      const response = await NutraceuticalsService.getStudyRelations(nutraceutical.id);
      setRelatedStudies(response || []);
    } catch (error) {
      console.error("Erro ao carregar estudos:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os estudos",
        variant: "destructive"
      });
    } finally {
      setStudiesLoading(false);
    }
  };
  
  // Adiciona uma nova relação com condição de saúde
  const handleAddCondition = async () => {
    if (!selectedCondition || selectedCondition === 'none') {
      toast({
        title: "Atenção",
        description: "Selecione uma condição de saúde",
        variant: "default"
      });
      return;
    }
    
    try {
      setConditionsLoading(true);
      await NutraceuticalsService.relateToCondition(
        nutraceutical.id,
        selectedCondition,
        relationshipType,
        efficacyScore,
        notes
      );
      
      // Limpar campos
      setSelectedCondition('');
      setRelationshipType('prevention');
      setEfficacyScore(3);
      setNotes('');
      
      // Recarregar condições
      await loadHealthConditions();
      
      if (onUpdate) onUpdate();
      
      toast({
        title: "Sucesso",
        description: "Condição de saúde adicionada com sucesso"
      });
    } catch (error) {
      console.error("Erro ao adicionar condição:", error);
      toast({
        title: "Erro",
        description: "Não foi possível adicionar a condição de saúde",
        variant: "destructive"
      });
    } finally {
      setConditionsLoading(false);
    }
  };
  
  // Remove uma relação com condição de saúde
  const handleRemoveCondition = async (relationId: string) => {
    try {
      setConditionsLoading(true);
      await NutraceuticalsService.removeConditionRelation(relationId);
      
      // Recarregar condições
      await loadHealthConditions();
      
      if (onUpdate) onUpdate();
      
      toast({
        title: "Sucesso",
        description: "Relação removida com sucesso"
      });
    } catch (error) {
      console.error("Erro ao remover relação:", error);
      toast({
        title: "Erro",
        description: "Não foi possível remover a relação",
        variant: "destructive"
      });
    } finally {
      setConditionsLoading(false);
    }
  };
  
  // Adiciona uma nova relação com estudo científico
  const handleAddStudy = async () => {
    if (!selectedStudy || selectedStudy === 'none') {
      toast({
        title: "Atenção",
        description: "Selecione um estudo científico",
        variant: "default"
      });
      return;
    }
    
    try {
      setStudiesLoading(true);
      await NutraceuticalsService.relateToStudy(
        nutraceutical.id,
        selectedStudy,
        relevanceScore
      );
      
      // Limpar campos
      setSelectedStudy('');
      setRelevanceScore(3);
      
      // Recarregar estudos
      await loadStudies();
      
      if (onUpdate) onUpdate();
      
      toast({
        title: "Sucesso",
        description: "Estudo científico adicionado com sucesso"
      });
    } catch (error) {
      console.error("Erro ao adicionar estudo:", error);
      toast({
        title: "Erro",
        description: "Não foi possível adicionar o estudo científico",
        variant: "destructive"
      });
    } finally {
      setStudiesLoading(false);
    }
  };
  
  // Remove uma relação com estudo científico
  const handleRemoveStudy = async (relationId: string) => {
    try {
      setStudiesLoading(true);
      await NutraceuticalsService.removeStudyRelation(relationId);
      
      // Recarregar estudos
      await loadStudies();
      
      if (onUpdate) onUpdate();
      
      toast({
        title: "Sucesso",
        description: "Relação removida com sucesso"
      });
    } catch (error) {
      console.error("Erro ao remover relação:", error);
      toast({
        title: "Erro",
        description: "Não foi possível remover a relação",
        variant: "destructive"
      });
    } finally {
      setStudiesLoading(false);
    }
  };
  
  // Helper para obter o nome da condição de saúde
  const getConditionName = (conditionId: string) => {
    const condition = conditions.find(c => c.id === conditionId);
    return condition ? condition.name : 'Condição desconhecida';
  };
  
  // Organiza as condições de saúde por tipo de relação
  const filterRelationsByType = (type: string | null = null) => {
    if (!type) return healthConditions;
    return healthConditions.filter(relation => relation.relationship_type === type);
  };
  
  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-2">
        <TabsList className="grid grid-cols-2 mb-4">
          <TabsTrigger value="conditions">Condições de Saúde</TabsTrigger>
          <TabsTrigger value="studies">Estudos Científicos</TabsTrigger>
        </TabsList>
        
        {/* Tab de Condições de Saúde */}
        <TabsContent value="conditions" className="space-y-4 pt-2">
          <div className="bg-slate-50 border rounded-md p-4">
            <h3 className="text-lg font-medium mb-4">Adicionar nova relação</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium mb-1">Condição de Saúde</label>
                <Select 
                  value={selectedCondition} 
                  onValueChange={setSelectedCondition}
                  disabled={isLoadingConditions}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma condição" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Selecione uma condição</SelectItem>
                    {conditions.map(condition => (
                      <SelectItem key={condition.id} value={condition.id}>
                        {condition.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Tipo de Relação</label>
                <Select 
                  value={relationshipType} 
                  onValueChange={(value: 'prevention' | 'treatment' | 'support') => setRelationshipType(value)}
                >
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
            
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">
                Eficácia (1-5): {efficacyScore}
              </label>
              <Slider
                value={[efficacyScore]}
                min={1}
                max={5}
                step={1}
                onValueChange={(values) => setEfficacyScore(values[0])}
                className="py-2"
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Notas ou Observações</label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Adicione notas sobre esta relação entre nutracêutico e condição"
                className="min-h-[100px]"
              />
            </div>
            
            <Button 
              onClick={handleAddCondition} 
              disabled={conditionsLoading || !selectedCondition || selectedCondition === 'none'}
              className="w-full"
            >
              {conditionsLoading ? <Loader className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
              Adicionar Relação
            </Button>
          </div>
          
          <div className="border rounded-md">
            <div className="p-4 border-b bg-slate-50">
              <h3 className="font-medium">Relações Existentes</h3>
            </div>
            
            <Tabs defaultValue="all" className="p-4">
              <TabsList>
                <TabsTrigger value="all">Todas</TabsTrigger>
                <TabsTrigger value="prevention">Prevenção</TabsTrigger>
                <TabsTrigger value="treatment">Tratamento</TabsTrigger>
                <TabsTrigger value="support">Suporte</TabsTrigger>
              </TabsList>
              
              <TabsContent value="all" className="pt-4">
                {healthConditions.length === 0 ? (
                  <div className="text-center py-6 text-muted-foreground">
                    Nenhuma relação cadastrada
                  </div>
                ) : (
                  <div className="space-y-3">
                    {healthConditions.map(relation => (
                      <div key={relation.id} className="border p-3 rounded-md flex justify-between items-center">
                        <div>
                          <div className="font-medium">{getConditionName(relation.condition_id)}</div>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline">
                              {relation.relationship_type === 'prevention' && 'Prevenção'}
                              {relation.relationship_type === 'treatment' && 'Tratamento'}
                              {relation.relationship_type === 'support' && 'Suporte'}
                            </Badge>
                            <Badge variant="outline" className="bg-amber-50">
                              Eficácia: {relation.efficacy_score}
                            </Badge>
                          </div>
                          {relation.notes && (
                            <div className="text-sm text-muted-foreground mt-1">
                              {relation.notes}
                            </div>
                          )}
                        </div>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleRemoveCondition(relation.id)}
                          className="h-8 w-8 text-red-500"
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="prevention" className="pt-4">
                {filterRelationsByType('prevention').length === 0 ? (
                  <div className="text-center py-6 text-muted-foreground">
                    Nenhuma relação de prevenção cadastrada
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filterRelationsByType('prevention').map(relation => (
                      <div key={relation.id} className="border p-3 rounded-md flex justify-between items-center">
                        <div>
                          <div className="font-medium">{getConditionName(relation.condition_id)}</div>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline">Prevenção</Badge>
                            <Badge variant="outline" className="bg-amber-50">
                              Eficácia: {relation.efficacy_score}
                            </Badge>
                          </div>
                          {relation.notes && (
                            <div className="text-sm text-muted-foreground mt-1">
                              {relation.notes}
                            </div>
                          )}
                        </div>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleRemoveCondition(relation.id)}
                          className="h-8 w-8 text-red-500"
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="treatment" className="pt-4">
                {filterRelationsByType('treatment').length === 0 ? (
                  <div className="text-center py-6 text-muted-foreground">
                    Nenhuma relação de tratamento cadastrada
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filterRelationsByType('treatment').map(relation => (
                      <div key={relation.id} className="border p-3 rounded-md flex justify-between items-center">
                        <div>
                          <div className="font-medium">{getConditionName(relation.condition_id)}</div>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline">Tratamento</Badge>
                            <Badge variant="outline" className="bg-amber-50">
                              Eficácia: {relation.efficacy_score}
                            </Badge>
                          </div>
                          {relation.notes && (
                            <div className="text-sm text-muted-foreground mt-1">
                              {relation.notes}
                            </div>
                          )}
                        </div>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleRemoveCondition(relation.id)}
                          className="h-8 w-8 text-red-500"
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="support" className="pt-4">
                {filterRelationsByType('support').length === 0 ? (
                  <div className="text-center py-6 text-muted-foreground">
                    Nenhuma relação de suporte cadastrada
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filterRelationsByType('support').map(relation => (
                      <div key={relation.id} className="border p-3 rounded-md flex justify-between items-center">
                        <div>
                          <div className="font-medium">{getConditionName(relation.condition_id)}</div>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline">Suporte</Badge>
                            <Badge variant="outline" className="bg-amber-50">
                              Eficácia: {relation.efficacy_score}
                            </Badge>
                          </div>
                          {relation.notes && (
                            <div className="text-sm text-muted-foreground mt-1">
                              {relation.notes}
                            </div>
                          )}
                        </div>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleRemoveCondition(relation.id)}
                          className="h-8 w-8 text-red-500"
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </TabsContent>
        
        {/* Tab de Estudos Científicos */}
        <TabsContent value="studies" className="space-y-4 pt-2">
          <div className="bg-slate-50 border rounded-md p-4">
            <h3 className="text-lg font-medium mb-4">Adicionar estudo científico</h3>
            
            <div className="grid grid-cols-1 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium mb-1">Estudo Científico</label>
                <Select 
                  value={selectedStudy} 
                  onValueChange={setSelectedStudy}
                  disabled={isLoadingStudies}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um estudo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Selecione um estudo</SelectItem>
                    {studies.map(study => (
                      <SelectItem key={study.id} value={study.id}>
                        {study.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">
                Relevância (1-5): {relevanceScore}
              </label>
              <Slider
                value={[relevanceScore]}
                min={1}
                max={5}
                step={1}
                onValueChange={(values) => setRelevanceScore(values[0])}
                className="py-2"
              />
            </div>
            
            <Button 
              onClick={handleAddStudy} 
              disabled={studiesLoading || !selectedStudy || selectedStudy === 'none'}
              className="w-full"
            >
              {studiesLoading ? <Loader className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
              Adicionar Estudo
            </Button>
          </div>
          
          <div className="border rounded-md">
            <div className="p-4 border-b bg-slate-50">
              <h3 className="font-medium">Estudos Relacionados</h3>
            </div>
            
            <div className="p-4">
              {relatedStudies.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">
                  Nenhum estudo relacionado
                </div>
              ) : (
                <div className="space-y-3">
                  {relatedStudies.map(relation => {
                    const study = studies.find(s => s.id === relation.study_id);
                    return (
                      <div key={relation.id} className="border p-3 rounded-md flex justify-between items-center">
                        <div className="flex-1">
                          <div className="font-medium">{study?.title || 'Estudo desconhecido'}</div>
                          <div className="flex items-center gap-2 mt-1">
                            {study?.journal && (
                              <Badge variant="outline">{study.journal}</Badge>
                            )}
                            <Badge variant="outline" className="bg-blue-50">
                              Relevância: {relation.relevance_score}
                            </Badge>
                          </div>
                          {study?.year && (
                            <div className="text-sm text-muted-foreground mt-1">
                              Ano: {study.year}
                            </div>
                          )}
                        </div>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleRemoveStudy(relation.id)}
                          className="h-8 w-8 text-red-500 shrink-0"
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
