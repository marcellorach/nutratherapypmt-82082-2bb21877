
import React from 'react';
import { Button } from "@/components/ui/button";
import { ArrowRight, PawPrint, Stethoscope } from "lucide-react";
import Layout from '@/components/layout/Layout';
import { Link } from 'react-router-dom';
import { generateRandomData } from '@/data/mockData';

const Index = () => {
  return (
    <Layout>
      <div className="bg-gradient-to-b from-gray-50 to-gray-100 py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <PawPrint className="mx-auto h-20 w-20 text-primary" />
            <h1 className="mt-6 text-4xl font-bold tracking-tight sm:text-5xl">
              NutraTherapy PET
            </h1>
            <p className="mt-6 text-lg leading-8 text-gray-600">
              Sistema inteligente de recomendação de nutracêuticos para pets, visando
              complementar deficiências nutricionais, prevenir doenças degenerativas e
              promover longevidade saudável.
            </p>
            
            <Button 
              onClick={generateRandomData}
              variant="outline" 
              className="mt-6"
            >
              Gerar dados aleatórios para exemplo
            </Button>
            
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-6">
              <Link to="/veterinario">
                <Button className="w-64 h-16 text-lg flex items-center justify-center gap-2">
                  <Stethoscope className="w-6 h-6" />
                  Área do Veterinário
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              
              <Link to="/tutor">
                <Button 
                  className="w-64 h-16 text-lg" 
                  variant="outline"
                >
                  <PawPrint className="mr-2 h-6 w-6" />
                  Área do Tutor
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
      
      <div className="py-16 container mx-auto">
        <div className="grid md:grid-cols-2 gap-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-xl font-bold mb-4 flex items-center">
              <Stethoscope className="mr-2 h-5 w-5 text-primary" />
              Para Veterinários
            </h3>
            <p className="mb-4">
              Acesse dados clínicos, consulte a IA para recomendações,
              visualize evidências científicas e crie planos de tratamento.
            </p>
            <Link to="/veterinario" className="text-primary hover:underline inline-flex items-center">
              Saiba mais <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-xl font-bold mb-4 flex items-center">
              <PawPrint className="mr-2 h-5 w-5 text-primary" />
              Para Tutores
            </h3>
            <p className="mb-4">
              Receba explicações simplificadas sobre recomendações,
              visualize composição e posologia, aprove e acompanhe o progresso do seu pet.
            </p>
            <Link to="/tutor" className="text-primary hover:underline inline-flex items-center">
              Saiba mais <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Index;
