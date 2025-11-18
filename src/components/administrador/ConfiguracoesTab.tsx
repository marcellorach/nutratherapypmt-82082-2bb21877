import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Settings, RefreshCw, Key } from "lucide-react";
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';

const ConfiguracoesTab: React.FC = () => {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [unstructuredApiKey, setUnstructuredApiKey] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    loadUnstructuredApiKey();
  }, []);

  const loadUnstructuredApiKey = async () => {
    try {
      const { data, error } = await supabase
        .from('ai_configurations')
        .select('config_value')
        .eq('config_key', 'unstructured_api_key')
        .maybeSingle();
      
      if (data && !error) {
        const configValue = data.config_value;
        let keyValue = '';
        
        if (typeof configValue === 'string') {
          keyValue = configValue;
        } else if (configValue && typeof configValue === 'object' && 'key' in configValue) {
          keyValue = String(configValue.key || '');
        }
        
        setUnstructuredApiKey(keyValue);
      }
    } catch (error) {
      console.error('Failed to load Unstructured API key:', error);
    }
  };

  const handleSaveSettings = async () => {
    setIsLoading(true);
    try {
      // Save Unstructured API key
      const { error } = await supabase
        .from('ai_configurations')
        .update({ 
          config_value: { key: unstructuredApiKey },
          updated_at: new Date().toISOString()
        })
        .eq('config_key', 'unstructured_api_key');

      if (error) throw error;
      
      toast({
        title: t('admin.settings.messages.saved'),
        description: 'API key saved successfully',
      });
    } catch (error) {
      console.error('Save error:', error);
      toast({
        title: t('messages.error'),
        description: t('admin.settings.messages.error'),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">{t('admin.settings.title')}</h2>
        <Button onClick={handleSaveSettings} disabled={isLoading}>
          {isLoading ? (
            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Settings className="h-4 w-4 mr-2" />
          )}
          {t('admin.settings.saveButton')}
        </Button>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>{t('admin.settings.general.title')}</CardTitle>
            <CardDescription>
              {t('admin.settings.general.description')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="sistema-nome">{t('admin.settings.general.systemName')}</Label>
                <Input 
                  id="sistema-nome" 
                  defaultValue="Sistema de Nutracêuticos" 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="versao">{t('admin.settings.general.version')}</Label>
                <Input 
                  id="versao" 
                  defaultValue="1.0.0" 
                  disabled
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              NTAI Configuration
            </CardTitle>
            <CardDescription>
              Configure API keys for document parsing and AI processing
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="unstructured-key">
                Unstructured.io API Key
                <span className="text-xs text-muted-foreground ml-2">
                  (Required for PDF parsing)
                </span>
              </Label>
              <Input 
                id="unstructured-key"
                type="password"
                placeholder="Enter your Unstructured.io API key"
                value={unstructuredApiKey}
                onChange={(e) => setUnstructuredApiKey(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Get your free API key at{' '}
                <a 
                  href="https://unstructured.io" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  unstructured.io
                </a>
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('admin.settings.data.title')}</CardTitle>
            <CardDescription>
              {t('admin.settings.data.description')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="backup-interval">{t('admin.settings.data.backupInterval')}</Label>
                <Input 
                  id="backup-interval" 
                  type="number" 
                  defaultValue="24" 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cache-timeout">{t('admin.settings.data.cacheTimeout')}</Label>
                <Input 
                  id="cache-timeout" 
                  type="number" 
                  defaultValue="60" 
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ConfiguracoesTab;