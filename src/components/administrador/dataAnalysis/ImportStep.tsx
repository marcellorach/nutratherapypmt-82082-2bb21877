
import React, { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, FileText, Database, CheckCircle, AlertCircle } from "lucide-react";
import { useNavigate } from 'react-router-dom';
import { useToast } from "@/hooks/use-toast";

interface ImportStepProps {
  onComplete: (stats: ImportStats) => void;
}

interface ImportStats {
  totalRecords: number;
  petsImported: number;
  prontuariosImported: number;
  examsImported: number;
  eligiblePets: number;
}

const ImportStep: React.FC<ImportStepProps> = ({ onComplete }) => {
  const [isImporting, setIsImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState('');
  const [stats, setStats] = useState<ImportStats>({
    totalRecords: 0,
    petsImported: 0,
    prontuariosImported: 0,
    examsImported: 0,
    eligiblePets: 0
  });
  
  const navigate = useNavigate();
  const { toast } = useToast();
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const hasCompletedRef = useRef(false);

  // Função para simular importação
  const simulateImport = () => {
    if (isImporting || hasCompletedRef.current) return;
    
    setIsImporting(true);
    setProgress(0);
    hasCompletedRef.current = false;
    
    const steps = [
      { progress: 15, step: 'Conectando ao banco de dados...', delay: 800 },
      { progress: 30, step: 'Carregando dados de pets...', delay: 1200 },
      { progress: 50, step: 'Importando prontuários médicos...', delay: 1000 },
      { progress: 70, step: 'Processando exames laboratoriais...', delay: 1500 },
      { progress: 85, step: 'Validando dados importados...', delay: 800 },
      { progress: 100, step: 'Importação concluída!', delay: 500 }
    ];
    
    let currentStepIndex = 0;
    
    const executeStep = () => {
      if (currentStepIndex < steps.length && !hasCompletedRef.current) {
        const step = steps[currentStepIndex];
        setProgress(step.progress);
        setCurrentStep(step.step);
        
        // Simular dados sendo importados
        setStats({
          totalRecords: Math.floor((step.progress / 100) * 2341),
          petsImported: Math.floor((step.progress / 100) * 1876),
          prontuariosImported: Math.floor((step.progress / 100) * 1654),
          examsImported: Math.floor((step.progress / 100) * 1432),
          eligiblePets: Math.floor((step.progress / 100) * 1298)
        });
        
        currentStepIndex++;
        
        if (currentStepIndex < steps.length) {
          setTimeout(executeStep, step.delay);
        } else {
          // Importação concluída
          setTimeout(() => {
            if (!hasCompletedRef.current) {
              hasCompletedRef.current = true;
              setIsImporting(false);
              
              const finalStats = {
                totalRecords: 2341,
                petsImported: 1876,
                prontuariosImported: 1654,
                examsImported: 1432,
                eligiblePets: 1298
              };
              
              setStats(finalStats);
              onComplete(finalStats);
              
              toast({
                title: "Importação concluída",
                description: "Dados importados com sucesso. Redirecionando para análise...",
                variant: "default",
              });
              
              // Navegar para a simulação após 2 segundos
              setTimeout(() => {
                navigate('/administrador/simulacao-multiagente', { 
                  state: { importStats: finalStats } 
                });
              }, 2000);
            }
          }, step.delay);
        }
      }
    };
    
    executeStep();
  };

  // Limpeza ao desmontar o componente
  useEffect(() => {
    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, []);

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold mb-2">Importação de Dados</h2>
        <p className="text-gray-600">
          Importe dados de pets, prontuários e exames para análise inteligente
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Status da Importação
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Progresso</span>
              <span className="text-sm text-gray-500">{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
            
            {currentStep && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                {progress === 100 ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-blue-500 animate-pulse" />
                )}
                {currentStep}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total de Registros</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.totalRecords}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pets Importados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.petsImported}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Prontuários</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{stats.prontuariosImported}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Exames</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.examsImported}</div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-center">
        <Button 
          onClick={simulateImport} 
          disabled={isImporting || hasCompletedRef.current}
          className="flex items-center gap-2"
        >
          {isImporting ? (
            <>
              <Database className="h-4 w-4 animate-spin" />
              Importando...
            </>
          ) : progress === 100 ? (
            <>
              <CheckCircle className="h-4 w-4" />
              Importação Concluída
            </>
          ) : (
            <>
              <Upload className="h-4 w-4" />
              Iniciar Importação
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default ImportStep;
