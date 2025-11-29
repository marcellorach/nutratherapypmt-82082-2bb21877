import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

type SystemStatusType = 'connected' | 'disconnected' | 'checking';

interface SystemStatus {
  key: string;
  shortName: string;
  status: SystemStatusType;
  description?: string;
}

export const CompactSystemStatus = () => {
  const { t } = useTranslation();
  const [isChecking, setIsChecking] = useState(false);
  const [systems, setSystems] = useState<SystemStatus[]>([
    { shortName: 'DB', key: 'database', status: 'connected', description: t('studies.systemStatus.databaseDesc') },
    { shortName: 'KG', key: 'neo4j', status: 'checking' },
    { shortName: 'AI', key: 'llm', status: 'checking' },
    { shortName: 'Store', key: 'storage', status: 'checking' },
  ]);

  const checkNeo4j = async (): Promise<{ status: SystemStatusType; description: string }> => {
    try {
      const { data, error } = await supabase
        .from('ai_configurations')
        .select('config_value')
        .eq('config_key', 'neo4j_uri')
        .maybeSingle();
      
      if (error || !data?.config_value) {
        return { status: 'disconnected', description: t('studies.systemStatus.neo4jNotConfigured') };
      }

      const { data: testResult, error: testError } = await supabase.functions.invoke('ai-config', {
        body: { action: 'test-neo4j' }
      });

      if (testError || !testResult?.success) {
        return { status: 'disconnected', description: t('studies.systemStatus.neo4jConnectionFailed') };
      }

      return { status: 'connected', description: t('studies.systemStatus.neo4jConnected') };
    } catch {
      return { status: 'disconnected', description: t('studies.systemStatus.neo4jError') };
    }
  };

  const checkLLM = async (): Promise<{ status: SystemStatusType; description: string }> => {
    try {
      const { data: geminiData } = await supabase
        .from('ai_configurations')
        .select('config_value')
        .eq('config_key', 'google_gemini_api_key')
        .maybeSingle();

      if (geminiData?.config_value) {
        return { status: 'connected', description: t('studies.systemStatus.llmGeminiConfigured') };
      }

      return { status: 'connected', description: t('studies.systemStatus.llmLovableAI') };
    } catch {
      return { status: 'disconnected', description: t('studies.systemStatus.llmError') };
    }
  };

  const checkStorage = async (): Promise<{ status: SystemStatusType; description: string }> => {
    try {
      const { data, error } = await supabase.storage.from('study_pdfs').list('', { limit: 1 });
      
      if (error) {
        return { status: 'disconnected', description: t('studies.systemStatus.storageError') };
      }

      return { status: 'connected', description: t('studies.systemStatus.storageConnected') };
    } catch {
      return { status: 'disconnected', description: t('studies.systemStatus.storageError') };
    }
  };

  const runChecks = async () => {
    setIsChecking(true);
    
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
        { shortName: 'DB', key: 'database', status: 'connected', description: t('studies.systemStatus.databaseDesc') },
        { shortName: 'KG', key: 'neo4j', status: neo4jResult.status, description: neo4jResult.description },
        { shortName: 'AI', key: 'llm', status: llmResult.status, description: llmResult.description },
        { shortName: 'Store', key: 'storage', status: storageResult.status, description: storageResult.description },
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

  return (
    <TooltipProvider>
      <div className="flex items-center justify-between gap-2">
        <div className="grid grid-cols-4 gap-3 flex-1">
          {systems.map((system) => (
            <Tooltip key={system.key}>
              <TooltipTrigger asChild>
                <div className="flex flex-col items-center gap-1 cursor-default">
                  <div className={cn(
                    "w-3 h-3 rounded-full transition-colors",
                    getStatusColor(system.status, system.key)
                  )} />
                  <span className="text-[10px] text-muted-foreground font-medium">
                    {system.shortName}
                  </span>
                </div>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-xs">
                <p className="text-xs">{system.description || t(`studies.systemStatus.${system.status}`)}</p>
              </TooltipContent>
            </Tooltip>
          ))}
        </div>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={runChecks}
          disabled={isChecking}
          className="h-6 w-6 p-0"
        >
          <RefreshCw className={cn("h-3 w-3", isChecking && "animate-spin")} />
        </Button>
      </div>
    </TooltipProvider>
  );
};
