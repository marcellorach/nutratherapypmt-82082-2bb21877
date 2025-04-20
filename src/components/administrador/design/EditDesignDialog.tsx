
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ArrowRight, Sparkles } from "lucide-react";

interface EditDesignDialogProps {
  isOpen: boolean;
  onClose: () => void;
  editText: string;
  editingSection: string;
  onEditTextChange: (text: string) => void;
  onAIAssistance: () => void;
  onInitiateApproval: () => void;
  isAIAssistanceActive: boolean;
}

export const EditDesignDialog = ({
  isOpen,
  onClose,
  editText,
  editingSection,
  onEditTextChange,
  onAIAssistance,
  onInitiateApproval,
  isAIAssistanceActive
}: EditDesignDialogProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Editar {editingSection}</DialogTitle>
          <DialogDescription>
            Use o assistente de IA para ajudar nas alterações de design. As alterações passarão por aprovação antes de serem aplicadas.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <Textarea
            value={editText}
            onChange={(e) => onEditTextChange(e.target.value)}
            className="min-h-[200px]"
            placeholder="Descreva as alterações desejadas..."
          />
          
          <div className="flex justify-between items-center">
            <Button 
              onClick={onAIAssistance}
              variant="ghost"
              className="flex items-center gap-2"
              disabled={isAIAssistanceActive}
            >
              <Sparkles className="w-4 h-4" />
              Assistente de IA
            </Button>

            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button 
                onClick={onInitiateApproval}
                className="flex items-center gap-2"
              >
                <ArrowRight className="w-4 h-4" />
                Iniciar Aprovação
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
