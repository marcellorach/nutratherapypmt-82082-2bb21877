
import { useState, useEffect } from 'react';
import { useToast } from "@/hooks/use-toast";
import { useNutraceuticals } from "./useNutraceuticals";
import { useOutcomes } from "./useOutcomes";
import { useConditions } from "./useConditions";
import { useStudies } from "./useStudies";

export const useNutraceuticalPanel = () => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isOutcomesDialogOpen, setIsOutcomesDialogOpen] = useState(false);
  const [selectedNutraceutical, setSelectedNutraceutical] = useState<any>(null);
  const [filteredNutraceuticals, setFilteredNutraceuticals] = useState<any[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedStudies, setSelectedStudies] = useState<string[]>([]);
  
  // Form state
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    dosage: "",
    source: "",
    chemical_compound: "",
    contraindications: "",
    outcome_id: "",
    efficacy_score: 3, // Valor padrão para o score de eficácia
    notes: "", // Notas sobre a relação outcome/nutracêutico
    study_id: "" // ID do estudo selecionado
  });
  
  const [relations, setRelations] = useState<any[]>([]);

  // Hooks para carregar dados
  const { nutraceuticals, isLoading, fetchNutraceuticals, createNutraceutical, updateNutraceutical, deleteNutraceutical } = useNutraceuticals();
  const { outcomes, fetchOutcomes } = useOutcomes();
  const { conditions, fetchConditions } = useConditions();
  const { studies, fetchStudies, isLoading: studiesLoading } = useStudies();

  // Carregar dados iniciais
  useEffect(() => {
    fetchNutraceuticals();
    fetchOutcomes();
    fetchConditions();
    fetchStudies();
  }, []);

  // Filtrar nutracêuticos quando mudar a pesquisa ou os dados
  useEffect(() => {
    if (nutraceuticals) {
      setFilteredNutraceuticals(
        nutraceuticals.filter(item => 
          item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (item.description && item.description.toLowerCase().includes(searchTerm.toLowerCase()))
        )
      );
    }
  }, [searchTerm, nutraceuticals]);

  // Handler para abrir o diálogo de edição
  const handleEditClick = async (nutraceutical: any) => {
    setSelectedNutraceutical(nutraceutical);
    setFormData({
      name: nutraceutical.name || "",
      description: nutraceutical.description || "",
      dosage: nutraceutical.dosage || "",
      source: nutraceutical.source || "",
      chemical_compound: nutraceutical.chemical_compound || "",
      contraindications: Array.isArray(nutraceutical.contraindications) 
        ? nutraceutical.contraindications.join("\n") 
        : "",
      outcome_id: nutraceutical.outcome_id || "",
      efficacy_score: nutraceutical.scientific_metadata?.efficacy_score || 3,
      notes: "",
      study_id: ""
    });
    
    // Carregar estudos relacionados
    await loadRelatedStudies(nutraceutical.id);
    
    setRelations([]);
    setIsEditDialogOpen(true);
  };

  // Função para carregar estudos relacionados
  const loadRelatedStudies = async (nutraceuticalId: string) => {
    try {
      // Carregar relações de estudos existentes
      const studyService = await import('@/services/nutraceuticals/relations-service');
      const relatedStudies = await studyService.NutraceuticalRelationsService.getStudyRelations(nutraceuticalId);
      
      if (relatedStudies && relatedStudies.length > 0) {
        const studyIds = relatedStudies.map((rel: any) => rel.study_id);
        setSelectedStudies(studyIds);
      } else {
        setSelectedStudies([]);
      }
    } catch (error) {
      console.error("Erro ao carregar estudos relacionados:", error);
      setSelectedStudies([]);
    }
  };

  // Handler para abrir o diálogo de exclusão
  const handleDeleteClick = (nutraceutical: any) => {
    setSelectedNutraceutical(nutraceutical);
    setIsDeleteDialogOpen(true);
  };

  // Handler para abrir o diálogo de outcomes
  const handleOutcomesClick = (nutraceutical: any) => {
    setSelectedNutraceutical(nutraceutical);
    setIsOutcomesDialogOpen(true);
  };

  // Handler para adicionar uma relação à lista
  const handleAddRelation = () => {
    if (!formData.outcome_id || formData.outcome_id === "no_outcome_selected") return;
    
    const outcome = outcomes?.find(out => out.id === formData.outcome_id);
    const study = formData.study_id ? studies.find(s => s.id === formData.study_id) : null;
    
    const newRelation = {
      outcome_id: formData.outcome_id,
      outcome_name: outcome ? outcome.name : "Outcome desconhecido",
      efficacy_score: formData.efficacy_score,
      notes: formData.notes,
      study_id: formData.study_id,
      study_name: study?.title || ""
    };
    
    setRelations([...relations, newRelation]);
    
    // Limpar campos após adicionar
    setFormData({
      ...formData,
      outcome_id: "",
      efficacy_score: 3,
      notes: "",
      study_id: ""
    });
    
    toast({
      title: "Relação adicionada",
      description: "A relação com outcome foi adicionada à lista",
    });
  };

  // Handler para remover uma relação da lista
  const handleRemoveRelation = (index: number) => {
    const updatedRelations = relations.filter((_, i) => i !== index);
    setRelations(updatedRelations);
  };
  
  // Handler para atualizar estudos selecionados via arrastar e soltar
  const handleStudiesDropped = (studyIds: string[]) => {
    setSelectedStudies(studyIds);
  };

  // Handler para criar novo nutracêutico
  const handleCreateSubmit = async () => {
    setIsSaving(true);
    try {
      const contraindications = formData.contraindications
        .split("\n")
        .filter(line => line.trim() !== "");

      // 1. Criar o nutracêutico básico
      const createdNutraceutical = await createNutraceutical({
        ...formData,
        contraindications
      });

      // 2. Atualizar os metadados científicos (eficácia, etc.)
      if (createdNutraceutical && createdNutraceutical.id) {
        try {
          // Atualizar metadados científicos
          const metadataService = await import('@/services/nutraceuticals/metadata-service');
          await metadataService.NutraceuticalMetadataService.updateScientificMetadata(
            createdNutraceutical.id, 
            formData.efficacy_score
          );
          
          // Adicionar notas se houver
          if (formData.notes) {
            const relationsService = await import('@/services/nutraceuticals/relations-service');
            await relationsService.NutraceuticalRelationsService.updateOutcomeRelation(
              createdNutraceutical.id,
              formData.notes
            );
          }
          
          // 3. Associar estudos selecionados
          if (selectedStudies.length > 0) {
            const relationsService = await import('@/services/nutraceuticals/relations-service');
            
            for (const studyId of selectedStudies) {
              await relationsService.NutraceuticalRelationsService.relateToStudy(
                createdNutraceutical.id,
                studyId,
                formData.efficacy_score
              );
            }
          }
        } catch (error) {
          console.error('Erro ao adicionar metadados ou relações:', error);
        }
      }
      
      // Resetar o formulário e fechar o diálogo
      setIsCreateDialogOpen(false);
      resetForm();
      
      // Atualizar a lista de nutracêuticos
      fetchNutraceuticals();
      
      toast({
        title: "Sucesso",
        description: "Nutracêutico criado com sucesso",
      });
    } catch (error) {
      console.error('Erro ao criar nutracêutico:', error);
      toast({
        title: "Erro",
        description: "Não foi possível criar o nutracêutico",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Handler para editar nutracêutico existente
  const handleEditSubmit = async () => {
    setIsSaving(true);
    
    try {
      if (!selectedNutraceutical) {
        throw new Error('Nenhum nutracêutico selecionado para edição');
      }
      
      // Converter contraindications de texto para array
      const contraindications = formData.contraindications
        .split("\n")
        .filter(line => line.trim() !== "");
        
      const updatedNutraceutical = await updateNutraceutical(
        selectedNutraceutical.id, 
        { 
          ...formData, 
          contraindications 
        }
      );
      
      // Atualizar metadados científicos também
      if (updatedNutraceutical) {
        try {
          const metadataService = await import('@/services/nutraceuticals/metadata-service');
          await metadataService.NutraceuticalMetadataService.updateScientificMetadata(
            selectedNutraceutical.id, 
            formData.efficacy_score
          );
        } catch (error) {
          console.error('Erro ao atualizar metadados científicos:', error);
        }
      }
      
      // Resetar o formulário e fechar o diálogo
      setIsEditDialogOpen(false);
      resetForm();
      
      // Atualizar a lista de nutracêuticos
      fetchNutraceuticals();
      
      toast({
        title: "Sucesso",
        description: "Nutracêutico atualizado com sucesso",
      });
    } catch (error) {
      console.error('Erro ao editar nutracêutico:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o nutracêutico",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  // Handler para excluir nutracêutico
  const handleDeleteConfirm = async () => {
    if (!selectedNutraceutical) {
      return;
    }
    
    setIsSaving(true);
    
    try {
      await deleteNutraceutical(selectedNutraceutical.id);
      
      setIsDeleteDialogOpen(false);
      setSelectedNutraceutical(null);
      
      // Atualizar a lista de nutracêuticos
      fetchNutraceuticals();
      
      toast({
        title: "Sucesso",
        description: "Nutracêutico excluído com sucesso",
      });
    } catch (error) {
      console.error('Erro ao excluir nutracêutico:', error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir o nutracêutico",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Handler para formulário
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };
  
  // Para obter o nome de um outcome pelo ID
  const getOutcomeName = (outcomeId: string) => {
    const outcome = outcomes?.find(o => o.id === outcomeId);
    return outcome ? outcome.name : "Sem outcome";
  };
  
  // Resetar o formulário
  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      dosage: "",
      source: "",
      chemical_compound: "",
      contraindications: "",
      outcome_id: "",
      efficacy_score: 3,
      notes: "",
      study_id: ""
    });
    setRelations([]);
    setSelectedStudies([]);
  };
  
  // Handler para abrir diálogo de criação
  const handleOpenCreateDialog = () => {
    resetForm();
    setIsCreateDialogOpen(true);
  };
  
  // Handlers específicos para campos específicos
  
  // Handler para mudança em efficacy
  const handleEfficacyChange = (values: number[]) => {
    if (values.length > 0) {
      setFormData({
        ...formData,
        efficacy_score: values[0]
      });
    }
  };
  
  // Handler para mudança de outcome 
  const handleOutcomeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFormData({
      ...formData,
      outcome_id: e.target.value
    });
  };
  
  // Handler para mudança de estudo
  const handleStudyChange = (studyId: string) => {
    // Toggle seleção do estudo
    setSelectedStudies(prev => {
      const isAlreadySelected = prev.includes(studyId);
      if (isAlreadySelected) {
        return prev.filter(id => id !== studyId);
      } else {
        return [...prev, studyId];
      }
    });
  };

  return {
    searchTerm,
    setSearchTerm,
    isCreateDialogOpen,
    setIsCreateDialogOpen,
    isEditDialogOpen,
    setIsEditDialogOpen,
    isDeleteDialogOpen,
    setIsDeleteDialogOpen,
    isOutcomesDialogOpen,
    setIsOutcomesDialogOpen,
    selectedNutraceutical,
    filteredNutraceuticals,
    formData,
    relations,
    studies,
    outcomes,
    studiesLoading,
    selectedStudies,
    isLoading,
    // Handlers
    handleEditClick,
    handleDeleteClick,
    handleOutcomesClick,
    handleOpenCreateDialog,
    handleCreateSubmit,
    handleEditSubmit,
    handleDeleteConfirm,
    handleFormChange,
    handleOutcomeChange,
    handleEfficacyChange,
    handleStudyChange,
    handleAddRelation,
    handleRemoveRelation,
    handleStudiesDropped,
    getOutcomeName,
    fetchNutraceuticals
  };
};
