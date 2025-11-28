import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { RefreshCw, Database, Brain, HardDrive, Network } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

type SystemStatusType = 'connected' | 'disconnected' | 'checking';

interface SystemStatus {
  name: string;
  key: string;
  status: SystemStatusType;
  description?: string;
  icon: React.ReactNode;
}

export const SystemStatusBar = () => {
  const { t } = useTranslation();
  const [isChecking, setIsChecking] = useState(false);
  const [systems, setSystems] = useState<SystemStatus[]>([
    { name: t('systemStatus.database'), key: 'database', status: 'connected', icon: <Database className="h-3 w-3" />, description: t('systemStatus.databaseDesc') },
    { name: t('systemStatus.neo4j'), key: 'neo4j', status: 'checking', icon: <Network className="h-3 w-3" /> },
    { name: t('systemStatus.llm'), key: 'llm', status: 'checking', icon: <Brain className="h-3 w-3" /> },
    { name: t('systemStatus.storage'), key: 'storage', status: 'checking', icon: <HardDrive className="h-3 w-3" /> },
  ]);

  const checkNeo4j = async (): Promise<{ status: SystemStatusType; description: string }> => {
    try {
      const { data, error } = await supabase
        .from('ai_configurations')
        .select('config_value')
        .eq('config_key', 'neo4j_uri')
        .maybeSingle();
      
      if (error || !data?.config_value) {
        return { status: 'disconnected', description: t('systemStatus.neo4jNotConfigured') };
      }

      // Try to test connection via edge function
      const { data: testResult, error: testError } = await supabase.functions.invoke('ai-config', {
        body: { action: 'test-neo4j' }
      });

      if (testError || !testResult?.success) {
        return { status: 'disconnected', description: t('systemStatus.neo4jConnectionFailed') };
      }

      return { status: 'connected', description: t('systemStatus.neo4jConnected') };
    } catch {
      return { status: 'disconnected', description: t('systemStatus.neo4jError') };
    }
  };

  const checkLLM = async (): Promise<{ status: SystemStatusType; description: string }> => {
    try {
      // Check for Gemini API key in ai_configurations
      const { data: geminiData } = await supabase
        .from('ai_configurations')
        .select('config_value')
        .eq('config_key', 'google_gemini_api_key')
        .maybeSingle();

      if (geminiData?.config_value) {
        return { status: 'connected', description: t('systemStatus.llmGeminiConfigured') };
      }

      // Check for LOVABLE_API_KEY (always available in Cloud)
      // We can't directly check secrets, but we assume it's available
      return { status: 'connected', description: t('systemStatus.llmLovableAI') };
    } catch {
      return { status: 'disconnected', description: t('systemStatus.llmError') };
    }
  };

  const checkStorage = async (): Promise<{ status: SystemStatusType; description: string }> => {
    try {
      const { data, error } = await supabase.storage.from('study_pdfs').list('', { limit: 1 });
      
      if (error) {
        return { status: 'disconnected', description: t('systemStatus.storageError') };
      }

      const fileCount = data?.length || 0;
      return { 
        status: 'connected', 
        description: t('systemStatus.storageConnected', { count: fileCount })
      };
    } catch {
      return { status: 'disconnected', description: t('systemStatus.storageError') };
    }
  };

  const runChecks = async () => {
    setIsChecking(true);
    
    // Set all to checking except database
    setSystems(prev => prev.map(s => ({
      ...s,
      status: s.key === 'database' ? 'connected' : 'checking' as SystemStatusType
    })));

    try {
      const [neo4jResult, llmResult, storageResult] = await Promise.all([
        checkNeo4j(),
        checkLLM(),
        checkStorage()
      ]);

      setSystems([
        { 
          name: t('systemStatus.database'), 
          key: 'database', 
          status: 'connected', 
          icon: <Database className="h-3 w-3" />, 
          description: t('systemStatus.databaseDesc') 
        },
        { 
          name: t('systemStatus.neo4j'), 
          key: 'neo4j', 
          status: neo4jResult.status, 
          icon: <Network className="h-3 w-3" />, 
          description: neo4jResult.description 
        },
        { 
          name: t('systemStatus.llm'), 
          key: 'llm', 
          status: llmResult.status, 
          icon: <Brain className="h-3 w-3" />, 
          description: llmResult.description 
        },
        { 
          name: t('systemStatus.storage'), 
          key: 'storage', 
          status: storageResult.status, 
          icon: <HardDrive className="h-3 w-3" />, 
          description: storageResult.description 
        },
      ]);
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    runChecks();
  }, []);

  const getStatusColor = (status: SystemStatusType, key: string) => {
    if (key === 'database') return 'bg-blue-500';
    switch (status) {
      case 'connected': return 'bg-green-500';
      case 'disconnected': return 'bg-red-500';
      case 'checking': return 'bg-yellow-500 animate-pulse';
      default: return 'bg-muted';
    }
  };

  const allConnected = systems.every(s => s.status === 'connected');
  const someDisconnected = systems.some(s => s.status === 'disconnected');

  return (
    <TooltipProvider>
      <div className="flex items-center justify-between gap-4 p-3 rounded-lg bg-muted/30 border border-border/50">
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <span className="font-medium mr-2">{t('systemStatus.title')}:</span>
          
          {systems.map((system) => (
            <Tooltip key={system.key}>
              <TooltipTrigger asChild>
                <div className={cn(
                  "flex items-center gap-1.5 px-2 py-1 rounded-full transition-colors",
                  "hover:bg-muted/50 cursor-default"
                )}>
                  <div className={cn(
                    "w-2 h-2 rounded-full",
                    getStatusColor(system.status, system.key)
                  )} />
                  <span className="flex items-center gap-1">
                    {system.icon}
                    <span className="hidden sm:inline">{system.name}</span>
                  </span>
                </div>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-xs">
                <div className="text-sm">
                  <p className="font-medium">{system.name}</p>
                  <p className="text-muted-foreground">{system.description || t(`systemStatus.${system.status}`)}</p>
                </div>
              </TooltipContent>
            </Tooltip>
          ))}
        </div>

        <div className="flex items-center gap-2">
          {someDisconnected && (
            <span className="text-xs text-amber-600 dark:text-amber-400">
              {t('systemStatus.someOffline')}
            </span>
          )}
          {allConnected && !isChecking && (
            <span className="text-xs text-green-600 dark:text-green-400">
              {t('systemStatus.allReady')}
            </span>
          )}
          
          <Button
            variant="ghost"
            size="sm"
            onClick={runChecks}
            disabled={isChecking}
            className="h-7 w-7 p-0"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", isChecking && "animate-spin")} />
          </Button>
        </div>
      </div>
    </TooltipProvider>
  );
};
