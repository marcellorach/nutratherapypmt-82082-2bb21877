
// Funções auxiliares para processamento de planilhas de nutracêuticos

/**
 * Formata uma data para exibição no formato brasileiro
 * @param dateString String de data para formatar
 * @returns Data formatada
 */
export function formatDateString(dateString: string): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
}

/**
 * Processa entradas extraídas da planilha
 * @param entries Entradas extraídas da planilha
 * @returns Array de nutracêuticos processados
 */
export function processExtractedEntries(entries: any[]): any[] {
  console.log(`Processando ${entries.length} entradas da planilha`);
  
  // Agrupar por nome de nutracêutico
  const groupedByName: Record<string, any[]> = {};
  
  entries.forEach(entry => {
    // Identificar as colunas de nome usando várias possíveis convenções de nomes
    const name = entry.Nutraceutico || entry.nutraceutico || entry.Nutracêutico || 
                 entry.nutracêutico || entry.Nome || entry.name || "";
    
    if (!name) return;
    
    if (!groupedByName[name]) {
      groupedByName[name] = [];
    }
    
    groupedByName[name].push(entry);
  });
  
  // Criar array de nutracêuticos com suas condições
  return Object.entries(groupedByName).map(([name, items]) => {
    // Determinar categoria com base em alguma lógica
    let category = "";
    if (name.includes("Ômega") || name.includes("Omega")) category = "Cardíaco";
    else if (name.includes("Glucosamina")) category = "Articular";
    else if (name.includes("Curcumina")) category = "Anti-inflamatório";
    else if (name.includes("NAC") || name.includes("cetil")) category = "Antioxidante";
    else if (name.includes("EGCG") || name.includes("Astaxantina")) category = "Antioxidante";
    else if (name.includes("Fucoidan")) category = "Imunológico";
    else category = "Suplemento Nutricional";
    
    // Criar condições para este nutracêutico
    const conditions = items.map(item => {
      // Identificar diferentes convenções de nome para a condição de saúde
      const conditionName = item["Condição de Saúde"] || item.condicao || 
                            item.Condicao || item["Condição"] || 
                            item.Condition || item.condition || "Saúde Geral";
      
      // Identificar diferentes convenções de nome para o tipo de aplicação
      const applicationType = item.Aplicação || item.aplicacao || 
                             item.Aplicacao || item.Tipo || 
                             item.type || item.Application || "Suporte";
      
      // Extrair o valor de eficácia diretamente da planilha
      // Tentar diferentes convenções de nome para a coluna de eficácia
      const rawScore = item.Nota || item.nota || item.Score || 
                      item.score || item.Eficácia || item.eficacia || 
                      item.Pontuacao || item.pontuacao || item.Pontuação || item.E;
      
      // Converter para número e garantir que seja um valor válido entre 0 e 5
      const efficacyScore = parseFloat(rawScore) || 0;
      const validScore = isNaN(efficacyScore) ? 3.0 : 
                        Math.min(Math.max(efficacyScore, 0), 5);
      
      // Mapear tipo de aplicação para os tipos corretos esperados no banco de dados
      // Normalizar para os valores esperados: prevention, treatment, support
      let normalizedType = applicationType.toLowerCase();
      
      if (normalizedType.includes("preven")) {
        normalizedType = "prevention";
      } else if (normalizedType.includes("trata")) {
        normalizedType = "treatment";
      } else {
        normalizedType = "support"; // Suporte como valor padrão
      }
      
      // Estruturar os scores de eficácia com base no tipo normalizado
      const efficacyScores = {
        prevention: normalizedType === "prevention" ? validScore : 0,
        treatment: normalizedType === "treatment" ? validScore : 0,
        support: normalizedType === "support" ? validScore : 0
      };
      
      return {
        name: conditionName,
        relationshipType: normalizedType,
        efficacyScore: validScore,
        efficacyScores: efficacyScores,
        studies: [
          `Estudo sobre ${name} em casos de ${conditionName}`,
          `Análise da eficácia de ${name} para ${normalizedType} de ${conditionName}`
        ]
      };
    });
    
    return {
      name,
      description: `${name} para saúde animal com propriedades específicas`,
      category,
      conditions
    };
  });
}
