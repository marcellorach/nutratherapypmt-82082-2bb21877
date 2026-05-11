import React from 'react';
import { HelpCircle } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

export interface HelpHintProps {
  /** Short bold title shown at the top of the tooltip body */
  title?: string;
  /** Main explanation text (plain string or rich node) */
  children: React.ReactNode;
  /** Optional className for the trigger icon wrapper */
  className?: string;
  /** Visual size of the icon */
  size?: number;
  side?: 'top' | 'bottom' | 'left' | 'right';
}

/**
 * Inline contextual help. Renders a small (?) icon that opens a
 * didactic tooltip explaining a complex concept. Use it next to
 * section titles, stepper labels and any UI that requires technical
 * background knowledge.
 */
const HelpHint: React.FC<HelpHintProps> = ({ title, children, className, size = 14, side = 'top' }) => {
  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            aria-label={typeof title === 'string' ? title : 'Ajuda'}
            className={cn(
              'inline-flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground transition-colors align-middle',
              className,
            )}
          >
            <HelpCircle style={{ width: size, height: size }} />
          </button>
        </TooltipTrigger>
        <TooltipContent side={side} className="max-w-xs text-xs leading-relaxed">
          {title && <p className="font-semibold mb-1">{title}</p>}
          <div className="text-muted-foreground">{children}</div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default HelpHint;
export { HelpHint };