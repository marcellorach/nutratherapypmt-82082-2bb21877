import React, { useState, useEffect } from 'react';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Clock, LogOut, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

const AccessPendingPage: React.FC = () => {
  const { user, signOut, loading } = useAuth();
  const { t } = useTranslation();
  const [requestData, setRequestData] = useState<any>(null);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    if (user) {
      fetchRequestStatus();
    }
  }, [user]);

  const fetchRequestStatus = async () => {
    if (!user) return;
    setChecking(true);
    try {
      const { data } = await supabase
        .from('access_requests')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      setRequestData(data);
      
      // If approved, redirect
      if (data?.status === 'approved') {
        window.location.href = '/';
      }
    } catch (error) {
      console.error('Error checking status:', error);
    } finally {
      setChecking(false);
    }
  };

  if (loading) return null;
  if (!user) return <Navigate to="/" replace />;

  return (
    <Layout>
      <div className="container max-w-lg mx-auto py-16">
        <Card className="w-full text-center">
          <CardHeader className="pb-4">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center">
                <Clock className="w-8 h-8 text-amber-600" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold">
              {t('auth.accessPending.title')}
            </CardTitle>
            <CardDescription className="text-base mt-2">
              {t('auth.accessPending.description')}
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <div className="bg-muted rounded-lg p-4 space-y-3 text-left">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">{t('auth.accessPending.emailLabel')}</span>
                <span className="text-sm font-medium">{user.email}</span>
              </div>
              {requestData?.requested_at && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">{t('auth.accessPending.requestedAt')}</span>
                  <span className="text-sm font-medium">
                    {format(new Date(requestData.requested_at), 'dd/MM/yyyy HH:mm')}
                  </span>
                </div>
              )}
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">{t('auth.accessPending.statusLabel')}</span>
                <Badge variant="secondary" className="bg-amber-100 text-amber-800">
                  {t('auth.accessPending.statusPending')}
                </Badge>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <Button
                variant="outline"
                onClick={fetchRequestStatus}
                disabled={checking}
                className="w-full"
              >
                <RefreshCw className={`mr-2 h-4 w-4 ${checking ? 'animate-spin' : ''}`} />
                {t('auth.accessPending.checkAgain')}
              </Button>
              <Button
                variant="ghost"
                onClick={() => signOut()}
                className="w-full text-muted-foreground"
              >
                <LogOut className="mr-2 h-4 w-4" />
                {t('auth.accessPending.signOut')}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default AccessPendingPage;
