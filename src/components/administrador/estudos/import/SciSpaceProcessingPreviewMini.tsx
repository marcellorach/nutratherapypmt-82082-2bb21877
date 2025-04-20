
import React from "react";
import { Progress } from "@/components/ui/progress";

interface SciSpaceProcessingPreviewMiniProps {
  progress: number;
  description?: string;
}

const SciSpaceProcessingPreviewMini: React.FC<SciSpaceProcessingPreviewMiniProps> = ({
  progress,
  description = "Processando arquivos..."
}) => (
  <div className="rounded-lg border px-6 py-8 my-4 flex flex-col items-center bg-gray-50">
    <span className="text-gray-500 mb-3">{description}</span>
    <Progress value={progress} className="w-full h-2 bg-gray-200" />
    <span className="text-xs mt-2 font-mono text-gray-500">{progress}%</span>
  </div>
);

export default SciSpaceProcessingPreviewMini;
