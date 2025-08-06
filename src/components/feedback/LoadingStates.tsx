import React from 'react';
import { cn } from '@/lib/utils';
import { Loader2, AlertCircle, CheckCircle2, Info } from 'lucide-react';

// Skeleton Loading Components
export const SkeletonCard: React.FC<{ className?: string }> = ({ className }) => (
  <div className={cn("animate-pulse", className)}>
    <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
    <div className="h-3 bg-muted rounded w-1/2 mb-3"></div>
    <div className="h-8 bg-muted rounded"></div>
  </div>
);

export const SkeletonTable: React.FC<{ rows?: number; cols?: number }> = ({ 
  rows = 5, 
  cols = 4 
}) => (
  <div className="animate-pulse space-y-3">
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="flex space-x-3">
        {Array.from({ length: cols }).map((_, j) => (
          <div key={j} className="h-4 bg-muted rounded flex-1"></div>
        ))}
      </div>
    ))}
  </div>
);

export const SkeletonChart: React.FC<{ className?: string }> = ({ className }) => (
  <div className={cn("animate-pulse", className)}>
    <div className="h-6 bg-muted rounded w-1/3 mb-4"></div>
    <div className="h-64 bg-muted rounded"></div>
  </div>
);

// Loading States
interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'md', 
  className 
}) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8'
  };

  return (
    <Loader2 
      className={cn(
        "animate-spin text-primary",
        sizeClasses[size],
        className
      )} 
    />
  );
};

interface LoadingOverlayProps {
  isVisible: boolean;
  message?: string;
  children?: React.ReactNode;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ 
  isVisible, 
  message = "Carregando...",
  children 
}) => {
  if (!isVisible) return null;

  return (
    <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="flex flex-col items-center gap-3 text-center">
        <LoadingSpinner size="lg" />
        <p className="text-sm text-muted-foreground">{message}</p>
        {children}
      </div>
    </div>
  );
};

// Status Indicators
interface StatusIndicatorProps {
  status: 'loading' | 'success' | 'error' | 'info';
  message?: string;
  className?: string;
}

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({ 
  status, 
  message,
  className 
}) => {
  const configs = {
    loading: {
      icon: <LoadingSpinner size="sm" />,
      bgColor: 'bg-blue-50 dark:bg-blue-950/30',
      textColor: 'text-blue-700 dark:text-blue-300',
      borderColor: 'border-blue-200 dark:border-blue-800'
    },
    success: {
      icon: <CheckCircle2 className="h-4 w-4 text-success" />,
      bgColor: 'bg-success-subtle',
      textColor: 'text-success-foreground',
      borderColor: 'border-success'
    },
    error: {
      icon: <AlertCircle className="h-4 w-4 text-destructive" />,
      bgColor: 'bg-destructive-subtle',
      textColor: 'text-destructive-foreground',
      borderColor: 'border-destructive'
    },
    info: {
      icon: <Info className="h-4 w-4 text-info" />,
      bgColor: 'bg-info-subtle',
      textColor: 'text-info-foreground',
      borderColor: 'border-info'
    }
  };

  const config = configs[status];

  return (
    <div className={cn(
      "flex items-center gap-2 p-3 rounded-lg border",
      config.bgColor,
      config.textColor,
      config.borderColor,
      className
    )}>
      {config.icon}
      {message && <span className="text-sm font-medium">{message}</span>}
    </div>
  );
};

// Empty States
interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon,
  action,
  className
}) => (
  <div className={cn(
    "flex flex-col items-center justify-center text-center py-12 px-4",
    className
  )}>
    {icon && (
      <div className="mb-4 p-3 bg-muted rounded-full">
        {icon}
      </div>
    )}
    <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
    {description && (
      <p className="text-muted-foreground mb-6 max-w-md">{description}</p>
    )}
    {action}
  </div>
);