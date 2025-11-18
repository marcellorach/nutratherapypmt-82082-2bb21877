import React, { useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles } from "lucide-react";
import { useTranslation } from 'react-i18next';
import NtaiProcessingSection from './estudos/analysis/NtaiProcessingSection';

const ProcessamentoIATab: React.FC = () => {
  const { t } = useTranslation();

  // Listen for study import events and scroll to top
  useEffect(() => {
    const handleStudyImported = (event: CustomEvent) => {
      console.log('Study imported event received:', event.detail);
      // Scroll to top of page smoothly
      window.scrollTo({ top: 0, behavior: 'smooth' });
      
      // Add temporary highlight effect to the section
      const section = document.getElementById('ntai-processing-section');
      if (section) {
        section.classList.add('highlight-pulse');
        setTimeout(() => {
          section.classList.remove('highlight-pulse');
        }, 3000);
      }
    };

    window.addEventListener('studyImported' as any, handleStudyImported);
    return () => {
      window.removeEventListener('studyImported' as any, handleStudyImported);
    };
  }, []);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <CardTitle>Processamento de Estudos com IA</CardTitle>
          </div>
          <CardDescription>
            Selecione estudos importados e processe-os com IA para extrair informações estruturadas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div id="ntai-processing-section">
            <NtaiProcessingSection />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProcessamentoIATab;
