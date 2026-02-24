/**
 * Resumo Consolidado de Configurações
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Eye, EyeOff, CheckCircle2, XCircle, Settings2, ChevronDown, ChevronUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from 'react-i18next';

interface ConfigItem {
  key: string;
  label: string;
  value: string;
  isConfigured: boolean;
  isSensitive: boolean;
  category: 'api' | 'database' | 'prompts';
}

const ConfigurationsSummary: React.FC = () => {
  const { toast } = useToast();
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set());
  const [configs, setConfigs] = useState<ConfigItem[]>([]);

  useEffect(() => { loadConfigurations(); }, []);

  const loadConfigurations = async () => {
    setIsLoading(true);
    try {
      const response = await supabase.functions.invoke('ai-config', { method: 'GET' });
      if (response.error) throw new Error(response.error.message);
      const data = response.data || {};
      const configItems: ConfigItem[] = [
        { key: 'openai_api_key', label: 'OpenAI API Key', value: data.openai_api_key || '', isConfigured: !!data.openai_api_key, isSensitive: true, category: 'api' },
        { key: 'google_gemini_api_key', label: 'Google Gemini', value: data.google_gemini_api_key || '', isConfigured: !!data.google_gemini_api_key, isSensitive: true, category: 'api' },
        { key: 'claude_api_key', label: 'Claude API', value: data.claude_api_key || '', isConfigured: !!data.claude_api_key, isSensitive: true, category: 'api' },
        { key: 'grok_api_key', label: 'Grok API', value: data.grok_api_key || '', isConfigured: !!data.grok_api_key, isSensitive: true, category: 'api' },
        { key: 'unstructured_api_key', label: 'Unstructured.io', value: data.unstructured_api_key || '', isConfigured: !!data.unstructured_api_key, isSensitive: true, category: 'api' },
        { key: 'neo4j_uri', label: 'Neo4j URI', value: data.neo4j_uri || '', isConfigured: !!data.neo4j_uri, isSensitive: false, category: 'database' },
        { key: 'neo4j_username', label: 'Neo4j Username', value: data.neo4j_username || '', isConfigured: !!data.neo4j_username, isSensitive: false, category: 'database' },
        { key: 'neo4j_password', label: 'Neo4j Password', value: data.neo4j_password || '', isConfigured: !!data.neo4j_password, isSensitive: true, category: 'database' },
        { key: 'prompt_extraction_stage1_system', label: 'Stage 1 System Prompt', value: data.prompt_extraction_stage1_system || '', isConfigured: !!data.prompt_extraction_stage1_system, isSensitive: false, category: 'prompts' },
        { key: 'prompt_extraction_stage2_system', label: 'Stage 2 System Prompt', value: data.prompt_extraction_stage2_system || '', isConfigured: !!data.prompt_extraction_stage2_system, isSensitive: false, category: 'prompts' },
        { key: 'prompt_extraction_stage3_system', label: 'Stage 3 System Prompt', value: data.prompt_extraction_stage3_system || '', isConfigured: !!data.prompt_extraction_stage3_system, isSensitive: false, category: 'prompts' },
      ];
      setConfigs(configItems);
    } catch (error: any) {
      console.error("Error loading configs:", error);
      toast({
        variant: "destructive",
        title: t('configSummary.loadError'),
        description: error.message || t('configSummary.loadErrorDesc')
      });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleVisibility = (key: string) => {
    setVisibleKeys(prev => {
      const newSet = new Set(prev);
      if (newSet.has(key)) newSet.delete(key);
      else newSet.add(key);
      return newSet;
    });
  };

  const toggleShowAll = () => {
    if (showAll) setVisibleKeys(new Set());
    else setVisibleKeys(new Set(configs.map(c => c.key)));
    setShowAll(!showAll);
  };

  const maskValue = (value: string, isSensitive: boolean, isVisible: boolean) => {
    if (!value) return t('configSummary.notConfigured');
    if (isVisible) return value;
    if (!isSensitive) {
      if (value.length <= 15) return value;
      return `${value.substring(0, 10)}...${value.substring(value.length - 8)}`;
    }
    if (value.length <= 8) return '••••••••';
    return `${value.substring(0, 4)}${'•'.repeat(Math.min(20, value.length - 8))}${value.substring(value.length - 4)}`;
  };

  const configuredCount = configs.filter(c => c.isConfigured).length;
  const totalCount = configs.length;
  const categorizedConfigs = {
    api: configs.filter(c => c.category === 'api'),
    database: configs.filter(c => c.category === 'database'),
    prompts: configs.filter(c => c.category === 'prompts')
  };

  if (isLoading) {
    return (
      <Card><CardContent className="pt-6"><div className="flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div></CardContent></Card>
    );
  }

  const renderConfigList = (items: ConfigItem[]) => (
    <div className="space-y-2">
      {items.map(config => (
        <div key={config.key} className="flex items-center justify-between p-3 bg-background/50 rounded-lg border">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {config.isConfigured ? (
              <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
            ) : (
              <XCircle className="h-4 w-4 text-gray-400 flex-shrink-0" />
            )}
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">{config.label}</p>
              {isExpanded && (
                <p className="text-xs text-muted-foreground font-mono truncate">
                  {maskValue(config.value, config.isSensitive, visibleKeys.has(config.key))}
                </p>
              )}
            </div>
          </div>
          {config.isConfigured && (
            <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0" onClick={() => toggleVisibility(config.key)}>
              {visibleKeys.has(config.key) ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          )}
        </div>
      ))}
    </div>
  );

  return (
    <Card className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/20 dark:to-purple-950/20 border-indigo-200 dark:border-indigo-900">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Settings2 className="h-5 w-5" />
              {t('configSummary.title')}
            </CardTitle>
            <CardDescription>
              {t('configSummary.configuredOf', { count: configuredCount, total: totalCount })}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={toggleShowAll}>
              {showAll ? (
                <><EyeOff className="h-4 w-4 mr-2" />{t('configSummary.hideAll')}</>
              ) : (
                <><Eye className="h-4 w-4 mr-2" />{t('configSummary.showAll')}</>
              )}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setIsExpanded(!isExpanded)}>
              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-muted-foreground">🔑 {t('configSummary.apiKeys')}</h3>
          {renderConfigList(categorizedConfigs.api)}
        </div>

        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-muted-foreground">🔵 {t('configSummary.neo4jDatabase')}</h3>
          {renderConfigList(categorizedConfigs.database)}
        </div>

        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-muted-foreground">📝 {t('configSummary.extractionPromptsSummary')}</h3>
          <div className="flex items-center gap-2">
            <Badge variant="outline">
              {categorizedConfigs.prompts.filter(c => c.isConfigured).length} / {categorizedConfigs.prompts.length} {t('configSummary.configured')}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ConfigurationsSummary;
