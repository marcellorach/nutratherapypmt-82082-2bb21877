import React, { useState } from 'react';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';
import { Loader2, Lock } from 'lucide-react';
import { ALLOWED_EMAILS, TEMP_SHARED_PASSWORD, isEmailAllowed } from '@/config/access-allowlist';

const AuthPage: React.FC = () => {
  const { user, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (user && !loading) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const normalized = email.trim().toLowerCase();

    if (!isEmailAllowed(normalized)) {
      toast({
        title: 'Acesso negado',
        description: 'Este email não está autorizado a acessar a plataforma.',
        variant: 'destructive',
      });
      return;
    }
    if (password !== TEMP_SHARED_PASSWORD) {
      toast({
        title: 'Senha incorreta',
        variant: 'destructive',
      });
      return;
    }

    setSubmitting(true);
    try {
      // Try to sign in first
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: normalized,
        password: TEMP_SHARED_PASSWORD,
      });

      if (signInError) {
        // Account doesn't exist yet → create it
        const { error: signUpError } = await supabase.auth.signUp({
          email: normalized,
          password: TEMP_SHARED_PASSWORD,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
          },
        });
        if (signUpError) throw signUpError;

        // Try sign-in again (in case email confirmation is disabled)
        const { error: retryError } = await supabase.auth.signInWithPassword({
          email: normalized,
          password: TEMP_SHARED_PASSWORD,
        });
        if (retryError) {
          toast({
            title: 'Conta criada',
            description: 'Verifique seu email para confirmar e depois entre novamente.',
          });
          return;
        }
      }

      toast({ title: 'Login realizado com sucesso' });
    } catch (err: any) {
      toast({
        title: 'Erro ao autenticar',
        description: err?.message ?? 'Tente novamente',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Layout>
      <div className="container max-w-md mx-auto py-12">
        <Card className="w-full">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-3">
              <div className="rounded-full bg-muted p-3">
                <Lock className="h-6 w-6 text-muted-foreground" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold">Acesso restrito</CardTitle>
            <CardDescription>
              Plataforma em modo privado. Acesso apenas para usuários autorizados.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={submitting}
                  required
                  autoComplete="email"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={submitting}
                  required
                  autoComplete="current-password"
                />
              </div>
              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Entrando...
                  </>
                ) : (
                  'Entrar'
                )}
              </Button>
            </form>

            <p className="text-xs text-muted-foreground text-center mt-6">
              Se você não está na lista de autorizados, entre em contato com o administrador.
            </p>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default AuthPage;
