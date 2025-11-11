import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/use-toast';
import { GraduationCap, Loader2 } from 'lucide-react';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';

const STANFORD_PASSWORD = '@stanford@';

const emailSchema = z.string().email();

const StanfordDemoForm: React.FC = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { t } = useTranslation();
  const navigate = useNavigate();

  const handleDemoAccess = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validar email
    try {
      emailSchema.parse(email.trim());
    } catch {
      toast({
        title: t('auth.stanfordDemo.invalidEmail'),
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      // Tentar login primeiro
      const { error: loginError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: STANFORD_PASSWORD,
      });
      
      if (loginError) {
        // Se login falhar, criar conta automaticamente
        const firstName = email.split('@')[0];
        const { error: signUpError } = await supabase.auth.signUp({
          email: email.trim(),
          password: STANFORD_PASSWORD,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: {
              first_name: firstName,
              last_name: 'Stanford Demo',
            },
          },
        });
        
        if (signUpError) {
          throw signUpError;
        }
        
        toast({
          title: t('auth.stanfordDemo.welcomeMessage'),
          variant: 'default',
        });
      } else {
        toast({
          title: t('auth.stanfordDemo.alreadyExists'),
          variant: 'default',
        });
      }
      
      // Redirecionar para home após sucesso
      navigate('/');
    } catch (error: any) {
      console.error('Demo access error:', error);
      toast({
        title: t('auth.stanfordDemo.accessError'),
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleDemoAccess} className="space-y-4">
      <div className="flex items-center justify-center mb-6">
        <GraduationCap className="w-12 h-12 text-primary" />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="email">{t('auth.stanfordDemo.emailLabel')}</Label>
        <Input
          id="email"
          type="email"
          placeholder={t('auth.stanfordDemo.emailPlaceholder')}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={isLoading}
          required
          className="w-full"
        />
      </div>

      <Button 
        type="submit" 
        className="w-full" 
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {t('auth.stanfordDemo.accessingDemo')}
          </>
        ) : (
          t('auth.stanfordDemo.accessButton')
        )}
      </Button>

      <div className="mt-4 p-3 bg-muted rounded-md text-sm text-muted-foreground text-center">
        💡 {t('auth.stanfordDemo.demoNote')}
      </div>
    </form>
  );
};

export default StanfordDemoForm;
