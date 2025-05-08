
import React from 'react';
import { Badge } from "@/components/ui/badge";

interface CategoryStat {
  category: string;
  count: number;
}

interface SankeyStatsProps {
  stats: Record<string, number>;
  linkCount: number;
}

const SankeyStats: React.FC<SankeyStatsProps> = ({ stats, linkCount }) => {
  const getCategoryInfo = (category: string) => {
    let color = "";
    let textColor = "";
    let label = category;
    
    switch (category) {
      case 'nutraceutico':
        color = "bg-blue-100";
        textColor = "text-blue-700";
        label = 'Nutracêuticos';
        break;
      case 'condicao':
        color = "bg-green-100";
        textColor = "text-green-700";
        label = 'Condições';
        break;
      case 'outcome':
        color = "bg-amber-100";
        textColor = "text-amber-700";
        label = 'Outcomes';
        break;
      case 'severidade':
        color = "bg-purple-100";
        textColor = "text-purple-700";
        label = 'Níveis de Severidade';
        break;
      case 'tratabilidade':
        color = "bg-rose-100";
        textColor = "text-rose-700";
        label = 'Tratabilidade';
        break;
      default:
        color = "bg-gray-100";
        textColor = "text-gray-700";
        label = category;
    }
    
    return { color, textColor, label };
  };
  
  return (
    <div className="flex items-center gap-2 flex-wrap">
      {Object.entries(stats).map(([category, count]) => {
        const { color, textColor, label } = getCategoryInfo(category);
        
        return (
          <Badge key={category} variant="outline" className={`${color} ${textColor}`}>
            {count} {label}
          </Badge>
        );
      })}
      <Badge variant="outline">
        {linkCount} Relações
      </Badge>
    </div>
  );
};

export default SankeyStats;
