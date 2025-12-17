import React, { useState, useMemo } from 'react';
import { BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from 'react-i18next';
import { TabInfoContentBilingual } from '@/data/types/tabInfoTypes';
import { getLocalizedTabInfo, getLanguageFromI18n } from '@/data/tabInfoLocalizationHelper';

// Legacy types for backward compatibility
export interface ScientificStudy {
  title: string;
  authors: string;
  year: number;
  journal: string;
  url: string;
  keyFindings: string;
}

export interface KeyExcerpt {
  source: string;
  quote: string;
  url: string;
}

export interface ComparisonTable {
  headers: string[];
  rows: {
    feature: string;
    values: string[];
  }[];
}

export interface ImplementationStatus {
  implemented: string[];
  inProgress: string[];
  planned: string[];
}

export interface TabInfoContent {
  version?: string;
  lastUpdate?: string;
  keyExcerpts?: KeyExcerpt[];
  overview: {
    objective: string;
    workflow: string[];
    benefits: string[];
  };
  methodology: {
    description: string;
    comparisonTable?: ComparisonTable;
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
    implementationStatus?: ImplementationStatus;
    studies: ScientificStudy[];
    references: string[];
  };
}

interface TabInfoButtonProps {
  tabId: string;
  title: string;
  content?: TabInfoContent | TabInfoContentBilingual;
}

// Type guard to check if content is bilingual
function isBilingualContent(content: TabInfoContent | TabInfoContentBilingual | undefined): content is TabInfoContentBilingual {
  if (!content || !content.overview) return false;
  return typeof content.overview.objective === 'object' && 'pt' in content.overview.objective;
}

const TabInfoButton: React.FC<TabInfoButtonProps> = ({ tabId, title, content }) => {
  const [open, setOpen] = useState(false);
  const { t, i18n } = useTranslation();

  // Localize content if bilingual, otherwise use as-is
  const localizedContent = useMemo(() => {
    if (!content) return null;
    if (isBilingualContent(content)) {
      const language = getLanguageFromI18n(i18n.language);
      return getLocalizedTabInfo(content, language);
    }
    return content as TabInfoContent;
  }, [content, i18n.language]);

  // Don't render if no content
  if (!localizedContent) {
    return null;
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className="gap-2 bg-amber-100 hover:bg-amber-200 text-amber-800 border-amber-300 dark:bg-amber-900/30 dark:hover:bg-amber-900/50 dark:text-amber-200 dark:border-amber-700"
      >
        <BookOpen className="h-4 w-4" />
        {t('admin.tabInfo.button')}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="text-2xl">{title}</DialogTitle>
              {localizedContent.version && (
                <Badge variant="outline" className="ml-2">
                  v{localizedContent.version}
                </Badge>
              )}
            </div>
            <DialogDescription>
              {localizedContent.lastUpdate && (
                <div className="text-xs text-muted-foreground mt-1">
                  {t('admin.tabInfo.lastUpdate')}: {localizedContent.lastUpdate}
                </div>
              )}
              {t('admin.tabInfo.description')}
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">{t('admin.tabInfo.tabs.overview')}</TabsTrigger>
              <TabsTrigger value="methodology">{t('admin.tabInfo.tabs.methodology')}</TabsTrigger>
              <TabsTrigger value="scientific">{t('admin.tabInfo.tabs.scientific')}</TabsTrigger>
            </TabsList>

            <ScrollArea className="h-[60vh] mt-4">
              {/* Key Excerpts Section (if available) */}
              {localizedContent.keyExcerpts && localizedContent.keyExcerpts.length > 0 && (
                <div className="mb-6 p-4 border rounded-lg bg-muted/30">
                  <h3 className="text-lg font-semibold mb-3">{t('admin.tabInfo.keyExcerpts.title')}</h3>
                  <div className="space-y-3">
                    {localizedContent.keyExcerpts.map((excerpt, idx) => (
                      <div key={idx} className="border-l-4 border-primary pl-4 py-2">
                        <div className="text-xs font-semibold text-muted-foreground mb-1">{excerpt.source}</div>
                        <blockquote className="text-sm italic mb-2">&ldquo;{excerpt.quote}&rdquo;</blockquote>
                        <a
                          href={excerpt.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-primary hover:underline"
                        >
                          {t('admin.tabInfo.keyExcerpts.viewPaper')} →
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Overview Tab */}
              <TabsContent value="overview" className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold mb-2">{t('admin.tabInfo.overview.objective')}</h3>
                  <p className="text-sm text-muted-foreground">{localizedContent.overview.objective}</p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-2">{t('admin.tabInfo.overview.workflow')}</h3>
                  <ol className="list-decimal list-inside space-y-2">
                    {localizedContent.overview.workflow.map((step, idx) => (
                      <li key={idx} className="text-sm text-muted-foreground">{step}</li>
                    ))}
                  </ol>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-2">{t('admin.tabInfo.overview.benefits')}</h3>
                  <ul className="list-disc list-inside space-y-2">
                    {localizedContent.overview.benefits.map((benefit, idx) => (
                      <li key={idx} className="text-sm text-muted-foreground">{benefit}</li>
                    ))}
                  </ul>
                </div>
              </TabsContent>

              {/* Methodology Tab */}
              <TabsContent value="methodology" className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-4">{localizedContent.methodology.description}</p>
                </div>

                {/* Comparison Table (if available) */}
                {localizedContent.methodology.comparisonTable && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold mb-3">{t('admin.tabInfo.methodology.comparisonTable')}</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm border">
                        <thead>
                          <tr className="bg-muted">
                            {localizedContent.methodology.comparisonTable.headers.map((header, idx) => (
                              <th key={idx} className="border p-2 text-left font-semibold">
                                {header}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {localizedContent.methodology.comparisonTable.rows.map((row, idx) => (
                            <tr key={idx} className="border-b hover:bg-muted/50">
                              <td className="border p-2 font-medium">{row.feature}</td>
                              {row.values.map((value, vIdx) => (
                                <td key={vIdx} className="border p-2">
                                  {value}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Architecture Diagram (if available) */}
                {localizedContent.methodology.architectureDiagram && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold mb-3">{t('admin.tabInfo.methodology.architectureDiagram')}</h3>
                    <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-xs">
                      <code>{localizedContent.methodology.architectureDiagram}</code>
                    </pre>
                  </div>
                )}

                {localizedContent.methodology.calculations && localizedContent.methodology.calculations.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-3">{t('admin.tabInfo.methodology.calculations')}</h3>
                    {localizedContent.methodology.calculations.map((calc, idx) => (
                      <div key={idx} className="border rounded-lg p-4 mb-3 bg-muted/50">
                        <h4 className="font-medium mb-2">{calc.name}</h4>
                        <div className="bg-background rounded p-3 mb-2 font-mono text-sm whitespace-pre-wrap">
                          {calc.formula}
                        </div>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                          <strong>{t('admin.tabInfo.methodology.example')}:</strong> {calc.example}
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                <div>
                  <h3 className="text-lg font-semibold mb-2">{t('admin.tabInfo.methodology.decisions')}</h3>
                  <ul className="list-disc list-inside space-y-2">
                    {localizedContent.methodology.decisions.map((decision, idx) => (
                      <li key={idx} className="text-sm text-muted-foreground">{decision}</li>
                    ))}
                  </ul>
                </div>

                {/* Glossary (if available) */}
                {localizedContent.methodology.glossary && localizedContent.methodology.glossary.length > 0 && (
                  <div className="mt-6">
                    <h3 className="text-lg font-semibold mb-3">{t('admin.tabInfo.methodology.glossary')}</h3>
                    <div className="space-y-3">
                      {localizedContent.methodology.glossary.map((item, idx) => (
                        <div key={idx} className="border-l-4 border-secondary pl-4 py-2">
                          <dt className="font-semibold text-sm">{item.term}</dt>
                          <dd className="text-sm text-muted-foreground mt-1">{item.definition}</dd>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Limitations (if available) */}
                {localizedContent.methodology.limitations && localizedContent.methodology.limitations.length > 0 && (
                  <div className="mt-6">
                    <h3 className="text-lg font-semibold mb-3">{t('admin.tabInfo.methodology.limitations')}</h3>
                    <ul className="list-disc list-inside space-y-2">
                      {localizedContent.methodology.limitations.map((limitation, idx) => (
                        <li key={idx} className="text-sm text-muted-foreground">{limitation}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </TabsContent>

              {/* Scientific Tab */}
              <TabsContent value="scientific" className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold mb-2">{t('admin.tabInfo.scientific.foundation')}</h3>
                  <p className="text-sm text-muted-foreground">{localizedContent.scientific.foundation}</p>
                </div>

                {/* Implementation Status (if available) */}
                {localizedContent.scientific.implementationStatus && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold mb-3">{t('admin.tabInfo.scientific.implementationStatus')}</h3>
                    <div className="space-y-4">
                      {/* Implemented */}
                      {localizedContent.scientific.implementationStatus.implemented.length > 0 && (
                        <div>
                          <h4 className="text-sm font-semibold text-green-600 dark:text-green-400 mb-2">
                            ✅ {t('admin.tabInfo.scientific.implemented')}
                          </h4>
                          <ul className="list-disc list-inside space-y-1">
                            {localizedContent.scientific.implementationStatus.implemented.map((item, idx) => (
                              <li key={idx} className="text-sm text-muted-foreground">{item}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {/* In Progress */}
                      {localizedContent.scientific.implementationStatus.inProgress.length > 0 && (
                        <div>
                          <h4 className="text-sm font-semibold text-yellow-600 dark:text-yellow-400 mb-2">
                            🔄 {t('admin.tabInfo.scientific.inProgress')}
                          </h4>
                          <ul className="list-disc list-inside space-y-1">
                            {localizedContent.scientific.implementationStatus.inProgress.map((item, idx) => (
                              <li key={idx} className="text-sm text-muted-foreground">{item}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {/* Planned */}
                      {localizedContent.scientific.implementationStatus.planned.length > 0 && (
                        <div>
                          <h4 className="text-sm font-semibold text-blue-600 dark:text-blue-400 mb-2">
                            ⏳ {t('admin.tabInfo.scientific.planned')}
                          </h4>
                          <ul className="list-disc list-inside space-y-1">
                            {localizedContent.scientific.implementationStatus.planned.map((item, idx) => (
                              <li key={idx} className="text-sm text-muted-foreground">{item}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div>
                  <h3 className="text-lg font-semibold mb-3">{t('admin.tabInfo.scientific.studies')}</h3>
                  <div className="space-y-4">
                    {localizedContent.scientific.studies.map((study, idx) => (
                      <div key={idx} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-medium text-sm flex-1">{study.title}</h4>
                          <Badge variant="secondary" className="ml-2">{study.year}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mb-2">
                          {study.authors} • {study.journal}
                        </p>
                        <p className="text-sm mb-2">
                          <strong>{t('admin.tabInfo.scientific.keyFindings')}:</strong> {study.keyFindings}
                        </p>
                        <a
                          href={study.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-primary hover:underline"
                        >
                          {t('admin.tabInfo.scientific.viewStudy')} →
                        </a>
                      </div>
                    ))}
                  </div>
                </div>

                {localizedContent.scientific.references.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-2">{t('admin.tabInfo.scientific.references')}</h3>
                    <ul className="list-disc list-inside space-y-1">
                      {localizedContent.scientific.references.map((ref, idx) => (
                        <li key={idx} className="text-sm text-muted-foreground">{ref}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </TabsContent>
            </ScrollArea>
          </Tabs>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default TabInfoButton;
