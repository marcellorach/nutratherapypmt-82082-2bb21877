
import React from 'react';
import { CardHeader as UICardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from 'react-i18next';

interface CardHeaderProps {
  title: string;
  description: string;
  condition: string;
  priority: number;
}

const CardHeader: React.FC<CardHeaderProps> = ({
  title,
  description,
  condition,
  priority
}) => {
  const { t } = useTranslation();
  
  const getPriorityColor = (priority: number) => {
    switch(priority) {
      case 1: return "bg-red-500";
      case 2: return "bg-orange-500";
      case 3: return "bg-yellow-500";
      default: return "bg-green-500";
    }
  };

  return (
    <UICardHeader className="pb-2">
      <div className="bg-slate-50 -mx-6 -mt-6 px-6 py-2 border-b mb-4">
        <p className="font-medium text-sm">{t('recommendations.card.condition')}: {condition}</p>
      </div>
      
      <div className="flex justify-between items-start">
        <CardTitle className="text-lg font-medium">{title}</CardTitle>
        <Badge className={`${getPriorityColor(priority)}`}>
          {t('recommendations.card.priority')} {priority}
        </Badge>
      </div>
      <CardDescription>{description}</CardDescription>
    </UICardHeader>
  );
};

export default CardHeader;
