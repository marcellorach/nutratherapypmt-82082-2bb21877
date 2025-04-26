
import React, { useState, useEffect, useRef } from 'react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Microscope, RefreshCw, Link, ExternalLink } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
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
    allowSameOrigin: true,
    allowFullscreen: true
  });
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [iframeKey, setIframeKey] = useState<number>(0);
  
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
    setError(null);
    // Força a recriação do iframe alterando a key
    setIframeKey(prev => prev + 1);
    toast.info("Recarregando o SciSpace...");
  };
  
  const handleIframeLoad = () => {
    setLoading(false);
    toast.success("SciSpace carregado com sucesso!");
  };

  const handleIframeError = () => {
    setLoading(false);
    setError("Erro ao carregar o SciSpace. Verifique a URL e tente novamente.");
    toast.error("Erro ao carregar o SciSpace");
  };
  
  useEffect(() => {
    // Verificar se a URL tem protocolo, adicionar https:// se não tiver
    if (config.url && !config.url.match(/^https?:\/\//)) {
      setConfig(prev => ({ ...prev, url: `https://${config.url}` }));
    }
  }, []);

  // Abre o site em uma nova guia
  const openInNewTab = () => {
    window.open(config.url, '_blank');
  };

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
              <Button 
                variant="secondary"
                onClick={openInNewTab}
                className="flex items-center gap-2"
              >
                <ExternalLink className="h-4 w-4" />
                Abrir em Nova Guia
              </Button>
            </div>

            <div className="space-y-4">
              <Label>Permissões do iframe</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
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

                <div className="flex items-center space-x-2">
                  <Switch
                    id="allowFullscreen"
                    checked={config.allowFullscreen}
                    onCheckedChange={(checked) => handleConfigChange('allowFullscreen', checked)}
                  />
                  <Label htmlFor="allowFullscreen">Permitir tela cheia</Label>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="w-full overflow-hidden">
        <div className="relative w-full">
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
              <div className="flex flex-col items-center space-y-4">
                <RefreshCw className="h-8 w-8 animate-spin text-primary" />
                <p>Carregando SciSpace...</p>
              </div>
            </div>
          )}
          
          {error && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
              <div className="flex flex-col items-center space-y-4 max-w-md text-center p-6">
                <Alert variant="destructive">
                  <AlertTitle>Erro ao carregar</AlertTitle>
                  <AlertDescription>
                    {error}
                    <div className="mt-4 flex justify-center">
                      <Button onClick={reloadIframe} variant="outline" className="mr-2">
                        <RefreshCw className="h-4 w-4 mr-1" /> Tentar novamente
                      </Button>
                      <Button onClick={openInNewTab} variant="default">
                        <ExternalLink className="h-4 w-4 mr-1" /> Abrir em nova aba
                      </Button>
                    </div>
                  </AlertDescription>
                </Alert>
              </div>
            </div>
          )}
          
          <iframe 
            key={iframeKey}
            ref={iframeRef}
            src={config.url}
            className="w-full h-[calc(100vh-32rem)]"
            sandbox={getSandboxPermissions()}
            title="SciSpace Platform"
            onLoad={handleIframeLoad}
            onError={handleIframeError}
            allow={`camera; microphone; geolocation; ${config.allowFullscreen ? 'fullscreen' : ''}`}
            style={{border: "1px solid #e2e8f0", borderRadius: "0.5rem"}}
          />
        </div>
        <CardFooter className="text-sm text-muted-foreground pt-4 pb-2">
          <Link className="h-4 w-4 mr-1" /> {config.url}
        </CardFooter>
      </Card>
    </div>
  );
};

export default SciSpaceTab;
