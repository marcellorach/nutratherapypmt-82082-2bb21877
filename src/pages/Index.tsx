
import React from 'react';
import { Button } from "@/components/ui/button";
import { ArrowRight, PawPrint, Stethoscope, Beaker } from "lucide-react";
import Layout from '@/components/layout/Layout';
import { Link } from 'react-router-dom';
import { generateRandomData } from '@/data/mockData';

const Index = () => {
  return (
    <Layout>
      <div className="bg-black py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <div className="bg-black p-6 rounded-xl border border-white/10">
              <PawPrint className="mx-auto h-20 w-20 text-[#7E57C2]" />
              <h1 className="mt-6 text-4xl font-bold tracking-tight sm:text-5xl text-white">
                NutraTherapy PET
              </h1>
              <p className="mt-6 text-lg leading-8 text-gray-300">
                Soluções nutricionais inteligentes e personalizadas para uma vida mais longa e saudável do seu pet
              </p>
              
              <Button 
                onClick={generateRandomData}
                variant="outline" 
                className="mt-6 border-[#7E57C2] text-[#7E57C2] hover:bg-[#7E57C2]/20"
              >
                Gerar dados aleatórios para exemplo
              </Button>
            </div>
            
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-6">
              <Link to="/veterinario">
                <Button className="w-64 h-16 text-lg flex items-center justify-center gap-2 bg-black text-white border-2 border-[#7E57C2] hover:bg-[#7E57C2]/10 transition-all">
                  <Stethoscope className="w-6 h-6 text-[#7E57C2]" />
                  Área do Veterinário
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              
              <Link to="/tutor">
                <Button 
                  className="w-64 h-16 text-lg bg-black text-white border-2 border-[#FF719A] hover:bg-[#FF719A]/10 transition-all" 
                  variant="outline"
                >
                  <PawPrint className="mr-2 h-6 w-6 text-[#FF719A]" />
                  Área do Tutor
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
      
      <div className="py-16 container mx-auto bg-black">
        <h2 className="text-3xl font-bold text-center mb-12 text-white">Como podemos ajudar</h2>
        <div className="grid md:grid-cols-2 gap-8">
          <div className="bg-black p-6 rounded-lg border border-white/10 transition-all hover:border-[#7E57C2]">
            <h3 className="text-xl font-bold mb-4 flex items-center text-white">
              <Stethoscope className="mr-2 h-5 w-5 text-[#7E57C2]" />
              Para Veterinários
            </h3>
            <p className="mb-4 text-gray-300">
              Acesse dados clínicos, consulte a IA para recomendações,
              visualize evidências científicas e crie planos de tratamento.
            </p>
            <Link to="/veterinario" className="text-[#7E57C2] hover:underline inline-flex items-center font-medium">
              Saiba mais <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </div>
          
          <div className="bg-black p-6 rounded-lg border border-white/10 transition-all hover:border-[#FF719A]">
            <h3 className="text-xl font-bold mb-4 flex items-center text-white">
              <PawPrint className="mr-2 h-5 w-5 text-[#FF719A]" />
              Para Tutores
            </h3>
            <p className="mb-4 text-gray-300">
              Receba explicações simplificadas sobre recomendações,
              visualize composição e posologia, aprove e acompanhe o progresso do seu pet.
            </p>
            <Link to="/tutor" className="text-[#FF719A] hover:underline inline-flex items-center font-medium">
              Saiba mais <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
      
      <div className="bg-black py-16 border-t border-white/10">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-6 text-white">Por que escolher NutraTherapy PET?</h2>
            <p className="text-lg text-gray-300 mb-8">
              Nossa abordagem combina análise nutricional avançada, IA especializada e recomendações 
              personalizadas para promover a saúde e bem-estar do seu pet a longo prazo.
            </p>
            <div className="flex justify-center">
              <Button className="bg-black border-2 border-[#7E57C2] text-white hover:bg-[#7E57C2]/10 px-8 py-6 text-lg">
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
