
import React from 'react';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FormDialogProps } from "./types";
import DialogFormContent from './form/DialogContent';

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
  handleStudiesDropped,
  selectedStudies
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isCreate ? "Criar novo nutracêutico" : "Editar nutracêutico"}</DialogTitle>
          <DialogDescription>
            {isCreate 
              ? "Preencha os campos abaixo para adicionar um novo nutracêutico ao sistema."
              : "Edite as informações do nutracêutico."
            }
          </DialogDescription>
        </DialogHeader>
        
        <DialogFormContent 
          isCreate={isCreate}
          formData={formData}
          handleFormChange={handleFormChange}
          handleOutcomeChange={handleOutcomeChange}
          handleEfficacyChange={handleEfficacyChange}
          handleStudyChange={handleStudyChange}
          handleAddRelation={handleAddRelation}
          handleRemoveRelation={handleRemoveRelation}
          relations={relations}
          studies={studies}
          outcomes={outcomes}
          studiesLoading={studiesLoading}
          selectedStudies={selectedStudies}
          handleStudiesDropped={handleStudiesDropped}
        />
        
        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => setIsOpen(false)}
          >
            Cancelar
          </Button>
          <Button 
            onClick={submitAction}
            variant="default"
          >
            {isCreate ? "Criar Nutracêutico" : "Salvar Alterações"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default FormDialog;
