
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from 'react-i18next';

interface ConventionsPanelProps {
  section: 'knowledge-base' | 'data-processing' | 'research' | 'predictive-analysis';
}

// Note: convention content stays as raw markdown in the textarea (user-editable), not translated
const SECTION_CONVENTIONS: Record<string, Record<string, string>> = {
  'knowledge-base': {
    naming: `# Naming Conventions for Knowledge Base\n\n* Nutraceuticals: Always use scientific name followed by common name in parentheses\n* Health conditions: Use official veterinary medical terminology\n* Dosages: Specify in mg/kg, followed by frequency\n* Studies: Format "Author et al. (Year) - Title"`,
    format: `# Data Storage Format\n\n* Scientific evidence: Classified by level (1-5)\n* Cross-references: Always include unique IDs for traceability\n* Metadata: Include addition date and last update\n* Tags: Use standardized tag system for easy searches`,
    rules: `# Validation Rules\n\n* Nutraceuticals must have at least 3 supporting studies\n* Evidence levels must be justified with clear criteria\n* Drug interactions must be documented with severity level\n* Side effects need documented frequency when available`
  },
  'data-processing': {
    naming: `# Naming Conventions for Data Processing\n\n* Datasets: format "data_type-species-YEAR"\n* Processing scripts: "process_subprocess_version"\n* Analysis results: "result_method_date"\n* Logs: "log_process_timestamp"`,
    format: `# Processing Format\n\n* Raw data must be preserved in original format\n* Pre-processing documented in separate file\n* Intermediate results in JSON or CSV format\n* Final results in standardized visualization format`,
    rules: `# Validation Rules\n\n* Cross-validation mandatory for all predictive models\n* Quality metrics documented for each processing\n* Register outliers and anomalies\n* Document parameters used in each processing`
  },
  'research': {
    naming: `# Naming Conventions for Research\n\n* Projects: "P-area-species-YYYY-code"\n* Experiments: "EXP-project-sequential"\n* Samples: "AM-experiment-sequential"\n* Hypotheses: "HIP-project-version"`,
    format: `# Documentation Format\n\n* Proposals: Follow template with introduction, hypothesis, methodology, timeline\n* Results: Structured by specific objectives\n* Statistical analyses: Document method, parameters and significance\n* Conclusions: Link directly to initial hypotheses`,
    rules: `# Validation Rules\n\n* Ethics approval needed before starting research\n* Internal peer review before submission\n* Commercial potential and patent analysis\n* Complete method documentation for reproducibility`
  },
  'predictive-analysis': {
    naming: `# Naming Conventions for Predictive Analysis\n\n* Models: "model-target-algorithm-version"\n* Features: "feature_category_specification"\n* Predictions: "pred_model_timestamp"\n* Evaluations: "eval_model_metric_version"`,
    format: `# Model Format\n\n* Standardized storage of trained models\n* Metadata including parameters and performance\n* Prediction logs with timestamps\n* Standardized visualizations for model comparison`,
    rules: `# Validation Rules\n\n* Clear separation of training, validation and test data\n* Documentation of all hyperparameters used\n* Evaluation with multiple relevant metrics\n* Periodic performance tests on new data`
  }
};

const SECTION_KEY_MAP: Record<string, string> = {
  'knowledge-base': 'knowledgeBase',
  'data-processing': 'dataProcessing',
  'research': 'research',
  'predictive-analysis': 'predictiveAnalysis',
};

