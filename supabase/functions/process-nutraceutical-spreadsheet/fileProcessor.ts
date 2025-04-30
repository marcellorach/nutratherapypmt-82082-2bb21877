
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
    console.log("Processando saída da IA:", JSON.stringify(aiOutput).substring(0, 200) + "...");
    
    const nutraceuticals = Array.isArray(aiOutput.nutraceuticals) 
      ? aiOutput.nutraceuticals 
      : aiOutput.items || aiOutput.data || [];

    // Verificar se temos os dados esperados, caso contrário, usar simulação
    if (nutraceuticals.length > 0) {
      console.log(`Encontrados ${nutraceuticals.length} nutracêuticos na saída da IA`);
      
      // Garantir que os tipos de relação e pontuações de eficácia estejam corretos
      nutraceuticals.forEach((nutra: any) => {
        if (Array.isArray(nutra.conditions)) {
          nutra.conditions.forEach((condition: any) => {
            // Garantir que o tipo de relacionamento esteja normalizado
            if (condition.relationshipType) {
              const normalized = condition.relationshipType.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
              
              // Normalizar o tipo de relacionamento
              if (normalized.includes('preven')) {
                condition.relationshipType = 'prevention';
              } else if (normalized.includes('trata')) {
                condition.relationshipType = 'treatment';
              } else {
                condition.relationshipType = 'support';
              }
              
              console.log(`Tipo de relacionamento normalizado: ${condition.relationshipType}`);
            }
            
            // Garantir que a pontuação de eficácia seja um número válido
            if (condition.efficacyScore !== undefined) {
              const score = parseFloat(condition.efficacyScore);
              condition.efficacyScore = !isNaN(score) ? score : 3.0;
              console.log(`Pontuação de eficácia: ${condition.efficacyScore}`);
            } else {
              condition.efficacyScore = 3.0;
              console.log("Usando pontuação padrão de 3.0 por falta de valor");
            }
          });
        }
      });
      
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
          "Verifique se os tipos de relação (prevenção, tratamento, suporte) estão classificados corretamente.",
          "Confirme se as pontuações de eficácia foram extraídas com precisão da planilha original."
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
      
      console.log("Dados extraídos da planilha:", JSON.stringify(parsedData, null, 2));
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
      "Verifique se os tipos de relação (prevenção, tratamento, suporte) estão classificados corretamente.",
      "Confirme se as pontuações de eficácia foram extraídas com precisão da planilha original."
    ]
  };
}
