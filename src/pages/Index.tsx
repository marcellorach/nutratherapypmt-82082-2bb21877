
import React, { useEffect } from 'react';
import Layout from '../components/layout/Layout';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Heart, Book, UserCog, LogIn, ArrowRight, Microscope } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useInitAdmin } from '@/hooks/useInitAdmin';
import { Card, CardContent } from '@/components/ui/card';

const Index: React.FC = () => {
  const { user, hasRole } = useAuth();
  
  // Inicializar o usuário admin na primeira carga
  useInitAdmin();
  
  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="text-center max-w-4xl mx-auto mb-12">
          <h1 className="text-5xl font-bold mb-4">NutraTherapy PET</h1>
          <p className="text-xl text-gray-700 mb-6">
            Plataforma inteligente de terapia nutracêutica personalizada e P&D
          </p>
        </div>
        
        {!user ? (
          <div className="flex flex-col items-center justify-center mt-8">
            <div className="max-w-xl text-center mb-8">
              <h2 className="text-2xl font-semibold mb-4">Acesse a Plataforma</h2>
              <p className="text-gray-600 mb-6">
                Faça login para acessar todas as funcionalidades do sistema NutraTherapy PET.
                Nossa plataforma oferece soluções personalizadas para tutores, veterinários e pesquisadores.
              </p>
              <Link to="/auth">
                <Button className="flex items-center gap-2 px-6 py-6 text-lg">
                  <LogIn size={20} />
                  Entrar na Plataforma
                </Button>
              </Link>
            </div>
            
            {/* Destaque dos benefícios */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-12 w-full">
              <Card className="p-6 bg-white border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex flex-col items-center text-center">
                  <div className="rounded-full bg-gray-50 p-3 mb-4">
                    <Book size={32} className="text-gray-700" />
                  </div>
                  <h3 className="text-xl font-medium mb-2">Para Tutores</h3>
                  <p className="text-gray-600">
                    Visualize recomendações personalizadas para seu pet, compreenda tratamentos e acompanhe a evolução.
                  </p>
                </div>
              </Card>
              
              <Card className="p-6 bg-white border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex flex-col items-center text-center">
                  <div className="rounded-full bg-gray-50 p-3 mb-4">
                    <Heart size={32} className="text-gray-700" />
                  </div>
                  <h3 className="text-xl font-medium mb-2">Para Veterinários</h3>
                  <p className="text-gray-600">
                    Acesse dados clínicos, consulte evidências científicas e crie planos de tratamento personalizados.
                  </p>
                </div>
              </Card>
              
              <Card className="p-6 bg-white border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex flex-col items-center text-center">
                  <div className="rounded-full bg-gray-50 p-3 mb-4">
                    <Microscope size={32} className="text-gray-700" />
                  </div>
                  <h3 className="text-xl font-medium mb-2">P&D + Base de Conhecimento</h3>
                  <p className="text-gray-600">
                    Acesse ferramentas de pesquisa, desenvolva estudos e gerencie a base de conhecimento científico.
                  </p>
                </div>
              </Card>
              
              <Card className="p-6 bg-white border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex flex-col items-center text-center">
                  <div className="rounded-full bg-gray-50 p-3 mb-4">
                    <UserCog size={32} className="text-gray-700" />
                  </div>
                  <h3 className="text-xl font-medium mb-2">Para Administradores</h3>
                  <p className="text-gray-600">
                    Gerencie configurações do sistema, usuários e integrações da plataforma.
                  </p>
                </div>
              </Card>
            </div>
          </div>
        ) : (
          <div className="mt-8">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-8 text-center border-b border-gray-100">
                <h2 className="text-2xl font-bold mb-2">Bem-vindo(a) de volta!</h2>
                <p className="text-gray-600 mb-0">
                  Você está conectado como <span className="font-medium">{user.email}</span>
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-0 divide-y md:divide-y-0 md:divide-x divide-gray-100">
                <div className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex flex-col items-center text-center">
                    <div className="rounded-full bg-gray-100 p-3 mb-4">
                      <Book size={28} className="text-gray-800" />
                    </div>
                    <h3 className="text-lg font-medium mb-3">Área do Tutor</h3>
                    <p className="text-gray-500 mb-4">
                      Acompanhe planos de tratamento e recomendações para seu pet.
                    </p>
                    <Link to="/tutor">
                      <Button variant="outline" className="w-full flex items-center justify-center gap-1">
                        Acessar <ArrowRight size={16} />
                      </Button>
                    </Link>
                  </div>
                </div>
                
                <div className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex flex-col items-center text-center">
                    <div className="rounded-full bg-gray-100 p-3 mb-4">
                      <Heart size={28} className="text-gray-800" />
                    </div>
                    <h3 className="text-lg font-medium mb-3">Área do Veterinário</h3>
                    <p className="text-gray-500 mb-4">
                      Analise dados clínicos e crie planos de tratamento baseados em evidências.
                    </p>
                    <Link to="/veterinario">
                      <Button 
                        variant="outline" 
                        className={`w-full flex items-center justify-center gap-1 ${!hasRole('veterinarian') ? 'opacity-50 cursor-not-allowed' : ''}`}
                        disabled={!hasRole('veterinarian')}
                      >
                        Acessar <ArrowRight size={16} />
                      </Button>
                    </Link>
                    {!hasRole('veterinarian') && (
                      <p className="text-xs text-red-500 mt-2">Acesso restrito para veterinários</p>
                    )}
                  </div>
                </div>
                
                <div className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex flex-col items-center text-center">
                    <div className="rounded-full bg-gray-100 p-3 mb-4">
                      <Microscope size={28} className="text-gray-800" />
                    </div>
                    <h3 className="text-lg font-medium mb-3">P&D + Base de Conhecimento</h3>
                    <p className="text-gray-500 mb-4">
                      Acesse ferramentas de pesquisa, desenvolva estudos e gerencie a base de conhecimento científico.
                    </p>
                    <Link to="/administrador">
                      <Button 
                        variant="outline" 
                        className={`w-full flex items-center justify-center gap-1 ${!hasRole('admin') ? 'opacity-50 cursor-not-allowed' : ''}`}
                        disabled={!hasRole('admin')}
                      >
                        Acessar <ArrowRight size={16} />
                      </Button>
                    </Link>
                    {!hasRole('admin') && (
                      <p className="text-xs text-red-500 mt-2">Acesso restrito para administradores</p>
                    )}
                  </div>
                </div>
                
                <div className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex flex-col items-center text-center">
                    <div className="rounded-full bg-gray-100 p-3 mb-4">
                      <UserCog size={28} className="text-gray-800" />
                    </div>
                    <h3 className="text-lg font-medium mb-3">Área do Administrador</h3>
                    <p className="text-gray-500 mb-4">
                      Gerencie configurações do sistema, usuários e integrações da plataforma.
                    </p>
                    <Link to="/administrador">
                      <Button 
                        variant="outline" 
                        className={`w-full flex items-center justify-center gap-1 ${!hasRole('admin') ? 'opacity-50 cursor-not-allowed' : ''}`}
                        disabled={!hasRole('admin')}
                      >
                        Acessar <ArrowRight size={16} />
                      </Button>
                    </Link>
                    {!hasRole('admin') && (
                      <p className="text-xs text-red-500 mt-2">Acesso restrito para administradores</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-8 p-6 bg-gray-50 rounded-lg border border-gray-200">
              <h3 className="text-lg font-medium mb-4">Informações do Sistema</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded-md border border-gray-100">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Nutracêuticos Cadastrados</span>
                    <span className="text-lg font-medium">250+</span>
                  </div>
                </div>
                <div className="bg-white p-4 rounded-md border border-gray-100">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Estudos Científicos</span>
                    <span className="text-lg font-medium">180+</span>
                  </div>
                </div>
                <div className="bg-white p-4 rounded-md border border-gray-100">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Condições Tratáveis</span>
                    <span className="text-lg font-medium">45+</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Index;
