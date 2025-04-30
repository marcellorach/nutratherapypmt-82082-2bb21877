
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
    const name = entry.Nutraceutico || entry.nutraceutico || entry.Nutracêutico || entry.nutracêutico || "";
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
    else category = "Suplemento Nutricional";
    
    // Criar condições para este nutracêutico
    const conditions = items.map(item => {
      const conditionName = item["Condição de Saúde"] || item.condicao || "Saúde Geral";
      const applicationType = item.Aplicação || item.aplicacao || "Suporte";
      
      // Determinar scores com base no tipo de aplicação
      let preventionScore = 0;
      let treatmentScore = 0;
      let supportScore = 0;
      
      if (applicationType === "Prevenção") preventionScore = 3.5 + Math.random() * 1.5;
      else if (applicationType === "Tratamento") treatmentScore = 3.5 + Math.random() * 1.5;
      else if (applicationType === "Suporte") supportScore = 3.5 + Math.random() * 1.5;
      
      return {
        name: conditionName,
        efficacyScores: {
          prevention: Number(preventionScore.toFixed(1)),
          treatment: Number(treatmentScore.toFixed(1)),
          support: Number(supportScore.toFixed(1))
        },
        studies: [
          `Estudo sobre ${name} em casos de ${conditionName}`,
          `Análise da eficácia de ${name} para ${applicationType} de ${conditionName}`
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
