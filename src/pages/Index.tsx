
import React from 'react';
import Layout from '../components/layout/Layout';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { LogIn } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useInitAdmin } from '@/hooks/useInitAdmin';

const Index: React.FC = () => {
  const { user } = useAuth();
  
  // Inicializar o usuário admin na primeira carga
  useInitAdmin();
  
  return (
    <Layout>
      <div className="container mx-auto px-4 py-12">
        <div className="text-center max-w-3xl mx-auto">
          <h1 className="text-4xl font-bold mb-6">NutraTherapy PET</h1>
          <p className="text-xl mb-8">
            Sistema inteligente de recomendação de nutracêuticos para pets que visa complementar deficiências nutricionais, 
            prevenir doenças degenerativas, e promover longevidade saudável através de estratégias personalizadas.
          </p>
          
          {!user ? (
            <div className="flex justify-center mt-8">
              <Link to="/auth">
                <Button className="flex items-center gap-2 px-6 py-2">
                  <LogIn size={20} />
                  Entrar na Plataforma
                </Button>
              </Link>
            </div>
          ) : (
            <div className="mt-8 p-6 bg-white rounded-lg shadow-sm border border-gray-200">
              <h2 className="text-2xl font-bold mb-4">Bem-vindo de volta!</h2>
              <p className="text-gray-700 mb-6">
                Você está conectado como {user.email}.
                Utilize a navegação acima para acessar as diferentes áreas da plataforma.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Link to="/tutor">
                  <Button variant="outline" className="w-full">Área do Tutor</Button>
                </Link>
                <Link to="/veterinario">
                  <Button variant="outline" className="w-full">Área do Veterinário</Button>
                </Link>
                <Link to="/administrador">
                  <Button variant="outline" className="w-full">Administração</Button>
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Index;
