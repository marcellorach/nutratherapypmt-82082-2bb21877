
import React from 'react';
import { FileText } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface RelatedConditionsListProps {
  conditions: any[];
}

const RelatedConditionsList: React.FC<RelatedConditionsListProps> = ({ conditions }) => {
  return (
    <div className="grid gap-3">
      {conditions.map((cond: any, condIdx: number) => (
        <div key={condIdx} className="bg-gray-50 p-3 rounded-md">
          <div className="flex justify-between items-center">
            <h6 className="font-medium text-sm">{cond.name}</h6>
            <div className="flex gap-1">
              <Badge className="bg-green-100 text-green-800 border-0">
                P: {cond.efficacyScores.prevention.toFixed(1)}
              </Badge>
              <Badge className="bg-blue-100 text-blue-800 border-0">
                T: {cond.efficacyScores.treatment.toFixed(1)}
              </Badge>
              <Badge className="bg-purple-100 text-purple-800 border-0">
                S: {cond.efficacyScores.support.toFixed(1)}
              </Badge>
            </div>
          </div>
          
          {cond.studies && cond.studies.length > 0 && (
            <div className="mt-2">
              <h6 className="text-xs font-medium mb-1 text-gray-600">Estudos Associados:</h6>
              <ul className="text-xs space-y-1">
                {cond.studies.map((study: string, studyIdx: number) => (
                  <li key={studyIdx} className="flex items-start gap-1">
                    <FileText className="h-3 w-3 text-blue-500 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">{study}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default RelatedConditionsList;
