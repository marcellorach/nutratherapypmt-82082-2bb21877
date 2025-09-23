
import React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Lock, Mail } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

// Schema de validação para login
const createLoginSchema = (t: any) => z.object({
  email: z.string().email(t('auth.invalidEmail')),
  password: z.string().min(6, `${t('auth.password')} ${t('auth.minChars')} 6 ${t('auth.characters')}`),
});

export type LoginFormValues = z.infer<ReturnType<typeof createLoginSchema>>;

interface LoginFormProps {
  loading: boolean;
}

const LoginForm: React.FC<LoginFormProps> = ({ loading }) => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(createLoginSchema(t)),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (values: LoginFormValues) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password,
      });

      if (error) {
        toast({
          title: t('auth.loginError'),
          description: error.message === 'Invalid login credentials' 
            ? t('auth.invalidCredentials')
            : error.message,
          variant: 'destructive',
        });
        
        // Log para debugging
        console.error('Erro no login:', error);
        return;
      }

      toast({
        title: t('messages.loginSuccess'),
        variant: 'default',
      });

      navigate('/');
    } catch (error: any) {
      console.error('Exceção no login:', error);
      toast({
        title: t('auth.loginError'),
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('auth.email')}</FormLabel>
              <FormControl>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                  <Input 
                    placeholder={t('placeholders.email')}
                    className="pl-10" 
                    {...field} 
                  />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('auth.password')}</FormLabel>
              <FormControl>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                  <Input 
                    placeholder={t('placeholders.password')}
                    type="password" 
                    className="pl-10" 
                    {...field} 
                  />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? t('auth.loading') : t('auth.loginButton')}
        </Button>
      </form>
    </Form>
  );
};

export default LoginForm;
