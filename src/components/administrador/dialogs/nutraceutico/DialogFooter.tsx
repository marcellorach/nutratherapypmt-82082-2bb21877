
import React from 'react';
import { DialogFooter as UIDialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FileText, BookOpen } from "lucide-react";

export const DialogFooter: React.FC = () => {
  return (
    <UIDialogFooter>
      <div className="flex justify-between w-full">
        <Button variant="outline">
          <FileText className="h-4 w-4 mr-2" />
          Exportar informações
        </Button>
        <Button>
          <BookOpen className="h-4 w-4 mr-2" />
          Ver estudos completos
        </Button>
      </div>
    </UIDialogFooter>
  );
};
