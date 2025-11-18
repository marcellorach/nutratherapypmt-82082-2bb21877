
import React from 'react';
import { Badge } from "@/components/ui/badge";
import { DialogHeader as UIDialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Nutraceutical } from "@/types";
import { useTranslation } from 'react-i18next';

interface DialogHeaderProps {
  nutraceutical: Nutraceutical;
  getEfficacyColor: (score: number) => string;
}

export const DialogHeader: React.FC<DialogHeaderProps> = ({ nutraceutical, getEfficacyColor }) => {
  const { t } = useTranslation();
  
  return (
    <UIDialogHeader>
      <div className="flex flex-wrap gap-2 items-center mb-1">
        <Badge variant="outline" className={getEfficacyColor(nutraceutical.scientificEvidence.efficacyScore)}>
          {t('nutraceuticals.details.efficacy')}: {nutraceutical.scientificEvidence.efficacyScore.toFixed(1)}/5
        </Badge>
        <Badge variant="outline" className="bg-slate-50">
          {nutraceutical.condition}
        </Badge>
      </div>
      <DialogTitle className="text-xl">{nutraceutical.name}</DialogTitle>
      <DialogDescription>
        {nutraceutical.description}
      </DialogDescription>
    </UIDialogHeader>
  );
};
