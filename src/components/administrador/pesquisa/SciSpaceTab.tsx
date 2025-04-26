
import React, { useState } from 'react';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Microscope } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

const SciSpaceTab: React.FC = () => {
  const [config, setConfig] = useState({
    url: "https://scispace.com",
    allowScripts: true,
    allowForms: true,
    allowPopups: true,
    allowSameOrigin: true
  });

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

  return (
    <div className="space-y-6 p-6">
      <Alert>
        <Microscope className="h-4 w-4" />
        <AlertDescription>
          Configure a integração com o SciSpace para pesquisa científica.
        </AlertDescription>
      </Alert>

      <Card className="p-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="url">URL do SciSpace</Label>
            <Input
              id="url"
              value={config.url}
              onChange={(e) => handleConfigChange('url', e.target.value)}
              placeholder="https://scispace.com"
            />
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
      </Card>

      <Card className="w-full">
        <iframe 
          src={config.url}
          className="w-full h-[calc(100vh-32rem)] border-none"
          sandbox={getSandboxPermissions()}
          title="SciSpace Platform"
        />
      </Card>
    </div>
  );
};

export default SciSpaceTab;
