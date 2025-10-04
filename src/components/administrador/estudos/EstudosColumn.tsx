
import React from 'react';
import { Badge } from "@/components/ui/badge";
import EstudoCard from './cards/EstudoCard';
import { Plus, FileText, ClipboardCheck } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useTranslation } from 'react-i18next';

interface EstudosColumnProps {
  title: string;
  icon: "new" | "review" | "approved";
  estudos: any[];
  onViewEstudo: (estudo: any) => void;
  onAddEstudo?: () => void;
  buttonLabel?: string;
  getNutraceuticalScore: (name: string) => number;
}

const EstudosColumn: React.FC<EstudosColumnProps> = ({ 
  title, 
  icon, 
  estudos, 
  onViewEstudo,
  onAddEstudo,
  buttonLabel,
  getNutraceuticalScore
}) => {
  const { t } = useTranslation();
  
  const Icon = {
    new: FileText,
    review: ClipboardCheck,
    approved: FileText
  }[icon];
  
  const getEmptyMessage = () => {
    if (icon === 'review') return t('studies.kanban.noStudies', { status: t('studies.kanban.statusReview') });
    if (icon === 'approved') return t('studies.kanban.noStudies', { status: t('studies.kanban.statusApproved') });
    return t('studies.kanban.noStudies', { status: t('studies.kanban.statusNew') });
  };

  return (
    <div className="flex flex-col space-y-4">
      <h3 className="text-lg font-semibold flex items-center gap-2">
        <Icon className="h-5 w-5" />
        {title}
        {estudos.length > 0 && (
          <Badge variant="secondary">{estudos.length}</Badge>
        )}
      </h3>
      <div className="bg-secondary/20 rounded-lg p-4 min-h-[500px]">
        <div className="grid gap-4">
          {estudos.map(estudo => (
            <EstudoCard
              key={estudo.id}
              estudo={estudo}
              onView={onViewEstudo}
              buttonLabel={buttonLabel}
              getNutraceuticalScore={getNutraceuticalScore}
            />
          ))}
          
          {onAddEstudo && (
            <Card 
              className="border-dashed border-2 border-gray-300 bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer" 
              onClick={onAddEstudo}
            >
              <CardContent className="flex flex-col items-center justify-center py-6">
                <Plus className="h-8 w-8 text-gray-400" />
                <p className="text-gray-500 mt-2">{t('studies.kanban.addNew')}</p>
              </CardContent>
            </Card>
          )}
          
          {estudos.length === 0 && !onAddEstudo && (
            <div className="flex flex-col items-center justify-center h-40 text-gray-500">
              <Icon className="h-10 w-10 mb-2 opacity-30" />
              <p>{getEmptyMessage()}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EstudosColumn;
