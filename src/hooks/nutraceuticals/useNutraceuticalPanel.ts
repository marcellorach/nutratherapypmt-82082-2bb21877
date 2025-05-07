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
    if (!formData.outcome_id || formData.outcome_id === "no_outcome") return;
    
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
          
          // 4. Processar relações adicionais
          for (const relation of relations) {
            if (relation.outcome_id) {
              const relationsService = await import('@/services/nutraceuticals/relations-service');
              await relationsService.NutraceuticalRelationsService.relateToOutcome(
                createdNutraceutical.id,
                relation.outcome_id,
                'support', // Tipo padrão
                relation.efficacy_score,
                relation.notes
              );
              
              // Se a relação tem um estudo associado
              if (relation.study_id) {
                await relationsService.NutraceuticalRelationsService.relateToStudy(
                  createdNutraceutical.id,
                  relation.study_id,
                  relation.efficacy_score
                );
              }
            }
          }
        } catch (error) {
          console.error("Erro ao atualizar metadados ou relações:", error);
        }
      }

      toast({
        title: "Sucesso",
        description: "Nutracêutico criado com sucesso",
      });
      
      setIsCreateDialogOpen(false);
      resetFormData();
      fetchNutraceuticals();
    } catch (err) {
      console.error("Erro ao criar nutracêutico:", err);
      toast({
        title: "Erro",
        description: "Não foi possível criar o nutracêutico",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Handler para editar nutracêutico
  const handleEditSubmit = async () => {
    if (!selectedNutraceutical) return;
    
    setIsSaving(true);
    try {
      console.log('Iniciando atualização do nutracêutico:', selectedNutraceutical.id);
      console.log('Dados do formulário:', formData);
      
      // Garantir que contraindications seja sempre um array
      let contraindications = [];
      if (formData.contraindications) {
        if (typeof formData.contraindications === 'string') {
          contraindications = formData.contraindications
            .split("\n")
            .filter(line => line.trim() !== "");
        } else if (Array.isArray(formData.contraindications)) {
          contraindications = formData.contraindications;
        }
      }
      
      // 1. Atualizar o nutracêutico básico
      console.log('1. Atualizando dados básicos do nutracêutico');
      await updateNutraceutical(selectedNutraceutical.id, {
        name: formData.name,
        description: formData.description,
        dosage: formData.dosage,
        source: formData.source,
        chemical_compound: formData.chemical_compound,
        contraindications,
        outcome_id: formData.outcome_id === "no_outcome" ? null : formData.outcome_id || null
      });

      // 2. Atualizar metadados científicos
      try {
        console.log('2. Atualizando metadados científicos');
        const metadataService = await import('@/services/nutraceuticals/metadata-service');
        await metadataService.NutraceuticalMetadataService.updateScientificMetadata(
          selectedNutraceutical.id, 
          formData.efficacy_score
        );
          
        // Adicionar notas se houver
        if (formData.notes) {
          console.log('3. Atualizando notas do nutracêutico');
          const relationsService = await import('@/services/nutraceuticals/relations-service');
          await relationsService.NutraceuticalRelationsService.updateOutcomeRelation(
            selectedNutraceutical.id,
            formData.notes
          );
        }
        
        // 3. Atualizar estudos relacionados
        console.log('4. Atualizando estudos relacionados');
        const relationsService = await import('@/services/nutraceuticals/relations-service');
        
        // Primeiro, obter as relações de estudos existentes
        const existingStudyRelations = await relationsService.NutraceuticalRelationsService.getStudyRelations(
          selectedNutraceutical.id
        );
        
        console.log('Relações existentes:', existingStudyRelations);
        console.log('Estudos selecionados:', selectedStudies);
        
        // Remover relações que não estão mais presentes
        if (existingStudyRelations && existingStudyRelations.length > 0) {
          for (const relation of existingStudyRelations) {
            if (!selectedStudies.includes(relation.study_id)) {
              console.log('Removendo relação com estudo:', relation.study_id);
              await relationsService.NutraceuticalRelationsService.removeStudyRelation(relation.id);
            }
          }
        }
        
        // Adicionar novas relações de estudo
        const existingStudyIds = existingStudyRelations?.map((rel: any) => rel.study_id) || [];
        for (const studyId of selectedStudies) {
          if (!existingStudyIds.includes(studyId)) {
            console.log('Adicionando nova relação com estudo:', studyId);
            await relationsService.NutraceuticalRelationsService.relateToStudy(
              selectedNutraceutical.id,
              studyId,
              formData.efficacy_score
            );
          }
        }
        
        // 4. Processar relações adicionais
        if (relations && relations.length > 0) {
          console.log('5. Processando relações adicionais:', relations.length);
          for (const relation of relations) {
            if (relation.outcome_id) {
              await relationsService.NutraceuticalRelationsService.relateToOutcome(
                selectedNutraceutical.id,
                relation.outcome_id,
                'support',
                relation.efficacy_score,
                relation.notes
              );
              
              if (relation.study_id) {
                await relationsService.NutraceuticalRelationsService.relateToStudy(
                  selectedNutraceutical.id,
                  relation.study_id,
                  relation.efficacy_score
                );
              }
            }
          }
        }
      } catch (error) {
        console.error("Erro ao atualizar metadados científicos:", error);
        throw error; // Re-lançar erro para tratamento no bloco catch principal
      }

      console.log('Atualização do nutracêutico concluída com sucesso');
      toast({
        title: "Sucesso",
        description: "Nutracêutico atualizado com sucesso",
        variant: "default"
      });
      
      setIsEditDialogOpen(false);
      fetchNutraceuticals();
    } catch (err) {
      console.error("Erro ao atualizar nutracêutico:", err);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o nutracêutico. Verifique os dados informados.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Handler para excluir nutracêutico
  const handleDeleteConfirm = async () => {
    if (!selectedNutraceutical) return;
    
    try {
      await deleteNutraceutical(selectedNutraceutical.id);

      toast({
        title: "Sucesso",
        description: "Nutracêutico excluído com sucesso",
      });
      
      setIsDeleteDialogOpen(false);
      fetchNutraceuticals();
    } catch (err) {
      toast({
        title: "Erro",
        description: "Não foi possível excluir o nutracêutico",
        variant: "destructive",
      });
    }
  };

  // Resetar dados do formulário
  const resetFormData = () => {
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
    resetFormData();
    setIsCreateDialogOpen(true);
  };

  // Handler para alterar dados do formulário
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handler para alterar outcome no select
  const handleOutcomeChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      outcome_id: value
    }));
  };

  // Handler para alterar o score de eficácia
  const handleEfficacyChange = (value: number[]) => {
    setFormData(prev => ({
      ...prev,
      efficacy_score: value[0]
    }));
  };

  // Handler para alterar o estudo selecionado
  const handleStudyChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      study_id: value
    }));
  };

  // Função para obter o nome do outcome
  const getOutcomeName = (outcomeId: string | null) => {
    if (!outcomeId) return "Sem outcome";
    const outcome = outcomes?.find(out => out.id === outcomeId);
    return outcome ? outcome.name : "Outcome desconhecido";
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
    setSelectedNutraceutical,
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
