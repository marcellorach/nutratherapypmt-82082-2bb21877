import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

// Base Status Badge Component
interface StatusBadgeProps {
  status: 'success' | 'warning' | 'error' | 'info' | 'neutral';
  children: React.ReactNode;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ 
  status, 
  children, 
  className 
}) => {
  const statusClasses = {
    success: 'bg-green-50 text-green-700 border-green-200',
    warning: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    error: 'bg-red-50 text-red-700 border-red-200',
    info: 'bg-blue-50 text-blue-700 border-blue-200',
    neutral: 'bg-surface-variant text-muted-foreground border-border'
  };

  return (
    <Badge 
      variant="outline" 
      className={cn(statusClasses[status], className)}
    >
      {children}
    </Badge>
  );
};

// Base Metric Card Component
interface MetricCardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
  trend?: {
    value: number;
    label: string;
  };
  className?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  icon,
  variant = 'default',
  trend,
  className
}) => {
  const variantClasses = {
    default: 'bg-surface-elevated border-border',
    success: 'bg-green-50 border-green-200',
    warning: 'bg-yellow-50 border-yellow-200',
    error: 'bg-red-50 border-red-200',
    info: 'bg-blue-50 border-blue-200'
  };

  const iconVariantClasses = {
    default: 'bg-surface-container text-muted-foreground',
    success: 'bg-green-100 text-green-600',
    warning: 'bg-yellow-100 text-yellow-600',
    error: 'bg-red-100 text-red-600',
    info: 'bg-blue-100 text-blue-600'
  };

  return (
    <Card className={cn(variantClasses[variant], className)}>
      <CardContent className="p-6">
        <div className="flex items-center gap-4">
          {icon && (
            <div className={cn(
              'p-3 rounded-lg',
              iconVariantClasses[variant]
            )}>
              {icon}
            </div>
          )}
          <div className="flex-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
            {trend && (
              <p className="text-xs text-muted-foreground mt-1">
                <span className={cn(
                  trend.value > 0 ? 'text-green-600' : 
                  trend.value < 0 ? 'text-red-600' : 'text-muted-foreground'
                )}>
                  {trend.value > 0 ? '+' : ''}{trend.value}%
                </span>
                {' '}{trend.label}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Base Progress Card Component
interface ProgressCardProps {
  title: string;
  progress: number;
  description?: string;
  color?: 'primary' | 'success' | 'warning' | 'error';
  actions?: React.ReactNode;
  className?: string;
}

export const ProgressCard: React.FC<ProgressCardProps> = ({
  title,
  progress,
  description,
  color = 'primary',
  actions,
  className
}) => {
  const colorClasses = {
    primary: 'bg-brand-primary',
    success: 'bg-green-500',
    warning: 'bg-yellow-500',
    error: 'bg-red-500'
  };

  return (
    <Card className={cn('bg-surface-elevated', className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-base font-medium">{title}</CardTitle>
        {actions}
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Progresso</span>
            <span className="font-medium">{progress}%</span>
          </div>
          <div className="w-full bg-surface-variant rounded-full h-2">
            <div
              className={cn('h-2 rounded-full transition-all duration-300', colorClasses[color])}
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

// Base Section Header Component
interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  badge?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  subtitle,
  badge,
  actions,
  className
}) => {
  return (
    <div className={cn('flex items-center justify-between', className)}>
      <div className="space-y-1">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
          {badge}
        </div>
        {subtitle && (
          <p className="text-muted-foreground">{subtitle}</p>
        )}
      </div>
      {actions && (
        <div className="flex items-center gap-2">
          {actions}
        </div>
      )}
    </div>
  );
};

// Base List Item Component
interface ListItemProps {
  title: string;
  subtitle?: string;
  meta?: string;
  status?: React.ReactNode;
  actions?: React.ReactNode;
  children?: React.ReactNode;
  onClick?: () => void;
  className?: string;
}

export const ListItem: React.FC<ListItemProps> = ({
  title,
  subtitle,
  meta,
  status,
  actions,
  children,
  onClick,
  className
}) => {
  return (
    <div 
      className={cn(
        'border rounded-lg p-4 transition-colors',
        onClick && 'cursor-pointer hover:bg-surface-variant',
        className
      )}
      onClick={onClick}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex-1">
          <h3 className="font-semibold">{title}</h3>
          {subtitle && (
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          )}
          {meta && (
            <p className="text-xs text-muted-foreground mt-1">{meta}</p>
          )}
        </div>
        {status}
      </div>
      {children}
      {actions && (
        <div className="flex items-center gap-2">
          {actions}
        </div>
      )}
    </div>
  );
};

// Base Empty State Component
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
}) => {
  return (
    <div className={cn(
      'flex flex-col items-center justify-center py-12 px-6 text-center',
      className
    )}>
      {icon && (
        <div className="mb-4 text-muted-foreground">
          {icon}
        </div>
      )}
      <h3 className="text-lg font-semibold">{title}</h3>
      {description && (
        <p className="text-muted-foreground mt-2 max-w-md">{description}</p>
      )}
      {action && (
        <div className="mt-6">
          {action}
        </div>
      )}
    </div>
  );
};