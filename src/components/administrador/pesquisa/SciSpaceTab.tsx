
import React, { useState, useEffect, useRef } from 'react';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Microscope, RefreshCw } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Form, FormField, FormItem, FormLabel, FormControl } from "@/components/ui/form";
import { toast } from "sonner";

const SciSpaceTab: React.FC = () => {
  const [config, setConfig] = useState({
    url: "https://www.scispace.com",
    allowScripts: true,
    allowForms: true,
    allowPopups: true,
    allowSameOrigin: true
  });
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [loading, setLoading] = useState(true);
  
  const handleConfigChange = (key: string, value: string | boolean) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  const getSandboxPermissions = () => {
    const permissions = [];
    if (config.allowScripts) permissions.push('allow-scripts');
    if (config.allowForms) permissions.push('allow-forms');
    if (config.allowPopups) permissions.push('allow-popups');
    if (config.allowSameOrigin) permissions.push('allow-same-origin');
    return permissions.join(' ');
  };
  
  const reloadIframe = () => {
    setLoading(true);
    if (iframeRef.current) {
      iframeRef.current.src = config.url;
      toast.info("Recarregando o SciSpace...");
    }
  };
  
  const handleIframeLoad = () => {
    setLoading(false);
    toast.success("SciSpace carregado com sucesso!");
  };
  
  useEffect(() => {
    // Verificar se a URL tem protocolo, adicionar https:// se não tiver
    if (config.url && !config.url.match(/^https?:\/\//)) {
      setConfig(prev => ({ ...prev, url: `https://${config.url}` }));
    }
  }, []);

  return (
    <div className="space-y-6 p-6">
      <Alert>
        <Microscope className="h-4 w-4" />
        <AlertDescription>
          Configure a integração com o SciSpace para pesquisa científica.
        </AlertDescription>
      </Alert>

      <Card className="p-6">
        <CardHeader className="p-0 pb-4">
          <CardTitle className="text-xl">Configurações do SciSpace</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="space-y-4">
            <div className="flex items-end gap-2">
              <div className="space-y-2 flex-1">
                <Label htmlFor="url">URL do SciSpace</Label>
                <Input
                  id="url"
                  value={config.url}
                  onChange={(e) => handleConfigChange('url', e.target.value)}
                  placeholder="https://scispace.com"
                />
              </div>
              <Button 
                variant="outline"
                onClick={reloadIframe}
                className="flex items-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Recarregar
              </Button>
            </div>

            <div className="space-y-4">
              <Label>Permissões do iframe</Label>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="allowScripts"
                    checked={config.allowScripts}
                    onCheckedChange={(checked) => handleConfigChange('allowScripts', checked)}
                  />
                  <Label htmlFor="allowScripts">Permitir scripts</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch
                    id="allowForms"
                    checked={config.allowForms}
                    onCheckedChange={(checked) => handleConfigChange('allowForms', checked)}
                  />
                  <Label htmlFor="allowForms">Permitir formulários</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch
                    id="allowPopups"
                    checked={config.allowPopups}
                    onCheckedChange={(checked) => handleConfigChange('allowPopups', checked)}
                  />
                  <Label htmlFor="allowPopups">Permitir popups</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch
                    id="allowSameOrigin"
                    checked={config.allowSameOrigin}
                    onCheckedChange={(checked) => handleConfigChange('allowSameOrigin', checked)}
                  />
                  <Label htmlFor="allowSameOrigin">Permitir same-origin</Label>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="w-full">
        <div className="relative w-full">
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
              <div className="flex flex-col items-center space-y-4">
                <RefreshCw className="h-8 w-8 animate-spin text-primary" />
                <p>Carregando SciSpace...</p>
              </div>
            </div>
          )}
          <iframe 
            ref={iframeRef}
            src={config.url}
            className="w-full h-[calc(100vh-32rem)] border-none"
            sandbox={getSandboxPermissions()}
            title="SciSpace Platform"
            onLoad={handleIframeLoad}
            allow="camera; microphone; geolocation"
          />
        </div>
      </Card>
    </div>
  );
};

export default SciSpaceTab;
