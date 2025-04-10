
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Import, Database, CheckCircle, X } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const ImportStep: React.FC = () => {
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<'idle' | 'importing' | 'success' | 'error'>('idle');
  const [importStats, setImportStats] = useState({
    totalRecords: 0,
    petsImported: 0,
    examsImported: 0,
    treatmentsImported: 0
  });
  
  const simulateImport = () => {
    setImporting(true);
    setStatus('importing');
    setProgress(0);
    
    const interval = setInterval(() => {
      setProgress(prev => {
        const newProgress = prev + Math.random() * 10;
        
        if (newProgress >= 100) {
          clearInterval(interval);
          setImporting(false);
          setStatus('success');
          setImportStats({
            totalRecords: 5487,
            petsImported: 2341,
            examsImported: 1876,
            treatmentsImported: 1270
          });
          return 100;
        }
        
        return newProgress;
      });
    }, 200);
  };
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Importação de Dados</h2>
          <p className="text-gray-600">Importe dados de sistemas externos para análise</p>
        </div>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <div className="mb-6 flex items-center justify-between">
            <h3 className="text-lg font-semibold">Importação do PetLove</h3>
            <Database className="h-6 w-6 text-gray-500" />
          </div>
          
          <p className="mb-6 text-sm text-gray-600">
            Importe dados de pets, tutores, exames e tratamentos do sistema PetLove para análise em massa.
          </p>
          
          {status === 'success' ? (
            <Alert className="mb-4 bg-green-50">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <AlertTitle>Importação concluída com sucesso</AlertTitle>
              <AlertDescription>
                <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                  <div>Total de registros: <span className="font-medium">{importStats.totalRecords}</span></div>
                  <div>Pets importados: <span className="font-medium">{importStats.petsImported}</span></div>
                  <div>Exames importados: <span className="font-medium">{importStats.examsImported}</span></div>
                  <div>Tratamentos importados: <span className="font-medium">{importStats.treatmentsImported}</span></div>
                </div>
              </AlertDescription>
            </Alert>
          ) : status === 'error' ? (
            <Alert className="mb-4 bg-red-50" variant="destructive">
              <X className="h-5 w-5" />
              <AlertTitle>Erro na importação</AlertTitle>
              <AlertDescription>
                Ocorreu um erro durante a importação dos dados. Tente novamente.
              </AlertDescription>
            </Alert>
          ) : null}
          
          {status === 'importing' && (
            <div className="mb-4 space-y-2">
              <Progress value={progress} className="h-2 w-full" />
              <div className="flex justify-between text-xs text-gray-500">
                <span>Importando...</span>
                <span>{Math.round(progress)}%</span>
              </div>
            </div>
          )}
          
          <Button 
            onClick={simulateImport}
            disabled={importing}
            className="w-full"
          >
            {importing ? (
              <span className="flex items-center">
                <svg className="mr-2 h-4 w-4 animate-spin" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Importando...
              </span>
            ) : (
              <>
                <Import className="mr-2 h-4 w-4" />
                {status === 'success' ? 'Importar Novamente' : 'Iniciar Importação'}
              </>
            )}
          </Button>
        </div>
        
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h3 className="mb-6 text-lg font-semibold">Fontes de Dados Disponíveis</h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-md border border-gray-200 p-3">
              <div className="flex items-center">
                <div className="mr-3 h-10 w-10 rounded-full bg-blue-100 p-2">
                  <img src="https://via.placeholder.com/24" alt="PetLove" className="h-full w-full" />
                </div>
                <div>
                  <h4 className="font-medium">PetLove</h4>
                  <p className="text-xs text-gray-500">Histórico médico e exames</p>
                </div>
              </div>
              <Button variant="outline" size="sm">Conectar</Button>
            </div>
            
            <div className="flex items-center justify-between rounded-md border border-gray-200 p-3">
              <div className="flex items-center">
                <div className="mr-3 h-10 w-10 rounded-full bg-green-100 p-2">
                  <img src="https://via.placeholder.com/24" alt="VetSmart" className="h-full w-full" />
                </div>
                <div>
                  <h4 className="font-medium">VetSmart</h4>
                  <p className="text-xs text-gray-500">Sistema de clínicas parceiras</p>
                </div>
              </div>
              <Button variant="outline" size="sm">Conectar</Button>
            </div>
            
            <div className="flex items-center justify-between rounded-md border border-gray-200 p-3">
              <div className="flex items-center">
                <div className="mr-3 h-10 w-10 rounded-full bg-yellow-100 p-2">
                  <img src="https://via.placeholder.com/24" alt="PetShop" className="h-full w-full" />
                </div>
                <div>
                  <h4 className="font-medium">PetShop Manager</h4>
                  <p className="text-xs text-gray-500">Dados de consumo e perfil</p>
                </div>
              </div>
              <Button variant="outline" size="sm">Conectar</Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImportStep;
