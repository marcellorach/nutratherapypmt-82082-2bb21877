
import React, { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2, Search, Pencil } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useNutraceuticals } from "@/hooks/nutraceuticals/useNutraceuticals";
import { useOutcomes } from "@/hooks/nutraceuticals/useOutcomes";
import { useConditions } from "@/hooks/nutraceuticals/useConditions";
import { useStudies } from "@/hooks/nutraceuticals/useStudies";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select,
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import NutraceuticalConditionsEditor from "./NutraceuticalConditionsEditor";

const NutraceuticalManagementPanel: React.FC = () => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isConditionsDialogOpen, setIsConditionsDialogOpen] = useState(false);
  const [selectedNutraceutical, setSelectedNutraceutical] = useState<any>(null);
  const [filteredNutraceuticals, setFilteredNutraceuticals] = useState<any[]>([]);
  const [selectedStudy, setSelectedStudy] = useState<string>("");
  const [relations, setRelations] = useState<any[]>([]);
  
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
    notes: "" // Notas sobre a relação outcome/nutracêutico
  });

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
      efficacy_score: 3,
      notes: ""
    });
    setRelations([]);
    setIsEditDialogOpen(true);
  };

  // Handler para abrir o diálogo de exclusão
  const handleDeleteClick = (nutraceutical: any) => {
    setSelectedNutraceutical(nutraceutical);
    setIsDeleteDialogOpen(true);
  };

  // Handler para abrir o diálogo de condições
  const handleConditionsClick = (nutraceutical: any) => {
    setSelectedNutraceutical(nutraceutical);
    setIsConditionsDialogOpen(true);
  };

  // Handler para adicionar uma relação à lista
  const handleAddRelation = () => {
    if (!formData.outcome_id || formData.outcome_id === "no_outcome") return;
    
    const outcome = outcomes?.find(out => out.id === formData.outcome_id);
    
    const newRelation = {
      outcome_id: formData.outcome_id,
      outcome_name: outcome ? outcome.name : "Outcome desconhecido",
      efficacy_score: formData.efficacy_score,
      notes: formData.notes,
      study_id: selectedStudy,
      study_name: studies.find(s => s.id === selectedStudy)?.title || ""
    };
    
    setRelations([...relations, newRelation]);
    
    // Limpar campos após adicionar
    setFormData({
      ...formData,
      outcome_id: "",
      efficacy_score: 3,
      notes: ""
    });
    setSelectedStudy("");
    
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
          if (selectedStudy) {
            const relationsService = await import('@/services/nutraceuticals/relations-service');
            await relationsService.NutraceuticalRelationsService.relateToStudy(
              selectedNutraceutical.id,
              selectedStudy,
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
      notes: ""
    });
    setRelations([]);
    setSelectedStudy("");
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
    setSelectedStudy(value);
  };

  // Função para obter o nome do outcome
  const getOutcomeName = (outcomeId: string | null) => {
    if (!outcomeId) return "Sem outcome";
    const outcome = outcomes?.find(out => out.id === outcomeId);
    return outcome ? outcome.name : "Outcome desconhecido";
  };

  // Renderizar diálogo de formulário (compartilhado entre criar e editar)
  const renderFormDialog = (isCreate: boolean) => {
    const title = isCreate ? "Criar Nutracêutico" : "Editar Nutracêutico";
    const description = isCreate 
      ? "Preencha os campos abaixo para criar um novo nutracêutico." 
      : "Edite as informações do nutracêutico selecionado.";
    const submitAction = isCreate ? handleCreateSubmit : handleEditSubmit;
    const isOpen = isCreate ? isCreateDialogOpen : isEditDialogOpen;
    const setIsOpen = isCreate ? setIsCreateDialogOpen : setIsEditDialogOpen;
    
    return (
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Nome</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleFormChange}
                placeholder="Nome do nutracêutico"
              />
            </div>
            
            {/* Campo de Outcome e Eficácia lado a lado */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="outcome">Outcome Principal</Label>
                <Select 
                  value={formData.outcome_id} 
                  onValueChange={handleOutcomeChange}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecione um outcome" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="no_outcome">Sem outcome</SelectItem>
                    {outcomes?.map((outcome) => (
                      <SelectItem key={outcome.id} value={outcome.id}>
                        {outcome.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="efficacy_score">Nota de Eficácia (0-5): {formData.efficacy_score}</Label>
                <Slider
                  id="efficacy_score"
                  name="efficacy_score"
                  value={[formData.efficacy_score]}
                  min={0}
                  max={5}
                  step={1}
                  onValueChange={handleEfficacyChange}
                  className="py-4"
                />
              </div>
            </div>

            {/* Seleção de Estudo Associado */}
            <div className="grid gap-2">
              <Label htmlFor="study">Estudo Científico Associado</Label>
              <Select 
                value={selectedStudy} 
                onValueChange={handleStudyChange}
                disabled={studiesLoading}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione um estudo científico" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Nenhum estudo selecionado</SelectItem>
                  {studies?.map((study) => (
                    <SelectItem key={study.id} value={study.id}>
                      {study.title || "Estudo sem título"} ({study.year || "s/ano"})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* Notas sobre a relação */}
            <div className="grid gap-2">
              <Label htmlFor="notes">Notas sobre a relação com o outcome</Label>
              <Textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleFormChange}
                placeholder="Observações sobre como este nutracêutico se relaciona com o outcome"
                rows={2}
              />
            </div>
            
            {/* Botão para adicionar a relação à lista */}
            {formData.outcome_id && formData.outcome_id !== "no_outcome" && (
              <div className="flex justify-end">
                <Button 
                  type="button" 
                  onClick={handleAddRelation}
                  variant="outline"
                >
                  Adicionar mais uma relação
                </Button>
              </div>
            )}
            
            {/* Lista de relações adicionadas */}
            {relations.length > 0 && (
              <div className="border rounded-md p-4 mt-2 bg-slate-50">
                <h4 className="font-medium mb-3">Relações adicionais</h4>
                <div className="space-y-2">
                  {relations.map((rel, index) => (
                    <div key={index} className="flex justify-between items-center border-b pb-2">
                      <div>
                        <div className="font-medium">{rel.outcome_name}</div>
                        <div className="text-sm text-muted-foreground">
                          Eficácia: {rel.efficacy_score} 
                          {rel.study_name && ` | Estudo: ${rel.study_name}`}
                        </div>
                        {rel.notes && <div className="text-sm mt-1">{rel.notes}</div>}
                      </div>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="text-red-500"
                        onClick={() => handleRemoveRelation(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <div className="grid gap-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleFormChange}
                placeholder="Descrição do nutracêutico"
                rows={3}
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="dosage">Dosagem</Label>
              <Input
                id="dosage"
                name="dosage"
                value={formData.dosage}
                onChange={handleFormChange}
                placeholder="Dosagem recomendada"
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="source">Fonte</Label>
              <Input
                id="source"
                name="source"
                value={formData.source}
                onChange={handleFormChange}
                placeholder="Fonte do nutracêutico"
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="chemical_compound">Composto Químico</Label>
              <Input
                id="chemical_compound"
                name="chemical_compound"
                value={formData.chemical_compound}
                onChange={handleFormChange}
                placeholder="Composto químico principal"
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="contraindications">Contraindicações</Label>
              <Textarea
                id="contraindications"
                name="contraindications"
                value={formData.contraindications}
                onChange={handleFormChange}
                placeholder="Contraindicações (uma por linha)"
                rows={4}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsOpen(false)}
            >
              Cancelar
            </Button>
            <Button onClick={submitAction}>
              {isCreate ? "Criar" : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Gerenciamento de Nutracêuticos</h3>
        <Button onClick={handleOpenCreateDialog}>
          Novo Nutracêutico
        </Button>
      </div>
      
      <div className="flex items-center gap-2">
        <Search className="h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome ou descrição..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
      </div>
      
      {isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Outcome</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredNutraceuticals.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-6 text-muted-foreground">
                    Nenhum nutracêutico encontrado
                  </TableCell>
                </TableRow>
              ) : (
                filteredNutraceuticals.map((nutraceutical) => (
                  <TableRow key={nutraceutical.id}>
                    <TableCell>{nutraceutical.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {getOutcomeName(nutraceutical.outcome_id)}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-md truncate">
                      {nutraceutical.description || "Sem descrição"}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleConditionsClick(nutraceutical)}
                          title="Gerenciar condições"
                        >
                          Condições
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleEditClick(nutraceutical)}
                          title="Editar"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleDeleteClick(nutraceutical)}
                          title="Excluir"
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}
      
      {/* Diálogo de criar nutracêutico */}
      {renderFormDialog(true)}
      
      {/* Diálogo de editar nutracêutico */}
      {renderFormDialog(false)}
      
      {/* Diálogo de excluir nutracêutico */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir Nutracêutico</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir o nutracêutico "{selectedNutraceutical?.name}"? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteConfirm}
            >
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Diálogo de gerenciar condições */}
      <Dialog open={isConditionsDialogOpen} onOpenChange={setIsConditionsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Gerenciar Condições de Saúde</DialogTitle>
            <DialogDescription>
              Associe condições de saúde ao nutracêutico "{selectedNutraceutical?.name}".
            </DialogDescription>
          </DialogHeader>
          
          {selectedNutraceutical && (
            <NutraceuticalConditionsEditor 
              nutraceutical={selectedNutraceutical}
              onComplete={() => {
                setIsConditionsDialogOpen(false);
                // Recarregar os dados para refletir as mudanças
                fetchNutraceuticals();
              }}
            />
          )}
          
          <DialogFooter>
            <Button 
              onClick={() => setIsConditionsDialogOpen(false)}
            >
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default NutraceuticalManagementPanel;
