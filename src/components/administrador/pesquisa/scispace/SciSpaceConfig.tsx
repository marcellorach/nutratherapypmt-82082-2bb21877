
import React from 'react';
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { RefreshCw, ExternalLink } from "lucide-react";

interface SciSpaceConfigProps {
  config: {
    url: string;
    allowScripts: boolean;
    allowForms: boolean;
    allowPopups: boolean;
    allowSameOrigin: boolean;
    allowFullscreen: boolean;
  };
  onConfigChange: (key: string, value: string | boolean) => void;
  onReload: () => void;
  onOpenNewTab: () => void;
}

const SciSpaceConfig: React.FC<SciSpaceConfigProps> = ({
  config,
  onConfigChange,
  onReload,
  onOpenNewTab
}) => {
  return (
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
                onChange={(e) => onConfigChange('url', e.target.value)}
                placeholder="https://scispace.com"
              />
            </div>
            <Button 
              variant="outline"
              onClick={onReload}
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Recarregar
            </Button>
            <Button 
              variant="secondary"
              onClick={onOpenNewTab}
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
                  onCheckedChange={(checked) => onConfigChange('allowScripts', checked)}
                />
                <Label htmlFor="allowScripts">Permitir scripts</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="allowForms"
                  checked={config.allowForms}
                  onCheckedChange={(checked) => onConfigChange('allowForms', checked)}
                />
                <Label htmlFor="allowForms">Permitir formulários</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="allowPopups"
                  checked={config.allowPopups}
                  onCheckedChange={(checked) => onConfigChange('allowPopups', checked)}
                />
                <Label htmlFor="allowPopups">Permitir popups</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="allowSameOrigin"
                  checked={config.allowSameOrigin}
                  onCheckedChange={(checked) => onConfigChange('allowSameOrigin', checked)}
                />
                <Label htmlFor="allowSameOrigin">Permitir same-origin</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="allowFullscreen"
                  checked={config.allowFullscreen}
                  onCheckedChange={(checked) => onConfigChange('allowFullscreen', checked)}
                />
                <Label htmlFor="allowFullscreen">Permitir tela cheia</Label>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SciSpaceConfig;
