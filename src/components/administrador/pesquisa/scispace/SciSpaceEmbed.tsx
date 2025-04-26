
import React from 'react';
import { RefreshCw, ExternalLink, AlertCircle, Link } from "lucide-react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardFooter } from "@/components/ui/card";

interface SciSpaceEmbedProps {
  loading: boolean;
  error: string | null;
  embedBlocked: boolean;
  config: {
    url: string;
    allowFullscreen: boolean;
  };
  iframeRef: React.RefObject<HTMLIFrameElement>;
  iframeKey: number;
  onLoad: () => void;
  onError: () => void;
  onReload: () => void;
  onOpenNewTab: () => void;
  getSandboxPermissions: () => string;
}

const SciSpaceEmbed: React.FC<SciSpaceEmbedProps> = ({
  loading,
  error,
  embedBlocked,
  config,
  iframeRef,
  iframeKey,
  onLoad,
  onError,
  onReload,
  onOpenNewTab,
  getSandboxPermissions
}) => {
  const renderAlternatives = () => (
    <div className="flex flex-col space-y-6 py-8">
      <Alert variant="default" className="bg-amber-50 border-amber-200">
        <AlertCircle className="h-5 w-5 text-amber-500" />
        <AlertTitle className="text-amber-800">Incorporação bloqueada</AlertTitle>
        <AlertDescription className="text-amber-700">
          <p className="mb-4">
            O site SciSpace parece estar bloqueando a incorporação direta nesta página, 
            possivelmente devido a políticas de segurança do site.
          </p>
          <p className="mb-4">
            Você pode tentar algumas alternativas:
          </p>
          <ul className="list-disc pl-6 space-y-2 mb-4">
            <li>Acessar o SciSpace diretamente em uma nova guia do navegador</li>
            <li>Verificar se há uma API oficial do SciSpace para integração</li>
            <li>Entrar em contato com o suporte do SciSpace sobre opções de incorporação</li>
          </ul>
        </AlertDescription>
      </Alert>
      
      <div className="flex flex-col md:flex-row gap-4">
        <Button 
          onClick={onOpenNewTab}
          size="lg" 
          className="flex-1 space-x-2"
        >
          <ExternalLink className="h-5 w-5" />
          <span>Abrir SciSpace em Nova Guia</span>
        </Button>
        
        <Button 
          onClick={onReload}
          variant="outline"
          size="lg"
          className="flex-1 space-x-2"
        >
          <RefreshCw className="h-5 w-5" />
          <span>Tentar Novamente</span>
        </Button>
      </div>
    </div>
  );

  return (
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
                    <Button onClick={onReload} variant="outline" className="mr-2">
                      <RefreshCw className="h-4 w-4 mr-1" /> Tentar novamente
                    </Button>
                    <Button onClick={onOpenNewTab} variant="default">
                      <ExternalLink className="h-4 w-4 mr-1" /> Abrir em nova aba
                    </Button>
                  </div>
                </AlertDescription>
              </Alert>
            </div>
          </div>
        )}
        
        {embedBlocked ? (
          renderAlternatives()
        ) : (
          <iframe 
            key={iframeKey}
            ref={iframeRef}
            src={config.url}
            className="w-full h-[calc(100vh-32rem)]"
            sandbox={getSandboxPermissions()}
            title="SciSpace Platform"
            onLoad={onLoad}
            onError={onError}
            allow={`camera; microphone; geolocation; ${config.allowFullscreen ? 'fullscreen' : ''}`}
            style={{border: "1px solid #e2e8f0", borderRadius: "0.5rem"}}
          />
        )}
      </div>
      <CardFooter className="text-sm text-muted-foreground pt-4 pb-2">
        <Link className="h-4 w-4 mr-1" /> {config.url}
      </CardFooter>
    </Card>
  );
};

export default SciSpaceEmbed;
