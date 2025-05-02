
import React, { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, Search, Pencil } from "lucide-react";
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
import { useCategories } from "@/hooks/nutraceuticals/useCategories";
import { useConditions } from "@/hooks/nutraceuticals/useConditions";
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
  
  // Form state
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    dosage: "",
    source: "",
    chemical_compound: "",
    contraindications: "",
    category_id: ""
  });

  // Hooks para carregar dados
  const { nutraceuticals, isLoading, fetchNutraceuticals, createNutraceutical, updateNutraceutical, deleteNutraceutical } = useNutraceuticals();
  const { categories, fetchCategories } = useCategories();
  const { conditions, fetchConditions } = useConditions();

  // Carregar dados iniciais
  useEffect(() => {
    fetchNutraceuticals();
    fetchCategories();
    fetchConditions();
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
      category_id: nutraceutical.category_id || ""
    });
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

      await updateNutraceutical(selectedNutraceutical.id, {
        ...formData,
        contraindications
      });

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
      category_id: ""
    });
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

  // Handler para alterar categoria no select
  const handleCategoryChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      category_id: value
    }));
  };

  // Função para obter o nome da categoria
  const getCategoryName = (categoryId: string | null) => {
    if (!categoryId) return "Sem categoria";
    const category = categories?.find(cat => cat.id === categoryId);
    return category ? category.name : "Categoria desconhecida";
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
            
            <div className="grid gap-2">
              <Label htmlFor="category">Categoria</Label>
              <Select 
                value={formData.category_id} 
                onValueChange={handleCategoryChange}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione uma categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="no_category">Sem categoria</SelectItem>
                  {categories?.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
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
          <Plus className="h-4 w-4 mr-2" />
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
                <TableHead>Categoria</TableHead>
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
                        {getCategoryName(nutraceutical.category_id)}
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
                          <Plus className="h-4 w-4" />
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
