
import React from 'react';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { UseFormReturn } from 'react-hook-form';

interface BasicInfoTabProps {
  form: UseFormReturn<any>;
  outcomes: any[];
  isSubmitting: boolean;
  isEditMode: boolean;
  onCancel: () => void;
}

const BasicInfoTab: React.FC<BasicInfoTabProps> = ({
  form,
  outcomes,
  isSubmitting,
  isEditMode,
  onCancel
}) => {
  return (
    <Form {...form}>
      <div className="space-y-4 py-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome do Nutracêutico*</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Nome do nutracêutico" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descrição</FormLabel>
              <FormControl>
                <Textarea 
                  {...field} 
                  placeholder="Descrição do nutracêutico" 
                  className="min-h-[100px]"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="dosage"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Dosagem</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Ex: 500mg, 2 vezes ao dia" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="source"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Fonte</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Ex: Curcuma longa" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <FormField
          control={form.control}
          name="chemical_compound"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Composto Químico</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Fórmula ou nome do composto químico" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="contraindications"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Contraindicações</FormLabel>
              <FormControl>
                <Textarea 
                  {...field} 
                  placeholder="Cada contraindicação em uma linha" 
                  className="min-h-[80px]"
                />
              </FormControl>
              <FormMessage />
              <p className="text-xs text-muted-foreground">
                Digite cada contraindicação em uma linha separada.
              </p>
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="outcome_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Outcome Principal</FormLabel>
              <Select 
                onValueChange={field.onChange} 
                value={field.value || ''}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um outcome" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="">Nenhum outcome</SelectItem>
                  {outcomes?.map(outcome => (
                    <SelectItem key={outcome.id} value={outcome.id}>
                      {outcome.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="flex justify-end space-x-2 pt-4">
          <Button 
            type="button" 
            variant="outline" 
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {isEditMode ? 'Salvando...' : 'Criando...'}
              </>
            ) : (
              isEditMode ? 'Salvar Nutracêutico' : 'Criar Nutracêutico'
            )}
          </Button>
        </div>
      </div>
    </Form>
  );
};

export default BasicInfoTab;
