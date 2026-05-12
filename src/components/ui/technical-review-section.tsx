import { useState, type ReactNode } from 'react';
import { ChevronDown, Wrench } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface TechnicalReviewSectionProps {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
  description?: string;
  className?: string;
}

/**
 * Wrapper âmbar para conteúdo de revisão técnica / QA interna.
 * Default: colapsado, exibindo apenas título + badge + chevron.
 * Não fará parte da versão operacional.
 */
export function TechnicalReviewSection({
  title,
  children,
  defaultOpen = false,
  description = 'Disponível para validação interna. Não fará parte da versão operacional.',
  className,
}: TechnicalReviewSectionProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section
      className={cn(
        'rounded-lg border border-warning/30 bg-warning/5',
        className,
      )}
    >
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left hover:bg-warning/10 rounded-lg transition-colors"
        aria-expanded={open}
      >
        <div className="flex items-center gap-2 min-w-0">
          <TooltipProvider delayDuration={200}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge
                  variant="outline"
                  className="border-warning/40 bg-warning/15 text-warning-foreground dark:text-warning shrink-0 gap-1"
                >
                  <Wrench className="h-3 w-3" />
                  Revisão técnica
                </Badge>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-xs">
                {description}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <span className="text-sm font-medium truncate">{title}</span>
        </div>
        <ChevronDown
          className={cn(
            'h-4 w-4 text-muted-foreground transition-transform shrink-0',
            open && 'rotate-180',
          )}
        />
      </button>
      {open && <div className="px-4 pb-4 pt-1">{children}</div>}
    </section>
  );
}

export default TechnicalReviewSection;