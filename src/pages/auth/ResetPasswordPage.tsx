import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';
import { Loader2 } from 'lucide-react';

const ResetPasswordPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' || session) setReady(true);
    });
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      toast({ title: t('auth.reset.tooShort'), variant: 'destructive' });
      return;
    }
    if (password !== confirm) {
      toast({ title: t('auth.reset.mismatch'), variant: 'destructive' });
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.auth.updateUser({ password });
    setSubmitting(false);
    if (error) {
      toast({ title: t('auth.reset.failed'), description: error.message, variant: 'destructive' });
      return;
    }
    toast({ title: t('auth.reset.success') });
    navigate('/', { replace: true });
  };

  return (
    <Layout>
      <div className="container max-w-md mx-auto py-12">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">{t('auth.reset.title')}</CardTitle>
            <CardDescription>
              {ready ? t('auth.reset.description') : t('auth.reset.invalidLink')}
            </CardDescription>
          </CardHeader>
          {ready && (
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="new-password">{t('auth.reset.newPassword')}</Label>
                  <Input id="new-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" required disabled={submitting} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">{t('auth.reset.confirmPassword')}</Label>
                  <Input id="confirm-password" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" required disabled={submitting} />
                </div>
                <Button type="submit" className="w-full" disabled={submitting}>
                  {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {t('auth.reset.submit')}
                </Button>
              </form>
            </CardContent>
          )}
        </Card>
      </div>
    </Layout>
  );
};

export default ResetPasswordPage;
