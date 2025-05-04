import React, { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useNutraceuticals } from "@/hooks/nutraceuticals/useNutraceuticals";
import { useOutcomes } from "@/hooks/nutraceuticals/useOutcomes";
import { useConditions } from "@/hooks/nutraceuticals/useConditions";
import { useStudies } from "@/hooks/nutraceuticals/useStudies";

// Componentes refatorados
import FormDialog from "./nutraceuticalManagement/FormDialog";
import DeleteDialog from "./nutraceuticalManagement/DeleteDialog";
import NutraceuticalTable from "./nutraceuticalManagement/NutraceuticalTable";
import SearchBar from "./nutraceuticalManagement/SearchBar";
import OutcomesDialog from "./nutraceuticalManagement/OutcomesDialog";

const NutraceuticalManagementPanel: React.FC = () => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isOutcomesDialogOpen, setIsOutcomesDialogOpen] = useState(false);
  const [selectedNutraceutical, setSelectedNutraceutical] = useState<any>(null);
  const [filteredNutraceuticals, setFilteredNutraceuticals] = useState<any[]>([]);
  
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
  const handleEditClick = (nutraceutical: any) => {
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
      efficacy_score: nutraceutical.efficacy_score || 3,
      notes: "",
      study_id: ""
    });
    setRelations([]);
    setIsEditDialogOpen(true);
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

  // Handler para criar novo nutracêutico
  const handleCreateSubmit = async () => {
    try {
      const contraindications = formData.contraindications
        .split("\n")
        .filter(line => line.trim() !== "");

      await createNutraceutical({
        ...formData,
        contraindications
      });

      toast({
        title: "Sucesso",
        description: "Nutracêutico criado com sucesso",
      });
      
      setIsCreateDialogOpen(false);
      resetFormData();
      fetchNutraceuticals();
    } catch (err) {
      toast({
        title: "Erro",
        description: "Não foi possível criar o nutracêutico",
        variant: "destructive",
      });
    }
  };

  // Handler para editar nutracêutico
  const handleEditSubmit = async () => {
    if (!selectedNutraceutical) return;
    
    try {
      const contraindications = formData.contraindications
        .split("\n")
        .filter(line => line.trim() !== "");

      // Primeiro atualiza o nutracêutico básico
      await updateNutraceutical(selectedNutraceutical.id, {
        name: formData.name,
        description: formData.description,
        dosage: formData.dosage,
        source: formData.source,
        chemical_compound: formData.chemical_compound,
        contraindications
      });

      // Depois atualiza as relações, se houver outcome selecionado
      if (formData.outcome_id && formData.outcome_id !== "no_outcome") {
        // Atualize o outcome principal do nutracêutico
        await updateNutraceutical(selectedNutraceutical.id, {
          outcome_id: formData.outcome_id,
        });
        
        try {
          // Atualiza os metadados científicos (eficácia, notas)
          const metadataService = await import('@/services/nutraceuticals/metadata-service');
          await metadataService.NutraceuticalMetadataService.updateScientificMetadata(
            selectedNutraceutical.id, 
            formData.efficacy_score
          );
          
          // Adiciona as notas se houver
          if (formData.notes) {
            const relationsService = await import('@/services/nutraceuticals/relations-service');
            await relationsService.NutraceuticalRelationsService.updateOutcomeRelation(
              selectedNutraceutical.id,
              formData.notes
            );
          }
          
          // Se houver estudo selecionado, relaciona ao nutracêutico
          if (formData.study_id) {
            const relationsService = await import('@/services/nutraceuticals/relations-service');
            await relationsService.NutraceuticalRelationsService.relateToStudy(
              selectedNutraceutical.id,
              formData.study_id,
              formData.efficacy_score
            );
          }
          
          // Processa as relações adicionais
          for (const relation of relations) {
            if (relation.outcome_id) {
              // Aqui idealmente criaríamos relações separadas no banco para cada outcome
              // ou salvaria de alguma forma esta relação múltipla
              console.log("Salvando relação adicional:", relation);
              
              // Este é um pseudo-código, precisamos implementar esta funcionalidade no backend
              /*
              await relationsService.NutraceuticalRelationsService.createSecondaryOutcomeRelation(
                selectedNutraceutical.id,
                relation.outcome_id,
                relation.efficacy_score,
                relation.notes,
                relation.study_id
              );
              */
            }
          }
        } catch (error) {
          console.error("Erro ao atualizar metadados científicos:", error);
        }
      }

      toast({
        title: "Sucesso",
        description: "Nutracêutico atualizado com sucesso",
      });
      
      setIsEditDialogOpen(false);
      fetchNutraceuticals();
    } catch (err) {
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o nutracêutico",
        variant: "destructive",
      });
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Gerenciamento de Nutracêuticos</h3>
        <Button onClick={handleOpenCreateDialog}>
          Novo Nutracêutico
        </Button>
      </div>
      
      <SearchBar searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
      
      <NutraceuticalTable 
        filteredNutraceuticals={filteredNutraceuticals}
        isLoading={isLoading}
        onEditClick={handleEditClick}
        onDeleteClick={handleDeleteClick}
        onOutcomesClick={handleOutcomesClick}
        getOutcomeName={getOutcomeName}
      />
      
      {/* Diálogo de criar nutracêutico */}
      <FormDialog
        isOpen={isCreateDialogOpen}
        setIsOpen={setIsCreateDialogOpen}
        isCreate={true}
        formData={formData}
        handleFormChange={handleFormChange}
        handleOutcomeChange={handleOutcomeChange}
        handleEfficacyChange={handleEfficacyChange}
        handleStudyChange={handleStudyChange}
        handleAddRelation={handleAddRelation}
        handleRemoveRelation={handleRemoveRelation}
        submitAction={handleCreateSubmit}
        relations={relations}
        studies={studies}
        outcomes={outcomes}
        studiesLoading={studiesLoading}
      />
      
      {/* Diálogo de editar nutracêutico */}
      <FormDialog
        isOpen={isEditDialogOpen}
        setIsOpen={setIsEditDialogOpen}
        isCreate={false}
        formData={formData}
        handleFormChange={handleFormChange}
        handleOutcomeChange={handleOutcomeChange}
        handleEfficacyChange={handleEfficacyChange}
        handleStudyChange={handleStudyChange}
        handleAddRelation={handleAddRelation}
        handleRemoveRelation={handleRemoveRelation}
        submitAction={handleEditSubmit}
        relations={relations}
        studies={studies}
        outcomes={outcomes}
        studiesLoading={studiesLoading}
      />
      
      {/* Diálogo de excluir nutracêutico */}
      <DeleteDialog
        isOpen={isDeleteDialogOpen}
        setIsOpen={setIsDeleteDialogOpen}
        name={selectedNutraceutical?.name || ""}
        onConfirm={handleDeleteConfirm}
      />
      
      {/* Diálogo de gerenciar outcomes */}
      <OutcomesDialog
        isOpen={isOutcomesDialogOpen}
        setIsOpen={setIsOutcomesDialogOpen}
        nutraceutical={selectedNutraceutical}
        onComplete={fetchNutraceuticals}
      />
    </div>
  );
};

export default NutraceuticalManagementPanel;
