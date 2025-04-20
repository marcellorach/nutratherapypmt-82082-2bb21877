
import React from 'react';
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Circle, Clock } from "lucide-react";

interface StageItem {
  name: string;
  status: 'completed' | 'in-progress' | 'pending';
}

interface ApprovalStagesListProps {
  stages: StageItem[];
}

const ApprovalStagesList: React.FC<ApprovalStagesListProps> = ({ stages }) => {
  if (!stages || stages.length === 0) {
    return null;
  }

  const getIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return CheckCircle;
      case 'in-progress':
        return Clock;
      default:
        return Circle;
    }
  };

  return (
    <div className="mt-4">
      <h4 className="text-sm font-medium mb-2">Estágios de Aprovação</h4>
      <ul className="space-y-2">
        {stages.map((stage, index) => {
          const StageIcon = getIcon(stage.status);
          
          return (
            <li key={index} className="flex items-center gap-2">
              <div className={`
                flex items-center justify-between w-full p-2 rounded-md
                ${stage.status === 'completed' ? 'bg-green-50' : 
                  stage.status === 'in-progress' ? 'bg-amber-50' : 'bg-gray-50'}
              `}>
                <div className="flex items-center gap-2">
                  <StageIcon className={`h-4 w-4 
                    ${stage.status === 'completed' ? 'text-green-500' : 
                      stage.status === 'in-progress' ? 'text-amber-500' : 'text-gray-400'}
                  `} />
                  <span className="text-sm font-medium">{stage.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={`
                    ${stage.status === 'completed' ? 'bg-green-100 text-green-800 hover:bg-green-200' : 
                      stage.status === 'in-progress' ? 'bg-amber-100 text-amber-800 hover:bg-amber-200' : 
                      'bg-gray-100 text-gray-800 hover:bg-gray-200'}
                  `}>
                    {stage.status === 'completed' ? 'Concluído' : 
                      stage.status === 'in-progress' ? 'Em Andamento' : 'Pendente'}
                  </Badge>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default ApprovalStagesList;
