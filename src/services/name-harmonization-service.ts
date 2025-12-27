/**
 * Name Harmonization Service
 * Provides fuzzy matching and similarity detection for entity names
 */

export interface HarmonizationMatch {
  id: string;
  name: string;
  name_en?: string;
  table: string;
  similarity: number;
  matchType: 'exact' | 'fuzzy' | 'synonym';
}

export interface HarmonizationSuggestion {
  action: 'create_new' | 'merge' | 'link_synonym';
  confidence: number;
  matchedEntity?: HarmonizationMatch;
  reason: string;
}

// Levenshtein distance for fuzzy matching
function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

// Calculate similarity score (0-1)
export function calculateSimilarity(a: string, b: string): number {
  const normalizedA = normalizeString(a);
  const normalizedB = normalizeString(b);

  if (normalizedA === normalizedB) return 1;

  const maxLength = Math.max(normalizedA.length, normalizedB.length);
  if (maxLength === 0) return 1;

  const distance = levenshteinDistance(normalizedA, normalizedB);
  return 1 - distance / maxLength;
}

// Normalize string for comparison
export function normalizeString(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/[^a-z0-9\s]/g, '') // Remove special chars
    .replace(/\s+/g, ' '); // Normalize spaces
}

// Check if strings are likely the same compound
export function isLikelyMatch(a: string, b: string, threshold = 0.75): boolean {
  return calculateSimilarity(a, b) >= threshold;
}

// Find matches in existing entities
export function findMatches(
  candidateName: string,
  existingEntities: Array<{ id: string; name: string; name_en?: string; synonyms?: string[] }>,
  tableName: string,
  threshold = 0.7
): HarmonizationMatch[] {
  const matches: HarmonizationMatch[] = [];
  const normalizedCandidate = normalizeString(candidateName);

  for (const entity of existingEntities) {
    // Check main name
    const nameSimilarity = calculateSimilarity(candidateName, entity.name);
    if (nameSimilarity >= threshold) {
      matches.push({
        id: entity.id,
        name: entity.name,
        name_en: entity.name_en,
        table: tableName,
        similarity: nameSimilarity,
        matchType: nameSimilarity === 1 ? 'exact' : 'fuzzy'
      });
      continue;
    }

    // Check English name
    if (entity.name_en) {
      const nameEnSimilarity = calculateSimilarity(candidateName, entity.name_en);
      if (nameEnSimilarity >= threshold) {
        matches.push({
          id: entity.id,
          name: entity.name,
          name_en: entity.name_en,
          table: tableName,
          similarity: nameEnSimilarity,
          matchType: nameEnSimilarity === 1 ? 'exact' : 'fuzzy'
        });
        continue;
      }
    }

    // Check synonyms
    if (entity.synonyms) {
      for (const synonym of entity.synonyms) {
        const synonymSimilarity = calculateSimilarity(candidateName, synonym);
        if (synonymSimilarity >= threshold) {
          matches.push({
            id: entity.id,
            name: entity.name,
            name_en: entity.name_en,
            table: tableName,
            similarity: synonymSimilarity,
            matchType: 'synonym'
          });
          break;
        }
      }
    }
  }

  // Sort by similarity descending
  return matches.sort((a, b) => b.similarity - a.similarity);
}

// Generate harmonization suggestion
export function suggestHarmonization(
  candidateName: string,
  matches: HarmonizationMatch[]
): HarmonizationSuggestion {
  if (matches.length === 0) {
    return {
      action: 'create_new',
      confidence: 1,
      reason: 'Nenhuma correspondência encontrada. Criar nova entidade.'
    };
  }

  const bestMatch = matches[0];

  if (bestMatch.matchType === 'exact') {
    return {
      action: 'merge',
      confidence: 1,
      matchedEntity: bestMatch,
      reason: `Correspondência exata encontrada: "${bestMatch.name}". Mesclar entidades.`
    };
  }

  if (bestMatch.similarity >= 0.9) {
    return {
      action: 'merge',
      confidence: 0.9,
      matchedEntity: bestMatch,
      reason: `Alta similaridade (${Math.round(bestMatch.similarity * 100)}%) com "${bestMatch.name}". Recomendado mesclar.`
    };
  }

  if (bestMatch.similarity >= 0.75) {
    return {
      action: 'link_synonym',
      confidence: 0.7,
      matchedEntity: bestMatch,
      reason: `Similaridade média (${Math.round(bestMatch.similarity * 100)}%) com "${bestMatch.name}". Considere vincular como sinônimo.`
    };
  }

  return {
    action: 'create_new',
    confidence: 0.6,
    matchedEntity: bestMatch,
    reason: `Baixa similaridade (${Math.round(bestMatch.similarity * 100)}%) com possível correspondência "${bestMatch.name}". Avaliar manualmente.`
  };
}

// Chemical name normalization (specific patterns)
export function normalizeChemicalName(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s*\([^)]*\)/g, '') // Remove parenthetical notes
    .replace(/\s*\[[^\]]*\]/g, '') // Remove bracketed notes
    .replace(/[αβγδ]/g, (m) => {
      const greekMap: Record<string, string> = { 'α': 'alpha', 'β': 'beta', 'γ': 'gamma', 'δ': 'delta' };
      return greekMap[m] || m;
    })
    .replace(/-/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Check if two chemical names likely refer to same compound
export function areChemicalsSimilar(a: string, b: string): boolean {
  const normA = normalizeChemicalName(a);
  const normB = normalizeChemicalName(b);
  
  // Direct match after normalization
  if (normA === normB) return true;
  
  // One contains the other
  if (normA.includes(normB) || normB.includes(normA)) return true;
  
  // Fuzzy match
  return calculateSimilarity(normA, normB) >= 0.85;
}
