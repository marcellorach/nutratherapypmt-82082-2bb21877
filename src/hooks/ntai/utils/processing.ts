
import { ProcessingStage } from '@/types/ntai';

export const simulateStageProcessing = async (
  stage: ProcessingStage,
  itemTitle: string,
  logCallback: (message: string) => void
) => {
  const delay = Math.random() * 1000 + 500; // Reduzido para ser mais rápido na demonstração
  await new Promise(resolve => setTimeout(resolve, delay));
  
  const stageMessage = getStageMessage(stage);
  logCallback(`${stageMessage} para: ${itemTitle}`);
  
  if (stage === 'extracting') {
    logCallback(`Extraindo texto de documento: ${itemTitle}`);
    logCallback(`Analisando estrutura do documento e convertendo para texto plano`);
  } else if (stage === 'analyzing') {
    logCallback(`Analisando conteúdo com prompt especializado para nutracêuticos`);
    logCallback(`Identificando menções a nutracêuticos, condições de saúde e dados de eficácia`);
  } else if (stage === 'standardizing') {
    logCallback(`Padronizando dados para integração com o kanban`);
    logCallback(`Convertendo informações em formato estruturado para armazenamento`);
  }
};

export const getStageMessage = (stage: ProcessingStage): string => {
  switch (stage) {
    case 'extracting': return 'Extraindo texto';
    case 'analyzing': return 'Analisando conteúdo';
    case 'standardizing': return 'Padronizando dados';
    default: return 'Processando';
  }
};

export const getProgressForStage = (stage: ProcessingStage): number => {
  switch (stage) {
    case 'extracting': return 30;
    case 'analyzing': return 60;
    case 'standardizing': return 90;
    default: return 0;
  }
};
