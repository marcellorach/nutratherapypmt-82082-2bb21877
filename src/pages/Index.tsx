
import React from 'react';
import { Button } from "@/components/ui/button";
import { ArrowRight, PawPrint, Stethoscope } from "lucide-react";
import Layout from '@/components/layout/Layout';
import { Link } from 'react-router-dom';
import { generateRandomData } from '@/data/mockData';

const Index = () => {
  return (
    <Layout>
      <div className="bg-gradient-to-br from-[#E5DEFF] via-[#FFDEE2] to-[#D3E4FD] py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <div className="bg-white/30 backdrop-blur-sm p-6 rounded-xl shadow-lg border border-white/50">
              <PawPrint className="mx-auto h-20 w-20 text-[#7E57C2]" />
              <h1 className="mt-6 text-4xl font-bold tracking-tight sm:text-5xl bg-gradient-to-r from-[#7E57C2] to-[#FF719A] bg-clip-text text-transparent">
                NutraTherapy PET
              </h1>
              <p className="mt-6 text-lg leading-8 text-gray-800">
                Soluções nutracêuticas personalizadas que promovem saúde e longevidade para o seu melhor amigo
              </p>
              
              <Button 
                onClick={generateRandomData}
                variant="outline" 
                className="mt-6 bg-white/50 border-[#7E57C2] text-[#7E57C2] hover:bg-[#7E57C2] hover:text-white"
              >
                Gerar dados aleatórios para exemplo
              </Button>
            </div>
            
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-6">
              <Link to="/veterinario">
                <Button className="w-64 h-16 text-lg flex items-center justify-center gap-2 bg-[#7E57C2] hover:bg-[#6A42AB] transition-all shadow-md">
                  <Stethoscope className="w-6 h-6" />
                  Área do Veterinário
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              
              <Link to="/tutor">
                <Button 
                  className="w-64 h-16 text-lg bg-white/70 text-[#FF719A] border-[#FF719A] hover:bg-[#FF719A] hover:text-white transition-all shadow-md" 
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
        <h2 className="text-3xl font-bold text-center mb-12 text-gray-800">Como podemos ajudar</h2>
        <div className="grid md:grid-cols-2 gap-8">
          <div className="bg-gradient-to-br from-[#FEF7CD] to-[#FEC6A1] p-6 rounded-lg shadow-md border border-white transform transition-all hover:scale-105">
            <h3 className="text-xl font-bold mb-4 flex items-center">
              <Stethoscope className="mr-2 h-5 w-5 text-[#7E57C2]" />
              Para Veterinários
            </h3>
            <p className="mb-4">
              Acesse dados clínicos, consulte a IA para recomendações,
              visualize evidências científicas e crie planos de tratamento.
            </p>
            <Link to="/veterinario" className="text-[#7E57C2] hover:underline inline-flex items-center font-medium">
              Saiba mais <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </div>
          
          <div className="bg-gradient-to-br from-[#D3E4FD] to-[#E5DEFF] p-6 rounded-lg shadow-md border border-white transform transition-all hover:scale-105">
            <h3 className="text-xl font-bold mb-4 flex items-center">
              <PawPrint className="mr-2 h-5 w-5 text-[#FF719A]" />
              Para Tutores
            </h3>
            <p className="mb-4">
              Receba explicações simplificadas sobre recomendações,
              visualize composição e posologia, aprove e acompanhe o progresso do seu pet.
            </p>
            <Link to="/tutor" className="text-[#FF719A] hover:underline inline-flex items-center font-medium">
              Saiba mais <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
      
      <div className="bg-[#F2FCE2] py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-6 text-gray-800">Por que escolher NutraTherapy PET?</h2>
            <p className="text-lg text-gray-700 mb-8">
              Nossa abordagem combina análise nutricional avançada, IA especializada e recomendações 
              personalizadas para promover a saúde e bem-estar do seu pet a longo prazo.
            </p>
            <div className="flex justify-center">
              <Button className="bg-[#7E57C2] hover:bg-[#6A42AB] text-white px-8 py-6 text-lg">
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
