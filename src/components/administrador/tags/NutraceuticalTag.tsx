
import React from 'react';
import { Badge } from "@/components/ui/badge";
import { AlertTriangle } from "lucide-react";

interface NutraceuticalTagProps {
  name: string;
  score?: number;
  size?: "small" | "medium";
  isSimulated?: boolean;
}

const NutraceuticalTag: React.FC<NutraceuticalTagProps> = ({ 
  name, 
  score, 
  size = "medium",
  isSimulated
}) => {
  // Cores baseadas na pontuação
  let colorClass = "bg-emerald-50 text-emerald-700 border-emerald-200";
  if (score) {
    if (score < 3) {
      colorClass = "bg-amber-50 text-amber-700 border-amber-200";
    } else if (score < 4) {
      colorClass = "bg-blue-50 text-blue-700 border-blue-200";
    }
  }

  return (
    <Badge 
      variant="outline" 
      className={`${colorClass} flex items-center ${size === "small" ? "text-xs px-1.5 py-0.5" : ""}`}
    >
      {name}
      {score && (
        <span className={`ml-1 px-1 py-0.5 rounded ${size === "small" ? "text-[10px]" : "text-xs"} ${
          score < 3 ? "bg-amber-100 text-amber-800" : 
          score < 4 ? "bg-blue-100 text-blue-800" : 
          "bg-emerald-100 text-emerald-800"
        }`}>
          {score.toFixed(1)}
        </span>
      )}
      {isSimulated && (
        <AlertTriangle className={`${size === "small" ? "w-2 h-2" : "w-3 h-3"} ml-1 text-amber-500`} />
      )}
    </Badge>
  );
};

export default NutraceuticalTag;
