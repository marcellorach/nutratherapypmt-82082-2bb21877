
import React, { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { RefreshCw, CheckCircle2, XCircle, AlertCircle } from "lucide-react";

export interface ValidationResult {
  isValid: boolean;
  status: 'valid' | 'invalid' | 'warning' | 'idle';
  message?: string;
}

interface ApiKeyFormProps {
  serviceName: string;
  saveKey: (key: string) => Promise<void>;
  initialKey?: string;
  placeholder?: string;
  isLoading: boolean;
  minLength?: number;
  validator?: (value: string) => ValidationResult;
  showVisualValidation?: boolean;
}

const ApiKeyForm: React.FC<ApiKeyFormProps> = ({ 
  serviceName, 
  saveKey, 
  initialKey = "", 
  placeholder = "sk-...",
  isLoading,
  minLength = 10,
  validator,
  showVisualValidation = false
}) => {
  const { toast } = useToast();
  const [validationResult, setValidationResult] = useState<ValidationResult>({ 
    isValid: false, 
    status: 'idle' 
  });
  
  // Normalize initialKey to always be a string
  const normalizedKey = typeof initialKey === 'string' ? initialKey : '';
  
  // Create schema with dynamic minLength
  const apiKeySchema = z.object({
    apiKey: z.string().min(minLength, `A chave API deve ter pelo menos ${minLength} caracteres`)
  });
  
  const form = useForm<z.infer<typeof apiKeySchema>>({
    resolver: zodResolver(apiKeySchema),
    defaultValues: {
      apiKey: normalizedKey,
    },
  });

  // Watch field value for real-time validation
  const currentValue = form.watch('apiKey');

  useEffect(() => {
    if (showVisualValidation && validator && currentValue) {
      const result = validator(currentValue);
      setValidationResult(result);
    } else if (!currentValue) {
      setValidationResult({ isValid: false, status: 'idle' });
    }
  }, [currentValue, validator, showVisualValidation]);

  useEffect(() => {
    form.reset({ apiKey: normalizedKey });
    if (showVisualValidation && validator && normalizedKey) {
      const result = validator(normalizedKey);
      setValidationResult(result);
    }
  }, [normalizedKey, form, validator, showVisualValidation]);

  const onSubmit = async (values: z.infer<typeof apiKeySchema>) => {
    try {
      await saveKey(values.apiKey);
      toast({
        title: "Chave salva com sucesso",
        description: `A chave API para ${serviceName} foi atualizada.`,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro ao salvar chave",
        description: `Não foi possível salvar a chave: ${error.message}`,
      });
    }
  };

  const hasInitialKey = normalizedKey.trim() !== "";

  const getValidationIcon = () => {
    if (!showVisualValidation || validationResult.status === 'idle') return null;
    
    switch (validationResult.status) {
      case 'valid':
        return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      case 'invalid':
        return <XCircle className="h-5 w-5 text-red-600" />;
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-yellow-600" />;
      default:
        return null;
    }
  };

  const getValidationColor = () => {
    if (!showVisualValidation) return '';
    
    switch (validationResult.status) {
      case 'valid':
        return 'border-green-500 focus-visible:ring-green-500';
      case 'invalid':
        return 'border-red-500 focus-visible:ring-red-500';
      case 'warning':
        return 'border-yellow-500 focus-visible:ring-yellow-500';
      default:
        return '';
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="apiKey"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Chave API para {serviceName}</FormLabel>
              <FormControl>
                <div className="relative">
                  <Input
                    {...field}
                    placeholder={placeholder}
                    type="password"
                    autoComplete="off"
                    disabled={isLoading}
                    className={showVisualValidation ? getValidationColor() : ''}
                  />
                  {showVisualValidation && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      {getValidationIcon()}
                    </div>
                  )}
                </div>
              </FormControl>
              {showVisualValidation && validationResult.message && (
                <FormDescription className={
                  validationResult.status === 'valid' ? 'text-green-600' :
                  validationResult.status === 'invalid' ? 'text-red-600' :
                  validationResult.status === 'warning' ? 'text-yellow-600' : ''
                }>
                  {validationResult.message}
                </FormDescription>
              )}
              <FormMessage />
            </FormItem>
          )}
        />
        <Button 
          type="submit" 
          className={`w-full ${hasInitialKey ? 'bg-green-600 text-white' : ''}`}
          disabled={isLoading}
        >
          {hasInitialKey ? (
            "✓ Chave API configurada"
          ) : (
            isLoading ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Salvando...
              </>
            ) : (
              "Salvar"
            )
          )}
        </Button>
      </form>
    </Form>
  );
};

export default ApiKeyForm;