const ConventionsPanel: React.FC<ConventionsPanelProps> = ({ section }) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('naming');
  const conventions = SECTION_CONVENTIONS[section];
  
  const [namingConventions, setNamingConventions] = useState(conventions.naming);
  const [formatConventions, setFormatConventions] = useState(conventions.format);
  const [rulesConventions, setRulesConventions] = useState(conventions.rules);
  
  const renderExamples = () => {
    if (activeTab === 'naming') {
      return (
        <div className="mt-4 space-y-4 p-4 bg-muted/50 rounded-lg">
          <h4 className="font-semibold mb-2">{t('conventionsPanel.examples.visualExamples')}</h4>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Curcuma longa (Cúrcuma)</Badge>
              <span className="text-sm text-muted-foreground">{t('conventionsPanel.examples.nutraceuticalNaming')}</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Smith et al. (2024) - Effects of Curcumin...</Badge>
              <span className="text-sm text-muted-foreground">{t('conventionsPanel.examples.citationFormat')}</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">500mg/kg BID</Badge>
              <span className="text-sm text-muted-foreground">{t('conventionsPanel.examples.dosageFormat')}</span>
            </div>
          </div>
          <div className="mt-6 border-t pt-4">
            <h5 className="font-medium mb-2">{t('conventionsPanel.examples.conventionInPractice')}</h5>
            <div className="p-3 bg-background rounded border">
              <div className="flex items-center justify-between mb-2">
                <Badge className="bg-green-100 text-green-800">{t('conventionsPanel.examples.nutraceutical')}</Badge>
                <span className="text-sm text-muted-foreground">{t('conventionsPanel.examples.validated')}</span>
              </div>
              <p className="text-sm"><strong>{t('conventionsPanel.examples.correct')}</strong> Zingiber officinale (Gengibre)</p>
              <p className="text-sm text-destructive mt-1"><strong>{t('conventionsPanel.examples.incorrect')}</strong> Gengibre</p>
            </div>
          </div>
        </div>
      );
    }
    
    if (activeTab === 'format') {
      return (
        <div className="mt-4 space-y-4 p-4 bg-muted/50 rounded-lg">
          <h4 className="font-semibold mb-2">{t('conventionsPanel.examples.standardFormats')}</h4>
          <div className="space-y-3">
            <div className="p-3 bg-background rounded border">
              <div className="flex items-center gap-2 mb-1">
                <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300">Nível 5</Badge>
                <span className="text-sm">{t('conventionsPanel.examples.strongEvidence')}</span>
              </div>
              <div className="flex mt-2">
                <div className="w-full bg-muted rounded-full h-2">
                  <div className="bg-yellow-500 h-2 rounded-full" style={{ width: '100%' }}></div>
                </div>
              </div>
            </div>
            <div className="p-3 bg-background rounded border">
              <div className="flex items-center gap-2 mb-1">
                <Badge className="bg-indigo-100 text-indigo-800 border-indigo-300">ID: NUT-2024-001</Badge>
                <span className="text-sm">{t('conventionsPanel.examples.identifierFormat')}</span>
              </div>
              <div className="grid grid-cols-3 gap-2 mt-2">
                <div className="text-xs bg-indigo-50 p-1 text-center rounded">NUT</div>
                <div className="text-xs bg-indigo-50 p-1 text-center rounded">2024</div>
                <div className="text-xs bg-indigo-50 p-1 text-center rounded">001</div>
              </div>
            </div>
            <div className="p-3 bg-background rounded border">
              <h5 className="text-sm font-medium mb-2">{t('conventionsPanel.examples.metadataExample')}</h5>
              <code className="text-xs bg-muted p-2 block rounded">
                {`{
  "id": "NUT-2024-001",
  "name": "Curcuma longa (Cúrcuma)",
  "added_at": "2024-05-22T10:30:00Z",
  "updated_at": "2024-05-25T14:22:10Z",
  "evidence_level": 4,
  "tags": ["anti-inflammatory", "antioxidant", "dogs"]
}`}
              </code>
            </div>
          </div>
        </div>
      );
    }
    
    if (activeTab === 'rules') {
      return (
        <div className="mt-4 space-y-4 p-4 bg-muted/50 rounded-lg">
          <h4 className="font-semibold mb-2">{t('conventionsPanel.examples.validations')}</h4>
          <div className="space-y-3">
            <div className="flex items-center gap-2 p-3 bg-background rounded border border-green-200">
              <div className="h-4 w-4 rounded-full bg-green-500 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <span className="text-sm font-medium">{t('conventionsPanel.examples.studiesValidated')}</span>
              </div>
            </div>
            <div className="flex items-start gap-2 p-3 bg-background rounded border border-red-200">
              <div className="h-4 w-4 rounded-full bg-red-500 flex items-center justify-center mt-0.5">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <div>
                <span className="text-sm font-medium">{t('conventionsPanel.examples.undocumentedInteractions')}</span>
                <p className="text-xs text-destructive mt-1">{t('conventionsPanel.examples.undocumentedInteractionsDesc')}</p>
              </div>
            </div>
            <div className="p-3 bg-background rounded border">
              <h5 className="text-sm font-medium mb-2">{t('conventionsPanel.examples.validationChecklist')}</h5>
              <div className="space-y-2">
                <div className="flex items-center">
                  <div className="h-4 w-4 border rounded-sm mr-2 flex items-center justify-center bg-green-500">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-sm">{t('conventionsPanel.examples.atLeast3Studies')}</span>
                </div>
                <div className="flex items-center">
                  <div className="h-4 w-4 border rounded-sm mr-2 flex items-center justify-center bg-green-500">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-sm">{t('conventionsPanel.examples.evidenceLevelJustification')}</span>
                </div>
                <div className="flex items-center">
                  <div className="h-4 w-4 border rounded-sm mr-2"></div>
                  <span className="text-sm">{t('conventionsPanel.examples.drugInteractions')}</span>
                </div>
                <div className="flex items-center">
                  <div className="h-4 w-4 border rounded-sm mr-2"></div>
                  <span className="text-sm">{t('conventionsPanel.examples.sideEffectsFrequency')}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }
    
    return null;
  };
  
  const sectionKey = SECTION_KEY_MAP[section];
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('conventionsPanel.title', { section: t(`conventionsPanel.sectionNames.${sectionKey}`) })}</CardTitle>
        <CardDescription>{t('conventionsPanel.description')}</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="naming">{t('conventionsPanel.naming')}</TabsTrigger>
            <TabsTrigger value="format">{t('conventionsPanel.format')}</TabsTrigger>
            <TabsTrigger value="rules">{t('conventionsPanel.rules')}</TabsTrigger>
          </TabsList>
          <TabsContent value="naming">
            <ScrollArea className="h-[400px] w-full rounded-md border mt-4 p-4">
              <Textarea className="min-h-[200px] border-0 resize-none" value={namingConventions} onChange={(e) => setNamingConventions(e.target.value)} />
              {renderExamples()}
            </ScrollArea>
          </TabsContent>
          <TabsContent value="format">
            <ScrollArea className="h-[400px] w-full rounded-md border mt-4 p-4">
              <Textarea className="min-h-[200px] border-0 resize-none" value={formatConventions} onChange={(e) => setFormatConventions(e.target.value)} />
              {renderExamples()}
            </ScrollArea>
          </TabsContent>
          <TabsContent value="rules">
            <ScrollArea className="h-[400px] w-full rounded-md border mt-4 p-4">
              <Textarea className="min-h-[200px] border-0 resize-none" value={rulesConventions} onChange={(e) => setRulesConventions(e.target.value)} />
              {renderExamples()}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline">{t('conventionsPanel.restoreDefault')}</Button>
        <Button>{t('conventionsPanel.saveConventions')}</Button>
      </CardFooter>
    </Card>
  );
};

export default ConventionsPanel;
