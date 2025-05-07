
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Trash2, Plus, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { NutraceuticalRelationsService } from '@/services/nutraceuticals/relations-service';

interface ConditionsTabProps {
  nutraceutical: any;
  conditions: any[];
  isLoading: boolean;
  onSuccess?: () => void;
}

const ConditionsTab: React.FC<ConditionsTabProps> = ({
  nutraceutical,
  conditions,
  isLoading,
  onSuccess
}) => {
  const [selectedConditionId, setSelectedConditionId] = useState<string>('');
  const [efficacyScore, setEfficacyScore] = useState<number>(3);
  const [notes, setNotes] = useState<string>('');
  const [relationshipType, setRelationshipType] = useState<'prevention' | 'treatment' | 'support'>('prevention');
  const [existingRelations, setExistingRelations] = useState<any[]>([]);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isLoadingRelations, setIsLoadingRelations] = useState<boolean>(true);
  
  const { toast } = useToast();
  
  // Carregar relações existentes quando o componente é montado
  React.useEffect(() => {
    if (nutraceutical?.id) {
      loadExistingRelations();
    }
  }, [nutraceutical]);
  
  // Carregar relações existentes entre o nutracêutico e condições
  const loadExistingRelations = async () => {
    setIsLoadingRelations(true);
    try {
      const relations = await NutraceuticalRelationsService.getConditionRelations(nutraceutical.id);
      setExistingRelations(relations || []);
    } catch (error) {
      console.error('Erro ao carregar relações existentes:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar as relações existentes',
        variant: 'destructive'
      });
    } finally {
      setIsLoadingRelations(false);
    }
  };
  
  // Adicionar nova relação entre nutracêutico e condição
  const handleAddRelation = async () => {
    if (!selectedConditionId) {
      toast({
        title: 'Erro',
        description: 'Selecione uma condição para adicionar',
        variant: 'destructive'
      });
      return;
    }
    
    // Verificar se já existe uma relação com esta condição
    const existingRelation = existingRelations.find(rel => rel.condition_id === selectedConditionId);
    if (existingRelation) {
      toast({
        title: 'Aviso',
        description: 'Esta condição já está relacionada a este nutracêutico',
        variant: 'default'
      });
      return;
    }
    
    setIsSaving(true);
    try {
      await NutraceuticalRelationsService.relateToCondition(
        nutraceutical.id,
        selectedConditionId,
        relationshipType,
        efficacyScore,
        notes
      );
      
      toast({
        title: 'Sucesso',
        description: 'Relação adicionada com sucesso',
      });
      
      // Limpar campos
      setSelectedConditionId('');
      setEfficacyScore(3);
      setNotes('');
      setRelationshipType('prevention');
      
      // Recarregar relações
      await loadExistingRelations();
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Erro ao adicionar relação:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível adicionar a relação',
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
      await NutraceuticalRelationsService.removeConditionRelation(relationId);
      
      toast({
        title: 'Sucesso',
        description: 'Relação removida com sucesso',
      });
      
      // Recarregar relações
      await loadExistingRelations();
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Erro ao remover relação:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível remover a relação',
        variant: 'destructive'
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  // Obter nome da condição pelo ID
  const getConditionName = (conditionId: string) => {
    const condition = conditions.find(c => c.id === conditionId);
    return condition?.name || 'Condição desconhecida';
  };
  
  // Renderizar etiqueta para o tipo de relacionamento
  const renderRelationshipTypeBadge = (type: string) => {
    switch(type) {
      case 'prevention':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700">Prevenção</Badge>;
      case 'treatment':
        return <Badge variant="outline" className="bg-green-50 text-green-700">Tratamento</Badge>;
      case 'support':
        return <Badge variant="outline" className="bg-amber-50 text-amber-700">Suporte</Badge>;
      default:
        return <Badge variant="outline">Desconhecido</Badge>;
    }
  };
  
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-4">Associar a Condições de Saúde</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-4">
            <div>
              <Label htmlFor="conditionSelect">Condição de Saúde</Label>
              <Select
                value={selectedConditionId}
                onValueChange={setSelectedConditionId}
                disabled={isLoading || isSaving}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione uma condição" />
                </SelectTrigger>
                <SelectContent>
                  {conditions && conditions.map((condition) => (
                    <SelectItem key={condition.id} value={condition.id}>
                      {condition.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="relationshipType">Tipo de Relação</Label>
              <Select
                value={relationshipType}
                onValueChange={(value) => setRelationshipType(value as 'prevention' | 'treatment' | 'support')}
                disabled={isLoading || isSaving}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione o tipo de relação" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="prevention">Prevenção</SelectItem>
                  <SelectItem value="treatment">Tratamento</SelectItem>
                  <SelectItem value="support">Suporte</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="space-y-4">
            <div>
              <Label>Nível de Eficácia ({efficacyScore})</Label>
              <Slider
                value={[efficacyScore]}
                min={1}
                max={5}
                step={1}
                onValueChange={(value) => setEfficacyScore(value[0])}
                disabled={isLoading || isSaving}
                className="py-4"
              />
            </div>
            
            <div>
              <Label htmlFor="notes">Notas</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Notas sobre esta relação"
                disabled={isLoading || isSaving}
              />
            </div>
          </div>
        </div>
        
        <Button 
          onClick={handleAddRelation}
          disabled={!selectedConditionId || isLoading || isSaving}
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
              Adicionar Condição
            </>
          )}
        </Button>
      </div>
      
      <div>
        <h3 className="text-lg font-medium mb-4">Condições Relacionadas</h3>
        
        {isLoadingRelations ? (
          <div className="flex items-center justify-center p-6">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : existingRelations.length === 0 ? (
          <div className="text-center p-6 text-muted-foreground border rounded-md">
            Nenhuma condição relacionada a este nutracêutico
          </div>
        ) : (
          <div className="space-y-3">
            {existingRelations.map((relation) => (
              <Card key={relation.id} className="overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <h4 className="font-medium">
                        {relation.condition?.name || getConditionName(relation.condition_id)}
                      </h4>
                      <div className="flex items-center space-x-2">
                        {renderRelationshipTypeBadge(relation.relationship_type)}
                        <Badge variant="outline" className="bg-purple-50 text-purple-700">
                          Eficácia: {relation.efficacy_score}/5
                        </Badge>
                      </div>
                      {relation.notes && (
                        <p className="text-sm text-muted-foreground">{relation.notes}</p>
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

export default ConditionsTab;
