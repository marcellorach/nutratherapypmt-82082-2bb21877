import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';

// Form Field Wrapper
interface FormFieldProps {
  label?: string;
  description?: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  description,
  error,
  required,
  children,
  className
}) => {
  return (
    <div className={cn('space-y-2', className)}>
      {label && (
        <Label className="text-sm font-medium">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </Label>
      )}
      {children}
      {description && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}
      {error && (
        <p className="text-xs text-red-600">{error}</p>
      )}
    </div>
  );
};

// Enhanced Input Component
interface EnhancedInputProps {
  label?: string;
  description?: string;
  error?: string;
  required?: boolean;
  prefix?: React.ReactNode;
  suffix?: React.ReactNode;
  className?: string;
  inputClassName?: string;
  [key: string]: any;
}

export const EnhancedInput: React.FC<EnhancedInputProps> = ({
  label,
  description,
  error,
  required,
  prefix,
  suffix,
  className,
  inputClassName,
  ...props
}) => {
  return (
    <FormField
      label={label}
      description={description}
      error={error}
      required={required}
      className={className}
    >
      <div className="relative">
        {prefix && (
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
            {prefix}
          </div>
        )}
        <Input
          className={cn(
            prefix && 'pl-10',
            suffix && 'pr-10',
            error && 'border-red-500 focus-visible:ring-red-500',
            inputClassName
          )}
          {...props}
        />
        {suffix && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
            {suffix}
          </div>
        )}
      </div>
    </FormField>
  );
};

// Enhanced Select Component
interface EnhancedSelectProps {
  label?: string;
  description?: string;
  error?: string;
  required?: boolean;
  placeholder?: string;
  options: Array<{ value: string; label: string; disabled?: boolean }>;
  value?: string;
  onValueChange?: (value: string) => void;
  className?: string;
}

export const EnhancedSelect: React.FC<EnhancedSelectProps> = ({
  label,
  description,
  error,
  required,
  placeholder = "Selecione uma opção",
  options,
  value,
  onValueChange,
  className
}) => {
  return (
    <FormField
      label={label}
      description={description}
      error={error}
      required={required}
      className={className}
    >
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger className={cn(error && 'border-red-500')}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem 
              key={option.value} 
              value={option.value}
              disabled={option.disabled}
            >
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </FormField>
  );
};

// Enhanced Textarea Component
interface EnhancedTextareaProps {
  label?: string;
  description?: string;
  error?: string;
  required?: boolean;
  className?: string;
  textareaClassName?: string;
  [key: string]: any;
}

export const EnhancedTextarea: React.FC<EnhancedTextareaProps> = ({
  label,
  description,
  error,
  required,
  className,
  textareaClassName,
  ...props
}) => {
  return (
    <FormField
      label={label}
      description={description}
      error={error}
      required={required}
      className={className}
    >
      <Textarea
        className={cn(
          error && 'border-red-500 focus-visible:ring-red-500',
          textareaClassName
        )}
        {...props}
      />
    </FormField>
  );
};

// Switch Field Component
interface SwitchFieldProps {
  label: string;
  description?: string;
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  className?: string;
}

export const SwitchField: React.FC<SwitchFieldProps> = ({
  label,
  description,
  checked,
  onCheckedChange,
  className
}) => {
  return (
    <div className={cn('flex items-center justify-between space-x-3', className)}>
      <div className="space-y-1">
        <Label className="text-sm font-medium">{label}</Label>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );
};

// Checkbox Field Component
interface CheckboxFieldProps {
  label: string;
  description?: string;
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  className?: string;
}

export const CheckboxField: React.FC<CheckboxFieldProps> = ({
  label,
  description,
  checked,
  onCheckedChange,
  className
}) => {
  return (
    <div className={cn('flex items-start space-x-3', className)}>
      <Checkbox 
        checked={checked} 
        onCheckedChange={onCheckedChange}
        className="mt-0.5"
      />
      <div className="space-y-1">
        <Label className="text-sm font-medium cursor-pointer">{label}</Label>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
      </div>
    </div>
  );
};

// Form Actions Component
interface FormActionsProps {
  primaryAction?: {
    label: string;
    onClick: () => void;
    loading?: boolean;
    disabled?: boolean;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
    variant?: 'outline' | 'ghost';
  };
  align?: 'left' | 'center' | 'right';
  className?: string;
}

export const FormActions: React.FC<FormActionsProps> = ({
  primaryAction,
  secondaryAction,
  align = 'right',
  className
}) => {
  const alignClasses = {
    left: 'justify-start',
    center: 'justify-center',
    right: 'justify-end'
  };

  return (
    <div className={cn(
      'flex items-center gap-3',
      alignClasses[align],
      className
    )}>
      {secondaryAction && (
        <Button
          type="button"
          variant={secondaryAction.variant || 'outline'}
          onClick={secondaryAction.onClick}
        >
          {secondaryAction.label}
        </Button>
      )}
      {primaryAction && (
        <Button
          type="submit"
          onClick={primaryAction.onClick}
          disabled={primaryAction.disabled || primaryAction.loading}
        >
          {primaryAction.loading ? 'Carregando...' : primaryAction.label}
        </Button>
      )}
    </div>
  );
};