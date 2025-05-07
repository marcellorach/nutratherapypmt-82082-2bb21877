
import React from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCcw } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

interface ErrorStateProps {
  error: string;
  onRetry: () => void;
}

const ErrorState: React.FC<ErrorStateProps> = ({ error, onRetry }) => {
  return (
    <div className="py-6">
      <Alert variant="destructive" className="mb-4">
        <AlertCircle className="h-4 w-4 mr-2" />
        <AlertTitle>Erro ao carregar os dados</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
      <div className="text-center">
        <Button 
          variant="default" 
          onClick={onRetry}
          className="mt-2"
        >
          <RefreshCcw className="h-4 w-4 mr-2" />
          Tentar novamente
        </Button>
      </div>
    </div>
  );
};

export default ErrorState;
