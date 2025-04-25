
export const simulateStageProcessing = async (
  stage: string,
  itemTitle: string,
  logCallback: (message: string) => void
) => {
  const delay = Math.random() * 2000 + 1000;
  await new Promise(resolve => setTimeout(resolve, delay));
  
  const stageMessage = getStageMessage(stage);
  logCallback(`${stageMessage} para: ${itemTitle}`);
  
  if (stage === 'extracting') {
    logCallback(`Extraindo texto de documento PDF: ${itemTitle}`);
    logCallback(`Analisando estrutura do documento e convertendo para texto plano`);
  } else if (stage === 'analyzing') {
    logCallback(`Analisando conteúdo com prompt especializado para nutracêuticos`);
    logCallback(`Identificando menções a nutracêuticos, condições de saúde e dados de eficácia`);
  } else if (stage === 'standardizing') {
    logCallback(`Padronizando dados para integração com o kanban`);
    logCallback(`Convertendo informações em formato estruturado para armazenamento`);
  }
};

export const getStageMessage = (stage: string): string => {
  switch (stage) {
    case 'extracting': return 'Extraindo texto';
    case 'analyzing': return 'Analisando conteúdo';
    case 'standardizing': return 'Padronizando dados';
    default: return 'Processando';
  }
};
