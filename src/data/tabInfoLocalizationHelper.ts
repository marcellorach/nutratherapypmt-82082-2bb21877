import { 
  TabInfoContentBilingual, 
  TabInfoContentLocalized,
  BilingualText,
  BilingualArray 
} from './types/tabInfoTypes';

type Language = 'pt' | 'en';

/**
 * Extract text from bilingual object based on current language
 */
function getText(bilingual: BilingualText | BilingualArray, lang: Language): string {
  return bilingual[lang] || bilingual['en'] || bilingual['pt'] || '';
}

/**
 * Localize the tab info content based on the selected language
 */
export function getLocalizedTabInfo(
  content: TabInfoContentBilingual,
  language: Language
): TabInfoContentLocalized {
  return {
    version: content.version,
    lastUpdate: content.lastUpdate,
    keyExcerpts: content.keyExcerpts?.map(excerpt => ({
      source: excerpt.source,
      quote: getText(excerpt.quote, language),
      url: excerpt.url,
    })),
    overview: {
      objective: getText(content.overview.objective, language),
      workflow: content.overview.workflow.map(item => getText(item, language)),
      benefits: content.overview.benefits.map(item => getText(item, language)),
    },
    methodology: {
      description: getText(content.methodology.description, language),
      comparisonTable: content.methodology.comparisonTable ? {
        headers: content.methodology.comparisonTable.headers.map(h => getText(h, language)),
        rows: content.methodology.comparisonTable.rows.map(row => ({
          feature: getText(row.feature, language),
          values: row.values.map(v => getText(v, language)),
        })),
      } : undefined,
      architectureDiagram: content.methodology.architectureDiagram,
      calculations: content.methodology.calculations?.map(calc => ({
        name: getText(calc.name, language),
        formula: calc.formula,
        example: getText(calc.example, language),
      })),
      decisions: content.methodology.decisions.map(d => getText(d, language)),
      glossary: content.methodology.glossary?.map(g => ({
        term: getText(g.term, language),
        definition: getText(g.definition, language),
      })),
      limitations: content.methodology.limitations?.map(l => getText(l, language)),
    },
    scientific: {
      foundation: getText(content.scientific.foundation, language),
      implementationStatus: content.scientific.implementationStatus ? {
        implemented: content.scientific.implementationStatus.implemented.map(i => getText(i, language)),
        inProgress: content.scientific.implementationStatus.inProgress.map(i => getText(i, language)),
        planned: content.scientific.implementationStatus.planned.map(i => getText(i, language)),
      } : undefined,
      studies: content.scientific.studies.map(study => ({
        title: getText(study.title, language),
        authors: study.authors,
        year: study.year,
        journal: getText(study.journal, language),
        url: study.url,
        keyFindings: getText(study.keyFindings, language),
      })),
      references: content.scientific.references,
    },
  };
}

/**
 * Get language code from i18n language string
 */
export function getLanguageFromI18n(i18nLanguage: string): Language {
  return i18nLanguage?.startsWith('pt') ? 'pt' : 'en';
}
