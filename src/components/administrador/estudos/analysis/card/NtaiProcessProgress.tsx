
import React from 'react';
import { Progress } from "@/components/ui/progress";

interface NtaiProcessProgressProps {
  progress: number;
  sourceFile?: string;
}

export const NtaiProcessProgress: React.FC<NtaiProcessProgressProps> = ({ progress, sourceFile }) => {
  return (
    <div className="space-y-2">
      <Progress value={progress} className="h-2" />
      
      <div className="flex justify-between text-xs text-gray-500">
        <div>
          {sourceFile && (
            <span title={sourceFile}>
              Fonte: {sourceFile.length > 20 
                ? sourceFile.substring(0, 20) + '...' 
                : sourceFile}
            </span>
          )}
        </div>
        <div>{progress}%</div>
      </div>
    </div>
  );
};
