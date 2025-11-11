
import React from 'react';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import StanfordDemoForm from '@/components/auth/StanfordDemoForm';

const AuthPage: React.FC = () => {
  const { user, loading } = useAuth();
  const { t } = useTranslation();

  // Se o usuário já estiver autenticado, redireciona para a página inicial
  if (user && !loading) {
    return <Navigate to="/" replace />;
  }

  return (
    <Layout>
      <div className="container max-w-xl mx-auto py-12">
        <Card className="w-full">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">
              {t('auth.stanfordDemo.title')}
            </CardTitle>
            <CardDescription>
              {t('auth.stanfordDemo.description')}
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4 py-4">
            <StanfordDemoForm />
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default AuthPage;
