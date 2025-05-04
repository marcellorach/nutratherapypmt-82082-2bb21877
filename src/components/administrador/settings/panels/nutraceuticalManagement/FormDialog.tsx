
import React from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { 
  Select,
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface FormDialogProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  isCreate: boolean;
  formData: any;
  handleFormChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  handleOutcomeChange: (value: string) => void;
  handleEfficacyChange: (value: number[]) => void;
  handleStudyChange: (value: string) => void;
  handleAddRelation: () => void;
  handleRemoveRelation: (index: number) => void;
  submitAction: () => void;
  relations: any[];
  studies: any[];
  outcomes: any[];
  studiesLoading: boolean;
}

const FormDialog: React.FC<FormDialogProps> = ({
  isOpen,
  setIsOpen,
  isCreate,
  formData,
  handleFormChange,
  handleOutcomeChange,
  handleEfficacyChange,
  handleStudyChange,
  handleAddRelation,
  handleRemoveRelation,
  submitAction,
  relations,
  studies,
  outcomes,
  studiesLoading,
}) => {
  const title = isCreate ? "Criar Nutracêutico" : "Editar Nutracêutico";
  const description = isCreate 
    ? "Preencha os campos abaixo para criar um novo nutracêutico." 
    : "Edite as informações do nutracêutico selecionado.";

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
              value={formData.study_id} 
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
          <RelationsList relations={relations} onRemoveRelation={handleRemoveRelation} />
          
          {/* Campos adicionais do formulário */}
          <BasicInfoFields formData={formData} handleFormChange={handleFormChange} />
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

// Componente para exibir a lista de relações
const RelationsList: React.FC<{ 
  relations: any[],
  onRemoveRelation: (index: number) => void
}> = ({ relations, onRemoveRelation }) => {
  if (relations.length === 0) return null;

  return (
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
              onClick={() => onRemoveRelation(index)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-trash-2">
                <path d="M3 6h18"></path>
                <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                <line x1="10" x2="10" y1="11" y2="17"></line>
                <line x1="14" x2="14" y1="11" y2="17"></line>
              </svg>
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
};

// Componente para os campos de informações básicas
const BasicInfoFields: React.FC<{
  formData: any;
  handleFormChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
}> = ({ formData, handleFormChange }) => {
  return (
    <>
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
    </>
  );
};

export default FormDialog;
