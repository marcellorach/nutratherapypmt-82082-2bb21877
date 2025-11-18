import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { 
  AlertCircle, 
  CheckCircle2, 
  FileText, 
  Globe, 
  Play, 
  RefreshCw,
  AlertTriangle
} from 'lucide-react';

interface AuditIssue {
  type: 'hardcoded' | 'missing-key' | 'incomplete-translation';
  file: string;
  line: number;
  text: string;
  severity: 'high' | 'medium' | 'low';
}

interface AuditReport {
  timestamp: string;
  summary: {
    totalFiles: number;
    totalIssues: number;
    hardcodedTexts: number;
    missingKeys: number;
    incompleteTranslations: number;
  };
  issues: AuditIssue[];
}

const TranslationAuditTab: React.FC = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [report, setReport] = useState<AuditReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fixing, setFixing] = useState(false);
  const [fixResult, setFixResult] = useState<{ fixed: number; skipped: number } | null>(null);

  const loadReport = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/translation-audit-report.json');
      
      // Check if the response is actually JSON (not HTML from Vite dev server)
      const contentType = response.headers.get('content-type');
      if (!response.ok || !contentType?.includes('application/json')) {
        // Report doesn't exist yet - this is OK, not an error
        setReport(null);
        return;
      }
      
      const data = await response.json();
      setReport(data);
    } catch (err) {
      // Handle JSON parse errors gracefully
      setReport(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReport();
  }, []);

  const handleAutoFix = async () => {
    setFixing(true);
    setError(null);
    setFixResult(null);
    
    try {
      // Importa a função client-side
      const { autoFixMissingKeys } = await import('@/utils/translationAutoFix');
      
      // Executa auto-fix no banco de dados
      const result = await autoFixMissingKeys();
      
      setFixResult({ fixed: result.fixed, skipped: result.skipped });
      
      toast({
        title: "✅ Auto-Fix Completo",
        description: `${result.fixed} chaves adicionadas ao banco de dados. As traduções serão atualizadas automaticamente para todos os usuários.`,
      });
      
      // Aguarda 2 segundos e recarrega relatório
      setTimeout(() => {
        loadReport();
      }, 2000);
      
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      setError(`Error during auto-fix: ${errorMsg}`);
      toast({
        title: "Erro no Auto-Fix",
        description: errorMsg,
        variant: "destructive",
      });
    } finally {
      setFixing(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'default';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'high': return <AlertCircle className="h-4 w-4" />;
      case 'medium': return <AlertTriangle className="h-4 w-4" />;
      case 'low': return <AlertCircle className="h-4 w-4" />;
      default: return <AlertCircle className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="flex items-center gap-2">
          <RefreshCw className="h-5 w-5 animate-spin" />
          <span>{t('audit.loading')}</span>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="p-6 max-w-2xl mx-auto space-y-6">
        <Alert>
          <FileText className="h-4 w-4" />
          <AlertDescription className="text-base">
            {t('audit.noReport')}
          </AlertDescription>
        </Alert>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Play className="h-5 w-5" />
              {t('audit.howToRun.title')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-2">
                {t('audit.howToRun.description')}
              </p>
              <code className="block bg-muted p-3 rounded-md text-sm font-mono">
                npm run audit:translations
              </code>
            </div>
            <div className="text-sm text-muted-foreground space-y-2">
              <p className="font-medium">{t('audit.howToRun.whatItDoes')}</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>{t('audit.howToRun.check1')}</li>
                <li>{t('audit.howToRun.check2')}</li>
                <li>{t('audit.howToRun.check3')}</li>
              </ul>
            </div>
            <Button onClick={loadReport} className="w-full">
              <RefreshCw className="mr-2 h-4 w-4" />
              {t('audit.checkForReport')}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const missingKeyIssues = report.issues.filter(i => i.type === 'missing-key');
  const hardcodedIssues = report.issues.filter(i => i.type === 'hardcoded');
  const incompleteIssues = report.issues.filter(i => i.type === 'incomplete-translation');

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">{t('audit.title')}</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {t('audit.description')}
          </p>
        </div>
        <div className="flex gap-2">
          {report.summary.missingKeys > 0 && (
            <Button 
              onClick={handleAutoFix}
              disabled={fixing}
              variant="default"
              size="sm"
              className="gap-2"
            >
              {fixing ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Fixing...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  Auto-Fix Missing Keys ({report.summary.missingKeys})
                </>
              )}
            </Button>
          )}
          <Button onClick={loadReport} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            {t('audit.refresh')}
          </Button>
        </div>
      </div>

      {/* Success/Error Messages */}
      {fixResult && (
        <Alert className="border-green-500 bg-green-50 dark:bg-green-950">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-900 dark:text-green-100">
            <div className="space-y-2">
              <div className="font-semibold">
                ✅ Auto-Fix Concluído com Sucesso!
              </div>
              <div>
                • {fixResult.fixed} chaves adicionadas ao banco de dados<br />
                • {fixResult.skipped} chaves já existiam<br />
              </div>
              <div className="mt-3 p-3 bg-green-100 dark:bg-green-900 rounded">
                <strong>🔄 Atualizações em Tempo Real Ativadas</strong>
                <div className="mt-2 text-sm">
                  As traduções foram salvas no banco de dados e serão automaticamente 
                  atualizadas para todos os usuários através do Supabase Realtime.
                  Não é necessário fazer deploy ou substituir arquivos manualmente!
                </div>
              </div>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t('audit.summary.totalFiles')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{report.summary.totalFiles}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t('audit.summary.totalIssues')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className="text-2xl font-bold">{report.summary.totalIssues}</div>
              {report.summary.totalIssues === 0 ? (
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              ) : (
                <AlertCircle className="h-5 w-5 text-destructive" />
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t('audit.summary.missingKeys')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{report.summary.missingKeys}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t('audit.summary.hardcoded')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{report.summary.hardcodedTexts}</div>
          </CardContent>
        </Card>
      </div>

      {/* Status Alert */}
      {report.summary.totalIssues === 0 ? (
        <Alert className="border-green-500 bg-green-50 dark:bg-green-950">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800 dark:text-green-200">
            {t('audit.allClear')}
          </AlertDescription>
        </Alert>
      ) : (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {t('audit.issuesFound', { count: report.summary.totalIssues })}
          </AlertDescription>
        </Alert>
      )}

      {/* Issues Tabs */}
      {report.summary.totalIssues > 0 && (
        <Tabs defaultValue="missing-key" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="missing-key">
              {t('audit.tabs.missingKeys')} ({missingKeyIssues.length})
            </TabsTrigger>
            <TabsTrigger value="hardcoded">
              {t('audit.tabs.hardcoded')} ({hardcodedIssues.length})
            </TabsTrigger>
            <TabsTrigger value="incomplete">
              {t('audit.tabs.incomplete')} ({incompleteIssues.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="missing-key" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>{t('audit.tabs.missingKeys')}</CardTitle>
                <CardDescription>
                  {t('audit.tabs.missingKeysDesc')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {missingKeyIssues.map((issue, idx) => (
                    <div key={idx} className="flex items-start gap-3 p-3 border rounded-lg bg-card">
                      <Badge variant={getSeverityColor(issue.severity) as any}>
                        {getSeverityIcon(issue.severity)}
                      </Badge>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-mono text-muted-foreground truncate">
                          {issue.file}:{issue.line}
                        </div>
                        <div className="text-sm font-medium mt-1">
                          {issue.text}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="hardcoded" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>{t('audit.tabs.hardcoded')}</CardTitle>
                <CardDescription>
                  {t('audit.tabs.hardcodedDesc')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {hardcodedIssues.map((issue, idx) => (
                    <div key={idx} className="flex items-start gap-3 p-3 border rounded-lg bg-card">
                      <Badge variant={getSeverityColor(issue.severity) as any}>
                        {getSeverityIcon(issue.severity)}
                      </Badge>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-mono text-muted-foreground truncate">
                          {issue.file}:{issue.line}
                        </div>
                        <div className="text-sm font-medium mt-1">
                          "{issue.text}"
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="incomplete" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>{t('audit.tabs.incomplete')}</CardTitle>
                <CardDescription>
                  {t('audit.tabs.incompleteDesc')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {incompleteIssues.map((issue, idx) => (
                    <div key={idx} className="flex items-start gap-3 p-3 border rounded-lg bg-card">
                      <Badge variant="destructive">
                        <Globe className="h-3 w-3" />
                      </Badge>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-mono text-muted-foreground truncate">
                          {issue.file}
                        </div>
                        <div className="text-sm font-medium mt-1">
                          {issue.text}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      {/* Footer Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">{t('audit.footer.title')}</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>{t('audit.footer.command')}: <code className="bg-muted px-2 py-1 rounded">npm run audit:translations</code></p>
          <p className="text-xs">{t('audit.footer.lastRun')}: {new Date(report.timestamp).toLocaleString()}</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default TranslationAuditTab;
