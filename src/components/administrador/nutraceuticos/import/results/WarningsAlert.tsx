
import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface WarningsAlertProps {
  warnings: string[];
}

const WarningsAlert: React.FC<WarningsAlertProps> = ({ warnings }) => {
  if (!warnings || warnings.length === 0) return null;
  
  return (
    <div className="bg-amber-50 border border-amber-200 rounded-md p-4 shadow-sm">
      <div className="flex gap-2 items-center mb-3">
        <AlertTriangle className="h-5 w-5 text-amber-600" />
        <h4 className="font-medium text-amber-800">Atenção:</h4>
      </div>
      <ul className="list-disc list-inside pl-2 space-y-2">
        {warnings.map((warning: string, idx: number) => (
          <li key={idx} className="text-sm text-amber-700">{warning}</li>
        ))}
      </ul>
      <div className="mt-3 text-xs text-amber-600">
        Estas observações não impedem a importação, mas é recomendável revisar os dados.
      </div>
    </div>
  );
};

export default WarningsAlert;
