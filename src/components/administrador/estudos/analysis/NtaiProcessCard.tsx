
import React from 'react';
import { Badge } from "@/components/ui/badge";
import { ProcessingItem } from '@/types/ntai';
import { NtaiProcessStatus } from './card/NtaiProcessStatus';
import { NtaiProcessProgress } from './card/NtaiProcessProgress';
import { NtaiProcessResult } from './card/NtaiProcessResult';

interface NtaiProcessCardProps {
  item: ProcessingItem;
  isActive?: boolean;
}

const NtaiProcessCard: React.FC<NtaiProcessCardProps> = ({ item, isActive = false }) => {
  return (
    <div className={`border rounded-md p-4 hover:shadow-sm transition ${isActive ? 'border-purple-300 bg-purple-50' : ''}`}>
      <div className="flex justify-between items-start mb-3">
        <h4 className="font-medium text-sm truncate max-w-[70%]" title={item.title}>
          {item.title}
        </h4>
        <div className="flex items-center gap-2">
          {isActive && (
            <Badge className="bg-purple-100 text-purple-800 border-purple-200">
              Ativo
            </Badge>
          )}
          <NtaiProcessStatus stage={item.stage} />
        </div>
      </div>
      
      <NtaiProcessProgress progress={item.progress} sourceFile={item.sourceFile} />
      <NtaiProcessResult stage={item.stage} error={item.error} />
    </div>
  );
};

export default NtaiProcessCard;
