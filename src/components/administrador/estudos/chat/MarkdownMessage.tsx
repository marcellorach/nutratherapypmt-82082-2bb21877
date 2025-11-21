import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSanitize from 'rehype-sanitize';
import { Quote, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CitationCard } from './CitationCard';

interface MarkdownMessageProps {
  content: string;
}

export const MarkdownMessage = ({ content }: MarkdownMessageProps) => {
  // Detectar e extrair citações no formato [Citação: texto]
  const detectCitations = (text: string): { text: string; citations: Array<{ citation: string; section?: string }> } => {
    const citationRegex = /\[Citação:\s*([^\]]+)\]/g;
    const citations: Array<{ citation: string; section?: string }> = [];
    let cleanText = text;
    
    let match;
    while ((match = citationRegex.exec(text)) !== null) {
      const fullCitation = match[1];
      // Tentar extrair seção se houver padrão "texto - Seção X"
      const sectionMatch = fullCitation.match(/(.+?)\s*-\s*(Seção .+|Parágrafo .+|Tabela .+)/);
      if (sectionMatch) {
        citations.push({ citation: sectionMatch[1].trim(), section: sectionMatch[2].trim() });
      } else {
        citations.push({ citation: fullCitation.trim() });
      }
    }
    
    cleanText = text.replace(citationRegex, '');
    return { text: cleanText, citations };
  };

  // Detectar scores no formato "X/Y" e renderizar como progress bar
  const renderScoreAsProgress = (text: string) => {
    const scoreRegex = /(\d+)\/(\d+)/g;
    return text.replace(scoreRegex, (match, current, total) => {
      const percentage = (parseInt(current) / parseInt(total)) * 100;
      return `<span class="score-indicator" data-current="${current}" data-total="${total}" data-percentage="${percentage}">${match}</span>`;
    });
  };

  const { text: processedContent, citations } = detectCitations(content);

  return (
    <div className="space-y-2">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeSanitize]}
        components={{
          // Headings com emojis e estilo
          h1: ({ children }) => (
            <h1 className="text-xl font-bold text-foreground mt-4 mb-2 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-lg font-semibold text-foreground mt-3 mb-2">{children}</h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-base font-semibold text-foreground mt-2 mb-1">{children}</h3>
          ),
          h4: ({ children }) => (
            <h4 className="text-sm font-semibold text-foreground mt-2 mb-1">{children}</h4>
          ),
          
          // Text formatting
          strong: ({ children }) => (
            <strong className="font-bold text-primary">{children}</strong>
          ),
          em: ({ children }) => (
            <em className="italic text-muted-foreground">{children}</em>
          ),
          
          // Lists
          ul: ({ children }) => (
            <ul className="list-disc list-inside space-y-1 ml-2 my-2">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal list-inside space-y-1 ml-2 my-2">{children}</ol>
          ),
          li: ({ children }) => (
            <li className="text-sm text-foreground leading-relaxed">{children}</li>
          ),
          
          // Code blocks
          code: ({ children, className }) => {
            const text = String(children);
            const isInline = !className?.includes('language-');
            
            if (isInline) {
              // Detectar nutracêuticos (palavras começando com maiúscula seguidas de texto)
              if (/^[A-Z][a-zA-Z]+$/.test(text.trim())) {
                return (
                  <Badge variant="secondary" className="mx-0.5 px-2 py-0.5 text-xs font-medium">
                    {children}
                  </Badge>
                );
              }
              return (
                <code className="px-1.5 py-0.5 bg-muted rounded text-xs font-mono text-foreground">
                  {children}
                </code>
              );
            }
            
            return (
              <pre className="p-3 bg-muted rounded-md text-xs font-mono overflow-x-auto my-2">
                <code className="text-foreground">{children}</code>
              </pre>
            );
          },
          
          // Horizontal rule
          hr: () => <hr className="my-4 border-border" />,
          
          // Links
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline hover:text-primary/80 transition-colors"
            >
              {children}
            </a>
          ),
          
          // Paragraphs
          p: ({ children }) => {
            const text = String(children);
            
            // Detectar scores e renderizar com progress bar
            const hasScore = /\d+\/\d+/.test(text);
            if (hasScore) {
              const scoreMatch = text.match(/(\d+)\/(\d+)/);
              if (scoreMatch) {
                const [_, current, total] = scoreMatch;
                const percentage = (parseInt(current) / parseInt(total)) * 100;
                
                return (
                  <div className="my-2 p-2 bg-muted/50 rounded-md">
                    <p className="text-sm text-foreground mb-1">{text}</p>
                    <div className="flex items-center gap-2">
                      <Progress value={percentage} className="flex-1 h-2" />
                      <span className="text-xs text-muted-foreground font-medium">
                        {percentage.toFixed(0)}%
                      </span>
                    </div>
                  </div>
                );
              }
            }
            
            return (
              <p className="text-sm text-foreground leading-relaxed my-2">{children}</p>
            );
          },
          
          // Blockquotes
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-primary pl-4 py-2 my-2 bg-muted/30 rounded-r">
              <div className="flex items-start gap-2">
                <Quote className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                <div className="text-sm text-muted-foreground italic">{children}</div>
              </div>
            </blockquote>
          ),
        }}
      >
        {processedContent}
      </ReactMarkdown>
      
      {/* Renderizar citações extraídas */}
      {citations.length > 0 && (
        <div className="space-y-2 mt-3">
          {citations.map((cit, index) => (
            <CitationCard
              key={index}
              citation={cit.citation}
              section={cit.section}
            />
          ))}
        </div>
      )}
    </div>
  );
};
