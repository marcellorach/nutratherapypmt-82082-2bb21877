
import React from 'react';
import { Check } from 'lucide-react';

interface SummaryHeaderProps {
  originalFileName: string;
  processedAt: string;
}

const SummaryHeader: React.FC<SummaryHeaderProps> = ({ originalFileName, processedAt }) => {
  const formatDateString = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  return (
    <div className="bg-green-50 rounded-md p-4 flex items-start gap-3">
      <Check className="h-6 w-6 text-green-600 flex-shrink-0 mt-0.5" />
      <div>
        <h3 className="font-medium text-green-800">Dados Processados com Sucesso</h3>
        <p className="text-sm text-green-700 mt-1">
          O arquivo <span className="font-medium">{originalFileName}</span> foi processado em {formatDateString(processedAt)}.
        </p>
      </div>
    </div>
  );
};

export default SummaryHeader;
