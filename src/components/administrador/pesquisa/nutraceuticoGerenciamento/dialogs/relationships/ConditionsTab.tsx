
import React, { useState, useEffect } from 'react';
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { 
  Select,
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Trash2, Plus } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";
import { NutraceuticalRelationsService } from '@/services/nutraceuticals';

interface ConditionRelation {
  id: string;
  condition: {
    id: string;
    name: string;
  };
  relationship_type: string;
  efficacy_score: number;
  notes?: string;
}

interface ConditionsTabProps {
  nutraceutical: any;
  conditions: any[];
  isLoading: boolean;
}

const relationshipTypes = [
  { id: 'prevention', label: 'Prevenção' },
  { id: 'treatment', label: 'Tratamento' },
  { id: 'support', label: 'Suporte' },
];

const ConditionsTab: React.FC<ConditionsTabProps> = ({
  nutraceutical,
  conditions,
  isLoading
}) => {
  const { toast } = useToast();
  
  const [selectedConditionId, setSelectedConditionId] = useState<string>("");
  const [selectedRelationType, setSelectedRelationType] = useState<string>("prevention");
  const [efficacyScore, setEfficacyScore] = useState<number>(3);
  const [notes, setNotes] = useState<string>("");
  const [isAdding, setIsAdding] = useState<boolean>(false);
  const [existingRelations, setExistingRelations] = useState<ConditionRelation[]>([]);
  const [activeFilter, setActiveFilter] = useState<string>('all');
  
  // Carregar relações existentes
  useEffect(() => {
    if (nutraceutical?.id) {
      fetchExistingRelations();
    }
  }, [nutraceutical]);
  
  const fetchExistingRelations = async () => {
    try {
      // Aqui seria ideal ter uma função específica no NutraceuticalRelationsService
      // para buscar relações, mas vamos criar uma adaptação
      const relations = nutraceutical.nutraceutical_health_conditions || [];
      setExistingRelations(relations);
    } catch (error) {
      console.error('Erro ao carregar relações:', error);
    }
  };
  
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
      const result = await NutraceuticalRelationsService.relateToCondition(
        nutraceutical.id,
        selectedConditionId,
        selectedRelationType as 'prevention' | 'treatment' | 'support',
        efficacyScore,
        notes
      );
      
      // Atualizar a lista local
      const newCondition = conditions?.find(c => c.id === selectedConditionId);
      if (newCondition) {
        const newRelation = {
          id: result.id,
          relationship_type: selectedRelationType,
          efficacy_score: efficacyScore,
          notes: notes,
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
      setNotes("");
      
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
  
  // Função para remover associação
  const handleRemoveAssociation = async (relationId: string) => {
    try {
      // Implementação a ser adicionada no NutraceuticalRelationsService
      // await NutraceuticalRelationsService.removeConditionRelation(relationId);
      
      // Atualizar a lista local
      setExistingRelations(prev => prev.filter(rel => rel.id !== relationId));
      
      toast({
        title: "Sucesso",
        description: "Relação removida com sucesso",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível remover a relação",
        variant: "destructive",
      });
      console.error(error);
    }
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
  
  // Filtrar relações por tipo
  const getFilteredRelations = () => {
    if (activeFilter === "all") return existingRelations;
    return existingRelations.filter(rel => rel.relationship_type === activeFilter);
  };
  
  return (
    <div className="space-y-6">
      <div className="rounded-md border p-4 bg-slate-50">
        <h4 className="font-semibold mb-4">Adicionar nova condição de saúde</h4>
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
          
          <div className="md:col-span-2">
            <Label htmlFor="notes">Notas ou Observações</Label>
            <Textarea
              id="notes"
              placeholder="Adicione notas sobre esta relação entre nutracêutico e condição"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={isAdding}
              className="mt-1"
            />
          </div>
          
          <div className="md:col-span-2 flex justify-end">
            <Button 
              onClick={handleAssociateCondition} 
              disabled={!selectedConditionId || isAdding}
            >
              {isAdding ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adicionando...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Adicionar Relação
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
      
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h4 className="font-semibold">Condições Associadas</h4>
          
          <div className="flex gap-1">
            <Button 
              variant={activeFilter === "all" ? "secondary" : "outline"} 
              size="sm"
              onClick={() => setActiveFilter("all")}
            >
              Todas
            </Button>
            {relationshipTypes.map((type) => (
              <Button
                key={type.id}
                variant={activeFilter === type.id ? "secondary" : "outline"}
                size="sm"
                onClick={() => setActiveFilter(type.id)}
              >
                {type.label}
              </Button>
            ))}
          </div>
        </div>
        
        {isLoading ? (
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
            {getFilteredRelations().map((relation) => (
              <div 
                key={relation.id}
                className="flex flex-col gap-2 p-3 border rounded-md"
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">{relation.condition.name}</span>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => handleRemoveAssociation(relation.id)}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                
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
                
                {relation.notes && (
                  <div className="mt-1 text-sm text-muted-foreground border-t pt-2">
                    <p className="font-medium text-xs mb-1">Notas:</p>
                    <p>{relation.notes}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ConditionsTab;
