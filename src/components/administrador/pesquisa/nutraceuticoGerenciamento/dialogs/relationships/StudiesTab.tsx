
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
import { Trash2, Plus, ExternalLink } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { NutraceuticalsService } from '@/services/nutraceuticals';

interface StudyRelation {
  id: string;
  study: {
    id: string;
    title: string;
    year?: number;
    journal?: string;
    link?: string;
  };
  relevance_score: number;
}

interface StudiesTabProps {
  nutraceutical: any;
  studies: any[];
  isLoading: boolean;
}

const StudiesTab: React.FC<StudiesTabProps> = ({
  nutraceutical,
  studies,
  isLoading
}) => {
  const { toast } = useToast();
  
  const [selectedStudyId, setSelectedStudyId] = useState<string>("");
  const [relevanceScore, setRelevanceScore] = useState<number>(3);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [isAdding, setIsAdding] = useState<boolean>(false);
  const [existingRelations, setExistingRelations] = useState<StudyRelation[]>([]);
  
  // Carregar relações existentes
  useEffect(() => {
    if (nutraceutical?.id) {
      fetchExistingRelations();
    }
  }, [nutraceutical]);
  
  const fetchExistingRelations = async () => {
    try {
      // Idealmente teríamos uma função específica no serviço para isso
      const relations = nutraceutical.nutraceutical_studies || [];
      setExistingRelations(relations);
    } catch (error) {
      console.error('Erro ao carregar estudos:', error);
    }
  };
  
  // Filtrar estudos já associados e por termo de busca
  const filteredStudies = studies?.filter(study => {
    const isAlreadyAssociated = existingRelations.some(
      relation => relation.study.id === study.id
    );
    
    const matchesSearch = searchTerm === "" || 
      study.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
      (study.authors && 
        study.authors.some((author: string) => 
          author.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    
    return !isAlreadyAssociated && matchesSearch;
  }) || [];
  
  const handleAssociateStudy = async () => {
    if (!selectedStudyId) {
      toast({
        title: "Erro",
        description: "Selecione um estudo científico",
        variant: "destructive",
      });
      return;
    }
    
    setIsAdding(true);
    
    try {
      const result = await NutraceuticalsService.relateToStudy(
        nutraceutical.id,
        selectedStudyId,
        relevanceScore
      );
      
      // Atualizar a lista local
      const newStudy = studies?.find(s => s.id === selectedStudyId);
      if (newStudy) {
        const newRelation = {
          id: result.id,
          relevance_score: relevanceScore,
          study: {
            id: newStudy.id,
            title: newStudy.title,
            year: newStudy.year,
            journal: newStudy.journal,
            link: newStudy.link
          }
        };
        
        setExistingRelations(prev => [...prev, newRelation]);
      }
      
      // Resetar o formulário
      setSelectedStudyId("");
      setRelevanceScore(3);
      
      toast({
        title: "Sucesso",
        description: "Estudo associado com sucesso",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível associar o estudo",
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
      await NutraceuticalsService.removeStudyRelation(relationId);
      
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
  
  const getRelevanceColor = (score: number) => {
    if (score >= 4) return "bg-green-100 text-green-800 border-green-200";
    if (score >= 2.5) return "bg-amber-100 text-amber-800 border-amber-200";
    return "bg-red-100 text-red-800 border-red-200";
  };
  
  return (
    <div className="space-y-6">
      <div className="rounded-md border p-4 bg-slate-50">
        <h4 className="font-semibold mb-4">Adicionar estudo científico</h4>
        <div className="grid gap-4">
          <div>
            <Label htmlFor="searchStudy">Buscar Estudos</Label>
            <Input
              id="searchStudy"
              placeholder="Digite título ou autor para buscar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="mt-1"
            />
          </div>
          
          <div>
            <Label htmlFor="study">Selecionar Estudo</Label>
            <Select 
              value={selectedStudyId} 
              onValueChange={setSelectedStudyId}
              disabled={filteredStudies.length === 0 || isAdding}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecione um estudo" />
              </SelectTrigger>
              <SelectContent>
                {filteredStudies.length === 0 ? (
                  <SelectItem value="empty_placeholder" disabled>
                    {searchTerm ? "Nenhum resultado encontrado" : "Todos os estudos já foram associados"}
                  </SelectItem>
                ) : (
                  filteredStudies.map((study) => (
                    <SelectItem key={study.id} value={study.id}>
                      {study.title} {study.year ? `(${study.year})` : ''}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <div className="flex justify-between">
              <Label htmlFor="relevance">Relevância (1-5): {relevanceScore}</Label>
            </div>
            <Slider
              id="relevance"
              min={1}
              max={5}
              step={0.5}
              value={[relevanceScore]}
              onValueChange={(values) => setRelevanceScore(values[0])}
              disabled={isAdding}
              className="py-4"
            />
          </div>
          
          <div className="flex justify-end">
            <Button 
              onClick={handleAssociateStudy} 
              disabled={!selectedStudyId || isAdding}
            >
              {isAdding ? (
                <>Adicionando...</>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Adicionar Estudo
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
      
      <div>
        <h4 className="font-semibold mb-4">Estudos Associados</h4>
        
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : existingRelations.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground border rounded-md">
            Este nutracêutico não possui estudos científicos associados
          </div>
        ) : (
          <div className="space-y-3">
            {existingRelations.map((relation) => (
              <div 
                key={relation.id}
                className="p-3 border rounded-md"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h5 className="font-medium">{relation.study.title}</h5>
                    <div className="text-sm text-muted-foreground mt-1">
                      {relation.study.journal} 
                      {relation.study.year ? `, ${relation.study.year}` : ''}
                    </div>
                    
                    <div className="flex gap-2 mt-2">
                      <Badge 
                        variant="outline" 
                        className={getRelevanceColor(relation.relevance_score)}
                      >
                        Relevância: {relation.relevance_score}
                      </Badge>
                      
                      {relation.study.link && (
                        <a 
                          href={relation.study.link} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="inline-flex items-center text-xs text-blue-600 hover:text-blue-800"
                        >
                          Ver estudo <ExternalLink className="ml-1 h-3 w-3" />
                        </a>
                      )}
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
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default StudiesTab;
