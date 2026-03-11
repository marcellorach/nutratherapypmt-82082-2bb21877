import React, { useEffect, useRef, useState, useId } from 'react';
import mermaid from 'mermaid';

interface MermaidBlockProps {
  code: string;
}

let mermaidInitialized = false;

const initMermaid = (isDark: boolean) => {
  mermaid.initialize({
    startOnLoad: false,
    theme: isDark ? 'dark' : 'default',
    securityLevel: 'loose',
    fontFamily: 'inherit',
  });
  mermaidInitialized = true;
};

const MermaidBlock: React.FC<MermaidBlockProps> = ({ code }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svg, setSvg] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const uniqueId = useId().replace(/:/g, '_');

  useEffect(() => {
    const isDark = document.documentElement.classList.contains('dark');
    if (!mermaidInitialized) {
      initMermaid(isDark);
    }

    const renderDiagram = async () => {
      try {
        setError(null);
        const { svg: renderedSvg } = await mermaid.render(`mermaid-${uniqueId}`, code.trim());
        setSvg(renderedSvg);
      } catch (e) {
        console.error('Mermaid render error:', e);
        setError(e instanceof Error ? e.message : 'Erro ao renderizar diagrama');
      }
    };

    renderDiagram();
  }, [code, uniqueId]);

  if (error) {
    return (
      <div className="my-4 rounded-lg border border-destructive/30 bg-destructive/5 p-4">
        <p className="text-xs text-destructive mb-2">Erro no diagrama:</p>
        <pre className="text-xs overflow-x-auto whitespace-pre-wrap font-mono text-muted-foreground">{code}</pre>
      </div>
    );
  }

  if (!svg) {
    return (
      <div className="my-4 flex items-center justify-center p-8 rounded-lg border bg-muted/30">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="my-4 overflow-x-auto rounded-lg border bg-card p-4"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
};

export default MermaidBlock;
