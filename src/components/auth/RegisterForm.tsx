
import React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Lock, Mail, User } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { useTranslation } from 'react-i18next';

// Schema de validação para registro
const createRegisterSchema = (t: any) => z.object({
  firstName: z.string().min(2, `${t('auth.firstName')} ${t('auth.minChars')} 2 ${t('auth.characters')}`),
  lastName: z.string().min(2, `${t('auth.lastName')} ${t('auth.minChars')} 2 ${t('auth.characters')}`),
  email: z.string().email(t('auth.invalidEmail')),
  password: z.string().min(6, `${t('auth.password')} ${t('auth.minChars')} 6 ${t('auth.characters')}`),
  confirmPassword: z.string().min(6, `${t('auth.password')} ${t('auth.minChars')} 6 ${t('auth.characters')}`),
}).refine((data) => data.password === data.confirmPassword, {
  message: t('auth.passwordsNotMatch'),
  path: ["confirmPassword"],
});

export type RegisterFormValues = z.infer<ReturnType<typeof createRegisterSchema>>;

interface RegisterFormProps {
  loading: boolean;
  onRegister: (values: RegisterFormValues) => Promise<void>;
}

const RegisterForm: React.FC<RegisterFormProps> = ({ loading, onRegister }) => {
  const { t } = useTranslation();
  
  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(createRegisterSchema(t)),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (values: RegisterFormValues) => {
    try {
      await onRegister(values);
    } catch (error: any) {
      console.error('Erro no registro:', error);
      toast({
        title: t('auth.registerError'),
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="firstName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('auth.firstName')}</FormLabel>
                <FormControl>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                    <Input 
                      placeholder={t('placeholders.firstName')}
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
            name="lastName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('auth.lastName')}</FormLabel>
                <FormControl>
                  <Input 
                    placeholder={t('placeholders.lastName')}
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
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
        
        <FormField
          control={form.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('auth.confirmPassword')}</FormLabel>
              <FormControl>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                  <Input 
                    placeholder={t('placeholders.confirmPassword')}
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
          {loading ? t('auth.loading') : t('auth.registerButton')}
        </Button>
      </form>
    </Form>
  );
};

export default RegisterForm;
