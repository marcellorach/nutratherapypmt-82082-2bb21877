
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { 
  Select,
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Trash2 } from "lucide-react";
import { useConditions } from "@/hooks/nutraceuticals/useConditions";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

interface NutraceuticalCondition {
  id: string;
  relationship_type: string;
  efficacy_score: number;
  condition: {
    id: string;
    name: string;
  };
}

interface NutraceuticalConditionsEditorProps {
  nutraceutical: {
    id: string;
    name: string;
    nutraceutical_health_conditions?: NutraceuticalCondition[];
  };
  onComplete: () => void;
}

const relationshipTypes = [
  { id: 'prevention', label: 'Prevenção' },
  { id: 'treatment', label: 'Tratamento' },
  { id: 'support', label: 'Suporte' },
];

const NutraceuticalConditionsEditor: React.FC<NutraceuticalConditionsEditorProps> = ({
  nutraceutical,
  onComplete,
}) => {
  const { toast } = useToast();
  const { conditions, isLoading: conditionsLoading, associateNutraceuticalToCondition } = useConditions();
  
  const [selectedConditionId, setSelectedConditionId] = useState<string>("");
  const [selectedRelationType, setSelectedRelationType] = useState<string>("prevention");
  const [efficacyScore, setEfficacyScore] = useState<number>(3);
  const [isAdding, setIsAdding] = useState<boolean>(false);
  const [existingRelations, setExistingRelations] = useState<NutraceuticalCondition[]>([]);
  
  // Inicializar as relações existentes
  useEffect(() => {
    if (nutraceutical.nutraceutical_health_conditions) {
      setExistingRelations(nutraceutical.nutraceutical_health_conditions);
    } else {
      setExistingRelations([]);
    }
  }, [nutraceutical]);
  
  // Filtrar condições já associadas
  const availableConditions = conditions?.filter(condition => 
    !existingRelations.some(relation => relation.condition.id === condition.id)
  ) || [];
  
  const handleAssociateCondition = async () => {
    if (!selectedConditionId) {
      toast({
        title: "Erro",
        description: "Selecione uma condição de saúde",
        variant: "destructive",
      });
      return;
    }
    
    setIsAdding(true);
    
    try {
      await associateNutraceuticalToCondition(
        nutraceutical.id, 
        selectedConditionId, 
        selectedRelationType as 'prevention' | 'treatment' | 'support',
        efficacyScore
      );
      
      // Atualizar a lista local de relações
      const newCondition = conditions?.find(c => c.id === selectedConditionId);
      if (newCondition) {
        const newRelation = {
          id: `temp-${Date.now()}`,
          relationship_type: selectedRelationType,
          efficacy_score: efficacyScore,
          condition: {
            id: newCondition.id,
            name: newCondition.name
          }
        };
        
        setExistingRelations(prev => [...prev, newRelation]);
      }
      
      // Resetar o formulário
      setSelectedConditionId("");
      setEfficacyScore(3);
      
      toast({
        title: "Sucesso",
        description: "Condição associada com sucesso",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível associar a condição",
        variant: "destructive",
      });
      console.error(error);
    } finally {
      setIsAdding(false);
    }
  };

  // Função para remover associação (não implementada diretamente na API ainda)
  const handleRemoveAssociation = (relationId: string) => {
    // Simulação da remoção local
    setExistingRelations(prev => prev.filter(rel => rel.id !== relationId));
    
    toast({
      title: "Funcionalidade parcial",
      description: "A remoção foi simulada na interface. Recarregue a página para ver o estado real.",
      variant: "default",
    });
  };

  const getEfficiencyColor = (score: number) => {
    if (score >= 4) return "bg-green-100 text-green-800 border-green-200";
    if (score >= 2.5) return "bg-amber-100 text-amber-800 border-amber-200";
    return "bg-red-100 text-red-800 border-red-200";
  };

  const getRelationshipTypeLabel = (type: string) => {
    const relation = relationshipTypes.find(r => r.id === type);
    return relation ? relation.label : type;
  };

  return (
    <div className="space-y-6">
      <div className="rounded-md border p-4 bg-slate-50">
        <h4 className="font-semibold mb-4">Adicionar nova relação</h4>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <Label htmlFor="condition">Condição de Saúde</Label>
            <Select 
              value={selectedConditionId} 
              onValueChange={setSelectedConditionId}
              disabled={availableConditions.length === 0 || isAdding}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecione uma condição" />
              </SelectTrigger>
              <SelectContent>
                {availableConditions.length === 0 ? (
                  <SelectItem value="empty_placeholder" disabled>
                    Todas as condições já foram associadas
                  </SelectItem>
                ) : (
                  availableConditions.map((condition) => (
                    <SelectItem key={condition.id} value={condition.id}>
                      {condition.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="relationship">Tipo de Relação</Label>
            <Select 
              value={selectedRelationType} 
              onValueChange={setSelectedRelationType}
              disabled={isAdding}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {relationshipTypes.map((type) => (
                  <SelectItem key={type.id} value={type.id}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="md:col-span-2">
            <div className="flex justify-between">
              <Label htmlFor="efficacy">Eficácia (1-5): {efficacyScore}</Label>
            </div>
            <Slider
              id="efficacy"
              min={1}
              max={5}
              step={0.5}
              value={[efficacyScore]}
              onValueChange={(values) => setEfficacyScore(values[0])}
              disabled={isAdding}
              className="py-4"
            />
          </div>
          
          <div className="md:col-span-2 flex justify-end">
            <Button 
              onClick={handleAssociateCondition} 
              disabled={!selectedConditionId || isAdding}
            >
              Adicionar Relação
            </Button>
          </div>
        </div>
      </div>
      
      <div>
        <h4 className="font-semibold mb-4">Relações Existentes</h4>
        {conditionsLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : existingRelations.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground border rounded-md">
            Este nutracêutico não possui relações com condições de saúde
          </div>
        ) : (
          <div className="space-y-2">
            {existingRelations.map((relation) => (
              <div 
                key={relation.id}
                className="flex items-center justify-between p-3 border rounded-md"
              >
                <div className="flex flex-col gap-1">
                  <span className="font-medium">{relation.condition.name}</span>
                  <div className="flex gap-2">
                    <Badge variant="outline">
                      {getRelationshipTypeLabel(relation.relationship_type)}
                    </Badge>
                    <Badge 
                      variant="outline" 
                      className={getEfficiencyColor(relation.efficacy_score)}
                    >
                      Eficácia: {relation.efficacy_score}
                    </Badge>
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => handleRemoveAssociation(relation.id)}
                  className="text-red-500 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default NutraceuticalConditionsEditor;
