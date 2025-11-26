import React, { useState } from 'react';
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

export interface ScientificStudy {
  title: string;
  authors: string;
  year: number;
  journal: string;
  url: string;
  keyFindings: string;
}

export interface TabInfoContent {
  overview: {
    objective: string;
    workflow: string[];
    benefits: string[];
  };
  methodology: {
    description: string;
    calculations?: {
      name: string;
      formula: string;
      example: string;
    }[];
    decisions: string[];
  };
  scientific: {
    foundation: string;
    studies: ScientificStudy[];
    references: string[];
  };
}

interface TabInfoButtonProps {
  tabId: string;
  title: string;
  content: TabInfoContent;
}

const TabInfoButton: React.FC<TabInfoButtonProps> = ({ tabId, title, content }) => {
  const [open, setOpen] = useState(false);
  const { t } = useTranslation();

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
            <DialogTitle className="text-2xl">{title}</DialogTitle>
            <DialogDescription>
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
              {/* Overview Tab */}
              <TabsContent value="overview" className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold mb-2">{t('admin.tabInfo.overview.objective')}</h3>
                  <p className="text-sm text-muted-foreground">{content.overview.objective}</p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-2">{t('admin.tabInfo.overview.workflow')}</h3>
                  <ol className="list-decimal list-inside space-y-2">
                    {content.overview.workflow.map((step, idx) => (
                      <li key={idx} className="text-sm text-muted-foreground">{step}</li>
                    ))}
                  </ol>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-2">{t('admin.tabInfo.overview.benefits')}</h3>
                  <ul className="list-disc list-inside space-y-2">
                    {content.overview.benefits.map((benefit, idx) => (
                      <li key={idx} className="text-sm text-muted-foreground">{benefit}</li>
                    ))}
                  </ul>
                </div>
              </TabsContent>

              {/* Methodology Tab */}
              <TabsContent value="methodology" className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-4">{content.methodology.description}</p>
                </div>

                {content.methodology.calculations && content.methodology.calculations.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-3">{t('admin.tabInfo.methodology.calculations')}</h3>
                    {content.methodology.calculations.map((calc, idx) => (
                      <div key={idx} className="border rounded-lg p-4 mb-3 bg-muted/50">
                        <h4 className="font-medium mb-2">{calc.name}</h4>
                        <div className="bg-background rounded p-3 mb-2 font-mono text-sm">
                          {calc.formula}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          <strong>{t('admin.tabInfo.methodology.example')}:</strong> {calc.example}
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                <div>
                  <h3 className="text-lg font-semibold mb-2">{t('admin.tabInfo.methodology.decisions')}</h3>
                  <ul className="list-disc list-inside space-y-2">
                    {content.methodology.decisions.map((decision, idx) => (
                      <li key={idx} className="text-sm text-muted-foreground">{decision}</li>
                    ))}
                  </ul>
                </div>
              </TabsContent>

              {/* Scientific Tab */}
              <TabsContent value="scientific" className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold mb-2">{t('admin.tabInfo.scientific.foundation')}</h3>
                  <p className="text-sm text-muted-foreground">{content.scientific.foundation}</p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-3">{t('admin.tabInfo.scientific.studies')}</h3>
                  <div className="space-y-4">
                    {content.scientific.studies.map((study, idx) => (
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

                {content.scientific.references.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-2">{t('admin.tabInfo.scientific.references')}</h3>
                    <ul className="list-disc list-inside space-y-1">
                      {content.scientific.references.map((ref, idx) => (
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
