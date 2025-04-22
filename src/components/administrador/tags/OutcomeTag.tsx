
import React from 'react';
import { Badge } from "@/components/ui/badge";
import { AlertTriangle } from "lucide-react";

interface OutcomeTagProps {
  condition: string;
  score: number;
  size?: "small" | "medium";
  isSimulated?: boolean;
}

const OutcomeTag: React.FC<OutcomeTagProps> = ({ 
  condition, 
  score,
  size = "medium",
  isSimulated
}) => {
  // Cores baseadas na pontuação (eficácia)
  const getColorClass = () => {
    if (score >= 4) return "bg-emerald-50 text-emerald-700 border-emerald-200";
    if (score >= 3) return "bg-green-50 text-green-700 border-green-200";
    if (score >= 2) return "bg-amber-50 text-amber-700 border-amber-200";
    return "bg-red-50 text-red-700 border-red-200";
  };
  
  const getScoreColorClass = () => {
    if (score >= 4) return "bg-emerald-100 text-emerald-800";
    if (score >= 3) return "bg-green-100 text-green-800";
    if (score >= 2) return "bg-amber-100 text-amber-800";
    return "bg-red-100 text-red-800";
  };

  return (
    <Badge 
      variant="outline" 
      className={`${getColorClass()} flex items-center ${size === "small" ? "text-xs px-1.5 py-0.5" : ""}`}
    >
      {condition}
      <span className={`ml-1 px-1 py-0.5 rounded ${getScoreColorClass()} ${
        size === "small" ? "text-[10px]" : "text-xs"
      }`}>
        {score.toFixed(1)}
      </span>
      {isSimulated && (
        <AlertTriangle className={`${size === "small" ? "w-2 h-2" : "w-3 h-3"} ml-1 text-amber-500`} />
      )}
    </Badge>
  );
};

export default OutcomeTag;
