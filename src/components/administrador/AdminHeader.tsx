
import React from 'react';
import { Button } from "@/components/ui/button";
import { Settings, BookOpen, Database, Clock, Play, Pause, Brain } from "lucide-react";
import { useTranslation } from 'react-i18next';

interface AdminHeaderProps {
  // Propriedades para controle da simulação
  analyzing?: boolean;
  isPaused?: boolean;
  countdown?: number;
  isCountingDown?: boolean;
  onStartAnalysis?: () => void;
}

const AdminHeader: React.FC<AdminHeaderProps> = ({ 
  analyzing = false, 
  isPaused = false, 
  countdown = 0, 
  isCountingDown = false, 
  onStartAnalysis 
}) => {
  const { t } = useTranslation();
  
  const getButtonText = () => {
    if (isCountingDown) {
      return `Iniciando em ${countdown}...`;
    }
    if (analyzing && !isPaused) {
      return 'Pausar';
    }
    if (isPaused) {
      return 'Continuar';
    }
    return 'Iniciar Análise';
  };

  const getButtonIcon = () => {
    if (isCountingDown) {
      return <Brain className="h-4 w-4 animate-pulse" />;
    }
    if (analyzing && !isPaused) {
      return <Pause className="h-4 w-4" />;
    }
    return <Play className="h-4 w-4" />;
  };
  
  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
      <div>
        <h1 className="text-3xl font-bold">{t('navbar.researchDev')}</h1>
        <p className="text-gray-600">{t('navbar.platform')}</p>
      </div>
      
      <div className="flex gap-2 mt-4 md:mt-0">
        <Button variant="outline">
          <Database className="mr-2 h-4 w-4" />
          Base de Dados
        </Button>
        <Button variant="outline">
          <BookOpen className="mr-2 h-4 w-4" />
          Biblioteca Científica
        </Button>
        <Button variant="outline">
          <Settings className="mr-2 h-4 w-4" />
          {t('common.settings')}
        </Button>
        
        {/* Botão de cronômetro/simulação se fornecido */}
        {onStartAnalysis && (
          <Button
            onClick={onStartAnalysis}
            variant={analyzing && !isPaused ? "secondary" : "default"}
            className="flex items-center gap-2"
            disabled={isCountingDown}
          >
            {getButtonIcon()}
            {getButtonText()}
          </Button>
        )}
      </div>
    </div>
  );
};

export default AdminHeader;
