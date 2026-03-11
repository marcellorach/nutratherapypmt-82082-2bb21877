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

/**
 * Sanitize Mermaid code to fix common LLM-generated syntax issues
 * that are incompatible with mermaid.js v11
 */
const sanitizeMermaidCode = (code: string): string => {
  let sanitized = code.trim();

  // Remove :::className patterns (e.g., A["Label"]:::nutra)
  sanitized = sanitized.replace(/:::[\w-]+/g, '');

  // Remove classDef lines entirely
  sanitized = sanitized.replace(/^\s*classDef\s+.*$/gm, '');

  // Remove class assignment lines (e.g., class A,B nutra)
  sanitized = sanitized.replace(/^\s*class\s+[\w,\s]+\s+\w+\s*$/gm, '');

  // Replace -.-> with -->
  sanitized = sanitized.replace(/-\.->|-.->|–.->|—.->|-\.\s*->/g, '-->');

  // Replace ==> with -->
  sanitized = sanitized.replace(/==>/g, '-->');

  // Replace ===> with -->
  sanitized = sanitized.replace(/===>/g, '-->');

  // Fix hexagon syntax {{label}} -> ["label"]
  sanitized = sanitized.replace(/\{\{([^}]+)\}\}/g, '["$1"]');

  // Fix cylinder syntax [("label")] or [(label)] -> ["label"]
  sanitized = sanitized.replace(/\[\(([^)]+)\)\]/g, '["$1"]');

  // Fix diamond syntax {label} that's not inside {{ }} -> ["label"]
  // Only match single braces used as node shapes, not edge labels
  sanitized = sanitized.replace(/(\w+)\{([^{}|]+)\}/g, '$1["$2"]');

  // Remove empty lines (multiple blank lines -> single)
  sanitized = sanitized.replace(/\n{3,}/g, '\n\n');

  return sanitized;
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
        const sanitizedCode = sanitizeMermaidCode(code);
        const { svg: renderedSvg } = await mermaid.render(`mermaid-${uniqueId}`, sanitizedCode);
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
