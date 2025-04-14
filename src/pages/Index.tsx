
import React from 'react';
import { Button } from "@/components/ui/button";
import { ArrowRight, Stethoscope, Beaker, Microscope, FlaskConical } from "lucide-react";
import Layout from '@/components/layout/Layout';
import { Link } from 'react-router-dom';
import { generateRandomData } from '@/data';

const Index = () => {
  return (
    <Layout>
      <div className="bg-gray-50 py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <img 
                src="/lovable-uploads/7f924bdb-8c9d-4162-b83d-9d001f6ea02c.png" 
                alt="NutraTherapy" 
                className="mx-auto h-28 mb-4" 
              />
              <h1 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl text-gray-600">
                NutraTherapy
              </h1>
              <p className="mt-6 text-lg leading-8 text-gray-600">
                Nutrição personalizada e tratamento individualizado para mitigação de doenças degenerativas, baseado em pesquisa científica avançada
              </p>
              
              <Button 
                onClick={generateRandomData}
                variant="outline" 
                className="mt-6 border-gray-300 text-gray-700 hover:bg-gray-100"
              >
                Gerar dados aleatórios para exemplo
              </Button>
            </div>
            
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-6">
              <Link to="/veterinario">
                <Button className="w-64 h-16 text-lg flex items-center justify-center gap-2 bg-white text-gray-800 border-2 border-gray-500 hover:bg-gray-100 transition-all">
                  <Stethoscope className="w-6 h-6 text-gray-700" />
                  Área do Veterinário
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              
              <Link to="/tutor">
                <Button 
                  className="w-64 h-16 text-lg bg-white text-gray-800 border-2 border-gray-500 hover:bg-gray-100 transition-all" 
                  variant="outline"
                >
                  <img 
                    src="/lovable-uploads/154ca2f9-5d6b-4a91-a708-3c8bd2356c0d.png" 
                    alt="Pata" 
                    className="mr-2 h-6 w-6"
                  />
                  Área do Tutor
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              
              <Link to="/administrador">
                <Button 
                  className="w-64 h-16 text-lg bg-white text-gray-800 border-2 border-gray-500 hover:bg-gray-100 transition-all" 
                  variant="outline"
                >
                  <Microscope className="mr-2 h-6 w-6 text-gray-700" />
                  Área de P&D
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
      
      <div className="py-16 container mx-auto bg-white">
        <h2 className="text-3xl font-bold text-center mb-12 text-gray-800">Nossa abordagem inovadora</h2>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm transition-all hover:border-gray-400">
            <h3 className="text-xl font-bold mb-4 flex items-center text-gray-800">
              <Stethoscope className="mr-2 h-5 w-5 text-gray-700" />
              Para Veterinários
            </h3>
            <p className="mb-4 text-gray-600">
              Acesse dados clínicos, consulte a IA para recomendações personalizadas e visualize evidências científicas.
            </p>
            <Link to="/veterinario" className="text-gray-700 hover:underline inline-flex items-center font-medium">
              Saiba mais <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </div>
          
          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm transition-all hover:border-gray-400">
            <h3 className="text-xl font-bold mb-4 flex items-center text-gray-800">
              <img 
                src="/lovable-uploads/154ca2f9-5d6b-4a91-a708-3c8bd2356c0d.png" 
                alt="Pata" 
                className="mr-2 h-5 w-5"
              />
              Para Tutores
            </h3>
            <p className="mb-4 text-gray-600">
              Receba explicações simplificadas sobre recomendações e acompanhe o progresso do seu pet com tratamentos personalizados.
            </p>
            <Link to="/tutor" className="text-gray-700 hover:underline inline-flex items-center font-medium">
              Saiba mais <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </div>
          
          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm transition-all hover:border-gray-400">
            <h3 className="text-xl font-bold mb-4 flex items-center text-gray-800">
              <Microscope className="mr-2 h-5 w-5 text-gray-700" />
              P&D Avançada
            </h3>
            <p className="mb-4 text-gray-600">
              Acesse nossa plataforma de pesquisa e desenvolvimento para gerenciar estudos científicos e nutracêuticos.
            </p>
            <Link to="/administrador" className="text-gray-700 hover:underline inline-flex items-center font-medium">
              Saiba mais <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
      
      <div className="bg-gray-50 py-16 border-t border-gray-200">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold mb-6 text-gray-800 text-center">Mitigação de doenças degenerativas</h2>
            
            <div className="grid md:grid-cols-2 gap-8 mt-10">
              <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <FlaskConical className="h-8 w-8 text-purple-500" />
                  <h3 className="text-xl font-bold text-gray-800">Pesquisa Científica</h3>
                </div>
                <p className="text-gray-600">
                  Nossa plataforma integra resultados de estudos clínicos e pesquisas em nutracêuticos para 
                  criar tratamentos baseados em evidências científicas sólidas.
                </p>
                <div className="mt-4 flex justify-end">
                  <Link to="/administrador" className="text-purple-600 hover:text-purple-800 flex items-center">
                    Ver pesquisas <ArrowRight className="ml-1 h-4 w-4" />
                  </Link>
                </div>
              </div>
              
              <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <Beaker className="h-8 w-8 text-blue-500" />
                  <h3 className="text-xl font-bold text-gray-800">Tratamento Individualizado</h3>
                </div>
                <p className="text-gray-600">
                  Combinamos dados clínicos específicos de cada pet com modelos preditivos para criar 
                  planos de tratamento personalizados que maximizam resultados.
                </p>
                <div className="mt-4 flex justify-end">
                  <Link to="/veterinario" className="text-blue-600 hover:text-blue-800 flex items-center">
                    Metodologia <ArrowRight className="ml-1 h-4 w-4" />
                  </Link>
                </div>
              </div>
            </div>
            
            <div className="mt-12 text-center">
              <Button className="bg-white border-2 border-gray-400 text-gray-800 hover:bg-gray-100 px-8 py-6 text-lg">
                Comece agora
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Index;
