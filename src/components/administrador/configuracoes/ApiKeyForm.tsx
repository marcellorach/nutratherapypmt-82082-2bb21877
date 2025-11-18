
import React, { useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { RefreshCw } from "lucide-react";

const apiKeySchema = z.object({
  apiKey: z.string().min(10, "A chave API deve ter pelo menos 10 caracteres")
});

interface ApiKeyFormProps {
  serviceName: string;
  saveKey: (key: string) => Promise<void>;
  initialKey?: string;
  placeholder?: string;
  isLoading: boolean;
}

const ApiKeyForm: React.FC<ApiKeyFormProps> = ({ 
  serviceName, 
  saveKey, 
  initialKey = "", 
  placeholder = "sk-...",
  isLoading 
}) => {
  const { toast } = useToast();
  
  // Normalize initialKey to always be a string
  const normalizedKey = typeof initialKey === 'string' ? initialKey : '';
  
  const form = useForm<z.infer<typeof apiKeySchema>>({
    resolver: zodResolver(apiKeySchema),
    defaultValues: {
      apiKey: normalizedKey,
    },
  });

  useEffect(() => {
    form.reset({ apiKey: normalizedKey });
  }, [normalizedKey, form]);

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
                <Input
                  {...field}
                  placeholder={placeholder}
                  type="password"
                  autoComplete="off"
                  disabled={isLoading}
                />
              </FormControl>
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
            "Chave API da OpenAI salva"
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
