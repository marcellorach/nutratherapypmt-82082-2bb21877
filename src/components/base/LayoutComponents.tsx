import React from 'react';
import { cn } from '@/lib/utils';

// Layout Grid Component
interface GridLayoutProps {
  columns?: 1 | 2 | 3 | 4 | 5 | 6;
  gap?: 'sm' | 'md' | 'lg' | 'xl';
  children: React.ReactNode;
  className?: string;
}

export const GridLayout: React.FC<GridLayoutProps> = ({
  columns = 1,
  gap = 'md',
  children,
  className
}) => {
  const columnClasses = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
    5: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5',
    6: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6'
  };

  const gapClasses = {
    sm: 'gap-3',
    md: 'gap-6',
    lg: 'gap-8',
    xl: 'gap-12'
  };

  return (
    <div className={cn(
      'grid',
      columnClasses[columns],
      gapClasses[gap],
      className
    )}>
      {children}
    </div>
  );
};

// Page Container Component
interface PageContainerProps {
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  padding?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const PageContainer: React.FC<PageContainerProps> = ({
  children,
  maxWidth = 'full',
  padding = 'lg',
  className
}) => {
  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    full: 'max-w-full'
  };

  const paddingClasses = {
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
    xl: 'p-12'
  };

  return (
    <div className={cn(
      'mx-auto w-full',
      maxWidthClasses[maxWidth],
      paddingClasses[padding],
      className
    )}>
      {children}
    </div>
  );
};

// Stack Layout Component
interface StackLayoutProps {
  spacing?: 'sm' | 'md' | 'lg' | 'xl';
  children: React.ReactNode;
  className?: string;
}

export const StackLayout: React.FC<StackLayoutProps> = ({
  spacing = 'md',
  children,
  className
}) => {
  const spacingClasses = {
    sm: 'space-y-3',
    md: 'space-y-6',
    lg: 'space-y-8',
    xl: 'space-y-12'
  };

  return (
    <div className={cn(spacingClasses[spacing], className)}>
      {children}
    </div>
  );
};

// Flex Layout Component
interface FlexLayoutProps {
  direction?: 'row' | 'col';
  align?: 'start' | 'center' | 'end' | 'stretch';
  justify?: 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly';
  gap?: 'sm' | 'md' | 'lg' | 'xl';
  wrap?: boolean;
  children: React.ReactNode;
  className?: string;
}

export const FlexLayout: React.FC<FlexLayoutProps> = ({
  direction = 'row',
  align = 'center',
  justify = 'start',
  gap = 'md',
  wrap = false,
  children,
  className
}) => {
  const directionClasses = {
    row: 'flex-row',
    col: 'flex-col'
  };

  const alignClasses = {
    start: 'items-start',
    center: 'items-center',
    end: 'items-end',
    stretch: 'items-stretch'
  };

  const justifyClasses = {
    start: 'justify-start',
    center: 'justify-center',
    end: 'justify-end',
    between: 'justify-between',
    around: 'justify-around',
    evenly: 'justify-evenly'
  };

  const gapClasses = {
    sm: 'gap-2',
    md: 'gap-4',
    lg: 'gap-6',
    xl: 'gap-8'
  };

  return (
    <div className={cn(
      'flex',
      directionClasses[direction],
      alignClasses[align],
      justifyClasses[justify],
      gapClasses[gap],
      wrap && 'flex-wrap',
      className
    )}>
      {children}
    </div>
  );
};

// Card Container Component
interface CardContainerProps {
  children: React.ReactNode;
  padding?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'default' | 'elevated' | 'outlined';
  className?: string;
}

export const CardContainer: React.FC<CardContainerProps> = ({
  children,
  padding = 'md',
  variant = 'default',
  className
}) => {
  const paddingClasses = {
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
    xl: 'p-12'
  };

  const variantClasses = {
    default: 'bg-card border border-border',
    elevated: 'bg-surface-elevated shadow-elevated border-0',
    outlined: 'bg-transparent border-2 border-border'
  };

  return (
    <div className={cn(
      'rounded-lg',
      variantClasses[variant],
      paddingClasses[padding],
      className
    )}>
      {children}
    </div>
  );
};

// Center Layout Component
interface CenterLayoutProps {
  children: React.ReactNode;
  minHeight?: 'screen' | 'auto';
  className?: string;
}

export const CenterLayout: React.FC<CenterLayoutProps> = ({
  children,
  minHeight = 'auto',
  className
}) => {
  const heightClasses = {
    screen: 'min-h-screen',
    auto: 'min-h-0'
  };

  return (
    <div className={cn(
      'flex items-center justify-center',
      heightClasses[minHeight],
      className
    )}>
      {children}
    </div>
  );
};