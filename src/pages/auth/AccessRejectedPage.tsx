import React, { useEffect, useState } from 'react';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { XCircle, LogOut } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const AccessRejectedPage: React.FC = () => {
  const { user, signOut, loading } = useAuth();
  const { t } = useTranslation();
  const [rejectionReason, setRejectionReason] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchRejection();
    }
  }, [user]);

  const fetchRejection = async () => {
    if (!user) return;
    try {
      const { data } = await supabase
        .from('access_requests')
        .select('rejection_reason')
        .eq('user_id', user.id)
        .eq('status', 'rejected')
        .single();
      
      setRejectionReason(data?.rejection_reason || null);
    } catch (error) {
      console.error('Error fetching rejection:', error);
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
              <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
                <XCircle className="w-8 h-8 text-red-600" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold">
              {t('auth.accessRejected.title')}
            </CardTitle>
            <CardDescription className="text-base mt-2">
              {t('auth.accessRejected.description')}
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {rejectionReason && (
              <div className="bg-red-50 rounded-lg p-4 text-left">
                <p className="text-sm font-medium text-red-800 mb-1">{t('auth.accessRejected.reason')}</p>
                <p className="text-sm text-red-700">{rejectionReason}</p>
              </div>
            )}

            {!rejectionReason && (
              <div className="bg-muted rounded-lg p-4 text-left">
                <p className="text-sm text-muted-foreground">{t('auth.accessRejected.noReason')}</p>
              </div>
            )}

            <Button
              variant="ghost"
              onClick={() => signOut()}
              className="w-full text-muted-foreground"
            >
              <LogOut className="mr-2 h-4 w-4" />
              {t('auth.accessRejected.signOut')}
            </Button>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default AccessRejectedPage;
