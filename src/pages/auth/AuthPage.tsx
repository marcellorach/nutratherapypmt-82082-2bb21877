
import React, { useState } from 'react';
import Layout from '@/components/layout/Layout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';
import { toast } from '@/components/ui/use-toast';
import LoginForm, { LoginFormValues } from '@/components/auth/LoginForm';
import RegisterForm, { RegisterFormValues } from '@/components/auth/RegisterForm';

const AuthPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('login');
  const { user, signUp, loading } = useAuth();
  const { t } = useTranslation();

  const handleRegister = async (values: RegisterFormValues) => {
    try {
      await signUp(values.email, values.password, values.firstName, values.lastName);
      toast({
        title: t('auth.registerSuccess'),
        description: t('auth.registerSuccessDesc'),
        variant: 'default',
      });
      setActiveTab('login');
    } catch (error: any) {
      console.error('Erro no registro:', error);
      throw error; // Propagar erro para ser capturado no componente de registro
    }
  };

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
              {activeTab === 'login' ? t('auth.loginTitle') : t('auth.registerTitle')}
            </CardTitle>
            <CardDescription>
              {activeTab === 'login' 
                ? t('auth.loginDesc')
                : t('auth.registerDesc')}
            </CardDescription>
          </CardHeader>
          
          <Tabs defaultValue="login" value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">{t('auth.login')}</TabsTrigger>
              <TabsTrigger value="register">{t('auth.register')}</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login">
              <CardContent className="space-y-4 py-4">
                <LoginForm loading={loading} />
              </CardContent>
            </TabsContent>
            
            <TabsContent value="register">
              <CardContent className="space-y-4 py-4">
                <RegisterForm loading={loading} onRegister={handleRegister} />
              </CardContent>
            </TabsContent>
          </Tabs>
          
          <CardFooter className="flex justify-center text-sm text-gray-500 pt-0">
            {activeTab === 'login' ? (
              <p>{t('auth.noAccount')} <Button variant="link" onClick={() => setActiveTab('register')} className="p-0 h-auto font-normal">{t('auth.signUp')}</Button></p>
            ) : (
              <p>{t('auth.hasAccount')} <Button variant="link" onClick={() => setActiveTab('login')} className="p-0 h-auto font-normal">{t('auth.signIn')}</Button></p>
            )}
          </CardFooter>
        </Card>
      </div>
    </Layout>
  );
};

export default AuthPage;
