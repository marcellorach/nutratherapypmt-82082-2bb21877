import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { ChevronDown, Eye, EyeOff } from 'lucide-react';

// Focus Trap
interface FocusTrapProps {
  children: React.ReactNode;
  active?: boolean;
  className?: string;
}

export const FocusTrap: React.FC<FocusTrapProps> = ({ 
  children, 
  active = true,
  className 
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!active) return;

    const container = containerRef.current;
    if (!container) return;

    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          lastElement?.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === lastElement) {
          firstElement?.focus();
          e.preventDefault();
        }
      }
    };

    const handleEscapeKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        const closeButton = container.querySelector('[data-close]') as HTMLElement;
        closeButton?.click();
      }
    };

    container.addEventListener('keydown', handleTabKey);
    container.addEventListener('keydown', handleEscapeKey);
    firstElement?.focus();

    return () => {
      container.removeEventListener('keydown', handleTabKey);
      container.removeEventListener('keydown', handleEscapeKey);
    };
  }, [active]);

  return (
    <div ref={containerRef} className={className}>
      {children}
    </div>
  );
};

// Skip Link
interface SkipLinkProps {
  href: string;
  children: React.ReactNode;
}

export const SkipLink: React.FC<SkipLinkProps> = ({ href, children }) => (
  <a
    href={href}
    className={cn(
      "absolute -top-40 left-6 z-50 bg-primary text-primary-foreground",
      "px-4 py-2 rounded-md font-medium transition-all",
      "focus:top-6 focus:outline-none focus:ring-2 focus:ring-ring"
    )}
  >
    {children}
  </a>
);

// Screen Reader Only
export const ScreenReaderOnly: React.FC<{ children: React.ReactNode }> = ({ 
  children 
}) => (
  <span className="sr-only">
    {children}
  </span>
);

// Live Region for announcements
interface LiveRegionProps {
  children: React.ReactNode;
  priority?: 'polite' | 'assertive';
  atomic?: boolean;
}

export const LiveRegion: React.FC<LiveRegionProps> = ({
  children,
  priority = 'polite',
  atomic = true
}) => (
  <div
    aria-live={priority}
    aria-atomic={atomic}
    className="sr-only"
  >
    {children}
  </div>
);

// Accessible Button
interface AccessibleButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  loadingText?: string;
}

export const AccessibleButton: React.FC<AccessibleButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  loadingText = 'Carregando...',
  disabled,
  className,
  ...props
}) => {
  const variants = {
    primary: 'bg-primary text-primary-foreground hover:bg-primary/90',
    secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
    ghost: 'hover:bg-accent hover:text-accent-foreground',
    destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90'
  };

  const sizes = {
    sm: 'h-8 px-3 text-sm',
    md: 'h-10 px-4',
    lg: 'h-12 px-6 text-lg'
  };

  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-md font-medium',
        'transition-colors focus:outline-none focus:ring-2 focus:ring-ring',
        'disabled:pointer-events-none disabled:opacity-50',
        variants[variant],
        sizes[size],
        className
      )}
      disabled={disabled || loading}
      aria-disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <>
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
          <ScreenReaderOnly>{loadingText}</ScreenReaderOnly>
        </>
      )}
      {!loading && children}
    </button>
  );
};

// Accessible Input
interface AccessibleInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  description?: string;
  showLabel?: boolean;
}

