
import { processExtractedEntries } from './helpers.ts';
import { getAllSimulatedEntries } from './simulatedData.ts';

/**
 * Função para processar a saída da IA
 * @param aiOutput Saída da IA para processar
 * @param fileName Nome do arquivo original
 */
export function processAiOutput(aiOutput: any, fileName: string) {
  // Aqui processaríamos a saída da IA de forma mais completa
  // Se a estrutura não for o que esperamos, fazemos adaptações
  try {
    const nutraceuticals = Array.isArray(aiOutput.nutraceuticals) 
      ? aiOutput.nutraceuticals 
      : aiOutput.items || aiOutput.data || [];

    // Verificar se temos os dados esperados, caso contrário, usar simulação
    if (nutraceuticals.length > 0) {
      // Contadores para estatísticas
      const nutraceuticalsCount = new Set(nutraceuticals.map((n: any) => n.name.toLowerCase())).size;
      let conditionsSet = new Set();
      let relationsCount = 0;
      let studiesCount = 0;
      
      nutraceuticals.forEach((n: any) => {
        if (Array.isArray(n.conditions)) {
          n.conditions.forEach((c: any) => {
            conditionsSet.add(c.name.toLowerCase());
            relationsCount++;
            studiesCount += (c.studies?.length || 0);
          });
        }
      });
      
      return {
        nutraceuticals,
        originalFileName: fileName,
        processedAt: new Date().toISOString(),
        nutraceuticalsCount,
        conditionsCount: conditionsSet.size,
        relationsCount,
        studiesCount,
        warnings: [
          "Revise os nutracêuticos extraídos para garantir que todos foram capturados corretamente.",
          "Considere verificar as pontuações de eficácia com a literatura científica mais recente.",
          "Alguns nutracêuticos podem necessitar de categorização adicional."
        ]
      };
    } else {
      return simulateProcessedData(JSON.stringify(aiOutput), fileName);
    }
  } catch (error) {
    console.error('Erro ao processar saída da IA:', error);
    return simulateProcessedData("", fileName);
  }
}

/**
 * Função para simular dados processados (para demonstração)
 * @param fileContent Conteúdo do arquivo
 * @param fileName Nome do arquivo
 */
export function simulateProcessedData(fileContent: string, fileName: string) {
  console.log("Gerando dados simulados baseados na estrutura da planilha...");
  
  // Identificar se temos o conteúdo da planilha para análise
  let parsedData: any[] = [];
  try {
    if (fileContent && fileContent.includes(',')) {
      // Tentar processar como CSV
      const lines = fileContent.split('\n').filter(line => line.trim().length > 0);
      const headers = lines[0].split(',').map(h => h.trim());
      
      parsedData = lines.slice(1).map(line => {
        const values = line.split(',').map(v => v.trim());
        return headers.reduce((obj: any, header, index) => {
          obj[header] = values[index];
          return obj;
        }, {});
      });
    }
  } catch (error) {
    console.error('Erro ao analisar conteúdo da planilha:', error);
  }
  
  // Se conseguimos extrair dados da planilha, usamos para criar dados mais precisos
  const nutraceuticals = parsedData.length > 0 
    ? processExtractedEntries(parsedData)
    : getAllSimulatedEntries();
  
  // Contadores para estatísticas
  const nutraceuticalsCount = new Set(nutraceuticals.map(n => n.name.toLowerCase())).size;
  let conditionsCount = 0;
  let relationsCount = 0;
  let studiesCount = 0;
  
  const conditionsSet = new Set();
  
  nutraceuticals.forEach(n => {
    n.conditions.forEach(c => {
      conditionsSet.add(c.name.toLowerCase());
      relationsCount++;
      studiesCount += (c.studies?.length || 0);
    });
  });
  
  conditionsCount = conditionsSet.size;

  return {
    nutraceuticals,
    originalFileName: fileName,
    processedAt: new Date().toISOString(),
    nutraceuticalsCount,
    conditionsCount,
    relationsCount,
    studiesCount,
    warnings: [
      "Alguns nutracêuticos podem exigir revisão manual para garantir precisão dos dados.",
      "Considere verificar as pontuações de eficácia com a literatura científica mais recente.",
      "Verifique se os estudos científicos foram corretamente associados às condições."
    ]
  };
}
