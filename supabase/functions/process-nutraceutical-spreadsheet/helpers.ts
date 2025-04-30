
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
 * Normaliza o tipo de relacionamento para valores consistentes
 * @param applicationType Tipo de aplicação da planilha
 * @returns Tipo normalizado: prevention, treatment ou support
 */
export function normalizeRelationType(applicationType: string): string {
  // Converter para minúsculas e remover acentos para normalização
  const normalized = applicationType.toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  
  if (normalized.includes('preven')) {
    return 'prevention';
  } else if (normalized.includes('trata')) {
    return 'treatment';
  } else {
    return 'support';
  }
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
      const rawApplicationType = item.Aplicação || item.aplicacao || 
                               item.Aplicacao || item.Tipo || 
                               item.type || item.Application || "Suporte";
                               
      // Normalizar o tipo de aplicação para os tipos esperados
      const relationshipType = normalizeRelationType(rawApplicationType);
      
      // Extrair o valor de eficácia diretamente da planilha
      // Tentar diferentes convenções de nome para a coluna de eficácia
      const rawScore = item.Nota || item.nota || item.Score || 
                      item.score || item.Eficácia || item.eficacia || 
                      item.Pontuacao || item.pontuacao || item.Pontuação || item.E;
      
      // Converter para número e garantir que seja um valor válido entre 0 e 5
      const efficacyScoreValue = parseFloat(rawScore);
      const efficacyScore = !isNaN(efficacyScoreValue) ? 
                        Math.min(Math.max(efficacyScoreValue, 0), 5) : 
                        3.0;
      
      console.log(`Processando condição: ${conditionName}, tipo: ${relationshipType}, score: ${efficacyScore} (original: ${rawScore})`);
      
      return {
        name: conditionName,
        relationshipType: relationshipType,
        efficacyScore: efficacyScore,
        studies: [
          `Estudo sobre ${name} em casos de ${conditionName}`,
          `Análise da eficácia de ${name} para ${relationshipType} de ${conditionName}`
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