export const AccessibleInput: React.FC<AccessibleInputProps> = ({
  label,
  error,
  description,
  showLabel = true,
  id,
  className,
  ...props
}) => {
  const inputId = id || `input-${Math.random().toString(36).substring(2, 9)}`;
  const descriptionId = description ? `${inputId}-description` : undefined;
  const errorId = error ? `${inputId}-error` : undefined;

  return (
    <div className="space-y-2">
      <label
        htmlFor={inputId}
        className={cn(
          "text-sm font-medium leading-none",
          !showLabel && "sr-only"
        )}
      >
        {label}
      </label>
      
      {description && (
        <p id={descriptionId} className="text-sm text-muted-foreground">
          {description}
        </p>
      )}
      
      <input
        id={inputId}
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2",
          "text-sm ring-offset-background file:border-0 file:bg-transparent",
          "file:text-sm file:font-medium placeholder:text-muted-foreground",
          "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
          "disabled:cursor-not-allowed disabled:opacity-50",
          error && "border-destructive focus:ring-destructive",
          className
        )}
        aria-describedby={cn(descriptionId, errorId)}
        aria-invalid={!!error}
        {...props}
      />
      
      {error && (
        <p id={errorId} className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  );
};

// Accessible Select
interface AccessibleSelectProps {
  label: string;
  options: Array<{ value: string; label: string; disabled?: boolean }>;
  value?: string;
  onChange?: (value: string) => void;
  error?: string;
  description?: string;
  placeholder?: string;
  showLabel?: boolean;
}

export const AccessibleSelect: React.FC<AccessibleSelectProps> = ({
  label,
  options,
  value,
  onChange,
  error,
  description,
  placeholder = "Selecione uma opção",
  showLabel = true
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectId = `select-${Math.random().toString(36).substring(2, 9)}`;
  const descriptionId = description ? `${selectId}-description` : undefined;
  const errorId = error ? `${selectId}-error` : undefined;

  const selectedOption = options.find(opt => opt.value === value);

  return (
    <div className="space-y-2">
      <label
        htmlFor={selectId}
        className={cn(
          "text-sm font-medium leading-none",
          !showLabel && "sr-only"
        )}
      >
        {label}
      </label>
      
      {description && (
        <p id={descriptionId} className="text-sm text-muted-foreground">
          {description}
        </p>
      )}
      
      <div className="relative">
        <button
          id={selectId}
          type="button"
          className={cn(
            "flex h-10 w-full items-center justify-between rounded-md border",
            "border-input bg-background px-3 py-2 text-sm ring-offset-background",
            "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
            "disabled:cursor-not-allowed disabled:opacity-50",
            error && "border-destructive focus:ring-destructive"
          )}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          aria-describedby={cn(descriptionId, errorId)}
          aria-invalid={!!error}
          onClick={() => setIsOpen(!isOpen)}
        >
          <span className={selectedOption ? "" : "text-muted-foreground"}>
            {selectedOption?.label || placeholder}
          </span>
          <ChevronDown className="h-4 w-4 opacity-50" />
        </button>
        
        {isOpen && (
          <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-md shadow-md">
            <ul role="listbox" className="py-1">
              {options.map((option) => (
                <li key={option.value}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={value === option.value}
                    disabled={option.disabled}
                    className={cn(
                      "w-full px-3 py-2 text-left text-sm hover:bg-accent",
                      "focus:bg-accent focus:outline-none",
                      value === option.value && "bg-accent",
                      option.disabled && "opacity-50 cursor-not-allowed"
                    )}
                    onClick={() => {
                      if (!option.disabled) {
                        onChange?.(option.value);
                        setIsOpen(false);
                      }
                    }}
                  >
                    {option.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
      
      {error && (
        <p id={errorId} className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  );
};

// Password Visibility Toggle
interface PasswordInputProps extends Omit<AccessibleInputProps, 'type'> {
  showPasswordLabel?: string;
  hidePasswordLabel?: string;
}

export const PasswordInput: React.FC<PasswordInputProps> = ({
  showPasswordLabel = "Mostrar senha",
  hidePasswordLabel = "Ocultar senha",
  className,
  ...props
}) => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="relative">
      <AccessibleInput
        {...props}
        type={showPassword ? "text" : "password"}
        className={cn("pr-10", className)}
      />
      <button
        type="button"
        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
        onClick={() => setShowPassword(!showPassword)}
        aria-label={showPassword ? hidePasswordLabel : showPasswordLabel}
      >
        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
};