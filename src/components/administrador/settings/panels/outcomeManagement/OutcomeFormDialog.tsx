
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import FamilySelector from "./FamilySelector";
import { useTranslation } from 'react-i18next';

interface OutcomeFormDialogProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  isCreate: boolean;
  formData: {
    name: string;
    description: string;
    family_id: string;
  };
  handleFormChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  handleFamilyChange: (value: string) => void;
  submitAction: () => void;
}

const OutcomeFormDialog: React.FC<OutcomeFormDialogProps> = ({
  isOpen,
  setIsOpen,
  isCreate,
  formData,
  handleFormChange,
  handleFamilyChange,
  submitAction,
}) => {
  const { t } = useTranslation();
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitAction();
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {isCreate ? t('outcomeManagement.form.createTitle') : t('outcomeManagement.form.editTitle')}
          </DialogTitle>
          <DialogDescription>
            {isCreate 
              ? t('outcomeManagement.form.createDescription')
              : t('outcomeManagement.form.editDescription')
            }
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                {t('outcomeManagement.form.nameLabel')}
              </Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleFormChange}
                className="col-span-3"
                required
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="family" className="text-right">
                {t('outcomeManagement.form.familyLabel')}
              </Label>
              <div className="col-span-3">
                <FamilySelector
                  value={formData.family_id}
                  onValueChange={handleFamilyChange}
                  placeholder={t('outcomeManagement.form.familyPlaceholder')}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right">
                {t('outcomeManagement.form.descriptionLabel')}
              </Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleFormChange}
                className="col-span-3"
                rows={4}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
              {t('outcomeManagement.form.cancel')}
            </Button>
            <Button type="submit">
              {isCreate ? t('outcomeManagement.form.create') : t('outcomeManagement.form.save')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default OutcomeFormDialog;
