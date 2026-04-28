/**
 * Guard-rail: lista de termos genéricos (categorias) que NÃO devem ser usados
 * como nomes de doenças em pet_conditions. Use a doença específica (ex:
 * "Degenerative Valve Disease (MMVD)" em vez de "Cardiovascular Disease").
 *
 * Categorias servem para agrupar; doenças específicas são o que o motor de
 * recomendação cruza com o Knowledge Graph.
 */
export const GENERIC_CATEGORY_TERMS: readonly string[] = [
  'Cardiovascular Disease',
  'Cardiovascular',
  'Chronic Inflammation',
  'Inflammation',
  'Heart Disease',
  'Renal Disease',
  'Kidney Disease',
  'Liver Disease',
  'Hepatic Disease',
  'Metabolic Disease',
  'Neurological Disease',
  'Endocrine Disease',
  'Musculoskeletal Disease',
  'Respiratory Disease',
  'Gastrointestinal Disease',
  'Doença Cardiovascular',
  'Doença Renal',
  'Doença Hepática',
  'Inflamação Crônica',
];

const NORMALIZED_GENERIC = new Set(
  GENERIC_CATEGORY_TERMS.map((t) => t.trim().toLowerCase()),
);

/**
 * Retorna true se `name` for um termo genérico de categoria, não uma doença
 * específica.
 */
export function isGenericCategory(name: string | null | undefined): boolean {
  if (!name) return false;
  return NORMALIZED_GENERIC.has(name.trim().toLowerCase());
}

/**
 * Em desenvolvimento, emite warning no console quando uma condição genérica é
 * detectada. Não bloqueia execução em produção.
 */
export function warnIfGenericCategory(
  name: string | null | undefined,
  context?: string,
): void {
  if (!isGenericCategory(name)) return;
  // eslint-disable-next-line no-console
  console.warn(
    `[conditionValidation] "${name}" é uma categoria genérica, não uma doença específica.${
      context ? ` Contexto: ${context}` : ''
    } Use a doença canônica (ex: "Degenerative Valve Disease (MMVD)" em vez de "Cardiovascular Disease").`,
  );
}