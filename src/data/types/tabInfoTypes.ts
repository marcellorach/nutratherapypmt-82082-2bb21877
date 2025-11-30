// Types for bilingual tab info content

export interface BilingualText {
  pt: string;
  en: string;
}

export interface BilingualArray {
  pt: string;
  en: string;
}

export interface ScientificStudyBilingual {
  title: BilingualText;
  authors: string;
  year: number;
  journal: BilingualText;
  url: string;
  keyFindings: BilingualText;
}

export interface KeyExcerptBilingual {
  source: string;
  quote: BilingualText;
  url: string;
}

export interface ComparisonTableBilingual {
  headers: BilingualText[];
  rows: {
    feature: BilingualText;
    values: BilingualText[];
  }[];
}

export interface CalculationBilingual {
  name: BilingualText;
  formula: string;
  example: BilingualText;
}

export interface ImplementationStatusBilingual {
  implemented: BilingualArray[];
  inProgress: BilingualArray[];
  planned: BilingualArray[];
}

export interface TabInfoContentBilingual {
  version?: string;
  lastUpdate?: string;
  keyExcerpts?: KeyExcerptBilingual[];
  overview: {
    objective: BilingualText;
    workflow: BilingualArray[];
    benefits: BilingualArray[];
  };
  methodology: {
    description: BilingualText;
    comparisonTable?: ComparisonTableBilingual;
    architectureDiagram?: string;
    calculations?: CalculationBilingual[];
    decisions: BilingualArray[];
    glossary?: {
      term: BilingualText;
      definition: BilingualText;
    }[];
    limitations?: BilingualArray[];
  };
  scientific: {
    foundation: BilingualText;
    implementationStatus?: ImplementationStatusBilingual;
    studies: ScientificStudyBilingual[];
    references: string[];
  };
}

// Localized types (after applying language)
export interface TabInfoContentLocalized {
  version?: string;
  lastUpdate?: string;
  keyExcerpts?: {
    source: string;
    quote: string;
    url: string;
  }[];
  overview: {
    objective: string;
    workflow: string[];
    benefits: string[];
  };
  methodology: {
    description: string;
    comparisonTable?: {
      headers: string[];
      rows: {
        feature: string;
        values: string[];
      }[];
    };
    architectureDiagram?: string;
    calculations?: {
      name: string;
      formula: string;
      example: string;
    }[];
    decisions: string[];
    glossary?: {
      term: string;
      definition: string;
    }[];
    limitations?: string[];
  };
  scientific: {
    foundation: string;
    implementationStatus?: {
      implemented: string[];
      inProgress: string[];
      planned: string[];
    };
    studies: {
      title: string;
      authors: string;
      year: number;
      journal: string;
      url: string;
      keyFindings: string;
    }[];
    references: string[];
  };
}
