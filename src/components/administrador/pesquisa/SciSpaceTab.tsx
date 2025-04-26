
import React, { useState, useEffect, useRef } from 'react';
import { toast } from "sonner";
import SciSpaceHeader from './scispace/SciSpaceHeader';
import SciSpaceConfig from './scispace/SciSpaceConfig';
import SciSpaceEmbed from './scispace/SciSpaceEmbed';

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
  const [embedBlocked, setEmbedBlocked] = useState(false);
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
    setEmbedBlocked(false);
    setIframeKey(prev => prev + 1);
    toast.info("Recarregando o SciSpace...");
  };

  const handleIframeLoad = () => {
    setLoading(false);
    try {
      const iframeContent = iframeRef.current?.contentWindow?.document;
      if (!iframeContent) {
        setEmbedBlocked(true);
      } else {
        toast.success("SciSpace carregado com sucesso!");
      }
    } catch (e) {
      setEmbedBlocked(true);
    }
  };

  const handleIframeError = () => {
    setLoading(false);
    setError("Erro ao carregar o SciSpace. Verifique a URL e tente novamente.");
    toast.error("Erro ao carregar o SciSpace");
  };

  const openInNewTab = () => {
    window.open(config.url, '_blank');
  };
  
  useEffect(() => {
    if (config.url && !config.url.match(/^https?:\/\//)) {
      setConfig(prev => ({ ...prev, url: `https://${config.url}` }));
    }
    
    const timer = setTimeout(() => {
      if (loading) {
        setEmbedBlocked(true);
        setLoading(false);
      }
    }, 5000);
    
    return () => clearTimeout(timer);
  }, [config.url, loading]);

  return (
    <div className="space-y-6 p-6">
      <SciSpaceHeader />
      
      <SciSpaceConfig 
        config={config}
        onConfigChange={handleConfigChange}
        onReload={reloadIframe}
        onOpenNewTab={openInNewTab}
      />

      <SciSpaceEmbed 
        loading={loading}
        error={error}
        embedBlocked={embedBlocked}
        config={config}
        iframeRef={iframeRef}
        iframeKey={iframeKey}
        onLoad={handleIframeLoad}
        onError={handleIframeError}
        onReload={reloadIframe}
        onOpenNewTab={openInNewTab}
        getSandboxPermissions={getSandboxPermissions}
      />
    </div>
  );
};

export default SciSpaceTab;
