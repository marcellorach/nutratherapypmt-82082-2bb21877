
import React from 'react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

const ConfiguracoesAvisosIA: React.FC = () => {
  return (
    <Alert className="mb-6">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Importante</AlertTitle>
      <AlertDescription>
        As chaves API são armazenadas de forma segura no Supabase e também mantidas localmente 
        como fallback. Em um ambiente de produção, apenas o armazenamento seguro no servidor é utilizado.
      </AlertDescription>
    </Alert>
  );
};

export default ConfiguracoesAvisosIA;
