
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
import { useOutcomes } from "@/hooks/nutraceuticals/useOutcomes";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { NutraceuticalsService } from "@/services/nutraceuticals";

interface NutraceuticalOutcome {
  id: string;
  relationship_type: string;
  efficacy_score: number;
  notes?: string;
  outcome: {
    id: string;
    name: string;
  };
}

interface NutraceuticalOutcomesEditorProps {
  nutraceutical: {
    id: string;
    name: string;
    nutraceutical_outcomes?: NutraceuticalOutcome[];
  };
  onComplete: () => void;
}

const relationshipTypes = [
  { id: 'prevention', label: 'Prevenção' },
  { id: 'treatment', label: 'Tratamento' },
  { id: 'support', label: 'Suporte' },
];

const NutraceuticalOutcomesEditor: React.FC<NutraceuticalOutcomesEditorProps> = ({
  nutraceutical,
  onComplete,
}) => {
  const { toast } = useToast();
  const { outcomes, isLoading: outcomesLoading, fetchOutcomes } = useOutcomes();
  
  useEffect(() => {
    fetchOutcomes();
  }, [fetchOutcomes]);
  
  const [selectedOutcomeId, setSelectedOutcomeId] = useState<string>("");
  const [selectedRelationType, setSelectedRelationType] = useState<string>("prevention");
  const [efficacyScore, setEfficacyScore] = useState<number>(3);
  const [notes, setNotes] = useState<string>("");
  const [isAdding, setIsAdding] = useState<boolean>(false);
  const [existingRelations, setExistingRelations] = useState<NutraceuticalOutcome[]>([]);
  const [activeTab, setActiveTab] = useState<string>("all");
  
  // Inicializar as relações existentes
  useEffect(() => {
    if (nutraceutical.nutraceutical_outcomes) {
      setExistingRelations(nutraceutical.nutraceutical_outcomes);
    } else {
      setExistingRelations([]);
    }
  }, [nutraceutical]);
  
  // Filtrar outcomes já associados
  const availableOutcomes = outcomes?.filter(outcome => 
    !existingRelations.some(relation => relation.outcome.id === outcome.id)
  ) || [];
  
  const handleAssociateOutcome = async () => {
    if (!selectedOutcomeId) {
      toast({
        title: "Erro",
        description: "Selecione um outcome",
        variant: "destructive",
      });
      return;
    }
    
    setIsAdding(true);
    
    try {
      await NutraceuticalsService.relateToOutcome(
        nutraceutical.id, 
        selectedOutcomeId, 
        selectedRelationType as 'prevention' | 'treatment' | 'support',
        efficacyScore,
        notes
      );
      
      // Atualizar a lista local de relações
      const newOutcome = outcomes?.find(c => c.id === selectedOutcomeId);
      if (newOutcome) {
        const newRelation = {
          id: `temp-${Date.now()}`,
          relationship_type: selectedRelationType,
          efficacy_score: efficacyScore,
          notes: notes,
          outcome: {
            id: newOutcome.id,
            name: newOutcome.name
          }
        };
        
        setExistingRelations(prev => [...prev, newRelation]);
      }
      
      // Resetar o formulário
      setSelectedOutcomeId("");
      setEfficacyScore(3);
      setNotes("");
      
      toast({
        title: "Sucesso",
        description: "Outcome associado com sucesso",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível associar o outcome",
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
      await NutraceuticalsService.removeOutcomeRelation(relationId);
      
      // Atualizar a lista local
      setExistingRelations(prev => prev.filter(rel => rel.id !== relationId));
      
      toast({
        title: "Sucesso",
        description: "Relação removida com sucesso"
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível remover a associação",
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
    if (activeTab === "all") return existingRelations;
    return existingRelations.filter(rel => rel.relationship_type === activeTab);
  };

  return (
    <div className="space-y-6">
      <div className="rounded-md border p-4 bg-slate-50">
        <h4 className="font-semibold mb-4">Adicionar nova relação</h4>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <Label htmlFor="outcome">Outcome</Label>
            <Select 
              value={selectedOutcomeId} 
              onValueChange={setSelectedOutcomeId}
              disabled={availableOutcomes.length === 0 || isAdding}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecione um outcome" />
              </SelectTrigger>
              <SelectContent>
                {availableOutcomes.length === 0 ? (
                  <SelectItem value="no_outcomes_available">
                    Todos os outcomes já foram associados
                  </SelectItem>
                ) : (
                  availableOutcomes.map((outcome) => (
                    <SelectItem key={outcome.id} value={outcome.id}>
                      {outcome.name}
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
              placeholder="Adicione notas sobre esta relação entre nutracêutico e outcome"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={isAdding}
              className="mt-1"
            />
          </div>
          
          <div className="md:col-span-2 flex justify-end">
            <Button 
              onClick={handleAssociateOutcome} 
              disabled={!selectedOutcomeId || isAdding}
            >
              Adicionar Relação
            </Button>
          </div>
        </div>
      </div>
      
      <div>
        <h4 className="font-semibold mb-4">Relações Existentes</h4>
        {outcomesLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : existingRelations.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground border rounded-md">
            Este nutracêutico não possui relações com outcomes
          </div>
        ) : (
          <div className="space-y-4">
            <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
              <TabsList>
                <TabsTrigger value="all">Todas</TabsTrigger>
                <TabsTrigger value="prevention">Prevenção</TabsTrigger>
                <TabsTrigger value="treatment">Tratamento</TabsTrigger>
                <TabsTrigger value="support">Suporte</TabsTrigger>
              </TabsList>
            </Tabs>
            
            <div className="space-y-2">
              {getFilteredRelations().map((relation) => (
                <div 
                  key={relation.id}
                  className="flex flex-col gap-2 p-3 border rounded-md"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{relation.outcome.name}</span>
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
          </div>
        )}
      </div>
    </div>
  );
};

export default NutraceuticalOutcomesEditor;
