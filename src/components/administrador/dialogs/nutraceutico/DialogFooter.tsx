
import React from 'react';
import { DialogFooter as UIDialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FileText, BookOpen } from "lucide-react";
import { useTranslation } from 'react-i18next';

export const DialogFooter: React.FC = () => {
  const { t } = useTranslation();
  
  return (
    <UIDialogFooter>
      <div className="flex justify-between w-full">
        <Button variant="outline">
          <FileText className="h-4 w-4 mr-2" />
          {t('nutraceuticals.details.exportInfo')}
        </Button>
        <Button>
          <BookOpen className="h-4 w-4 mr-2" />
          {t('nutraceuticals.details.viewFullStudies')}
        </Button>
      </div>
    </UIDialogFooter>
  );
};
