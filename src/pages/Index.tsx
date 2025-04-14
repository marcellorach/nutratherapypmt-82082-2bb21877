
import React from 'react';
import { Button } from "@/components/ui/button";
import { ArrowRight, Stethoscope, Beaker, Microscope, FlaskConical } from "lucide-react";
import Layout from '@/components/layout/Layout';
import { Link } from 'react-router-dom';
import { generateRandomData } from '@/data';
import { useTranslation } from 'react-i18next';

const Index = () => {
  const { t } = useTranslation();

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
                {t('home.title')}
              </h1>
              <p className="mt-6 text-lg leading-8 text-gray-600">
                {t('home.subtitle')}
              </p>
              
              <Button 
                onClick={generateRandomData}
                variant="outline" 
                className="mt-6 border-gray-300 text-gray-700 hover:bg-gray-100"
              >
                {t('common.generateRandomData')}
              </Button>
            </div>
            
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-6">
              <Link to="/veterinario">
                <Button className="w-64 h-16 text-lg flex items-center justify-center gap-2 bg-white text-gray-800 border-2 border-gray-500 hover:bg-gray-100 transition-all">
                  <Stethoscope className="w-6 h-6 text-gray-700" />
                  {t('common.veterinarian')}
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
                  {t('common.tutor')}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              
              <Link to="/administrador">
                <Button 
                  className="w-64 h-16 text-lg bg-white text-gray-800 border-2 border-gray-500 hover:bg-gray-100 transition-all" 
                  variant="outline"
                >
                  <Microscope className="mr-2 h-6 w-6 text-gray-700" />
                  {t('common.researchDev')}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
      
      <div className="py-16 container mx-auto bg-white">
        <h2 className="text-3xl font-bold text-center mb-12 text-gray-800">{t('home.innovativeApproach')}</h2>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm transition-all hover:border-gray-400">
            <h3 className="text-xl font-bold mb-4 flex items-center text-gray-800">
              <Stethoscope className="mr-2 h-5 w-5 text-gray-700" />
              {t('home.forVeterinarians')}
            </h3>
            <p className="mb-4 text-gray-600">
              {t('home.forVeterinariansDesc')}
            </p>
            <Link to="/veterinario" className="text-gray-700 hover:underline inline-flex items-center font-medium">
              {t('common.learnMore')} <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </div>
          
          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm transition-all hover:border-gray-400">
            <h3 className="text-xl font-bold mb-4 flex items-center text-gray-800">
              <img 
                src="/lovable-uploads/154ca2f9-5d6b-4a91-a708-3c8bd2356c0d.png" 
                alt="Pata" 
                className="mr-2 h-5 w-5"
              />
              {t('home.forTutors')}
            </h3>
            <p className="mb-4 text-gray-600">
              {t('home.forTutorsDesc')}
            </p>
            <Link to="/tutor" className="text-gray-700 hover:underline inline-flex items-center font-medium">
              {t('common.learnMore')} <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </div>
          
          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm transition-all hover:border-gray-400">
            <h3 className="text-xl font-bold mb-4 flex items-center text-gray-800">
              <Microscope className="mr-2 h-5 w-5 text-gray-700" />
              {t('home.advancedRD')}
            </h3>
            <p className="mb-4 text-gray-600">
              {t('home.advancedRDDesc')}
            </p>
            <Link to="/administrador" className="text-gray-700 hover:underline inline-flex items-center font-medium">
              {t('common.learnMore')} <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
      
      <div className="bg-gray-50 py-16 border-t border-gray-200">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold mb-6 text-gray-800 text-center">{t('home.degenerativeDiseases')}</h2>
            
            <div className="grid md:grid-cols-2 gap-8 mt-10">
              <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <FlaskConical className="h-8 w-8 text-purple-500" />
                  <h3 className="text-xl font-bold text-gray-800">{t('home.scientificResearch')}</h3>
                </div>
                <p className="text-gray-600">
                  {t('home.scientificResearchDesc')}
                </p>
                <div className="mt-4 flex justify-end">
                  <Link to="/administrador" className="text-purple-600 hover:text-purple-800 flex items-center">
                    {t('common.learnMore')} <ArrowRight className="ml-1 h-4 w-4" />
                  </Link>
                </div>
              </div>
              
              <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <Beaker className="h-8 w-8 text-blue-500" />
                  <h3 className="text-xl font-bold text-gray-800">{t('home.individualizedTreatment')}</h3>
                </div>
                <p className="text-gray-600">
                  {t('home.individualizedTreatmentDesc')}
                </p>
                <div className="mt-4 flex justify-end">
                  <Link to="/veterinario" className="text-blue-600 hover:text-blue-800 flex items-center">
                    {t('home.methodology')} <ArrowRight className="ml-1 h-4 w-4" />
                  </Link>
                </div>
              </div>
            </div>
            
            <div className="mt-12 text-center">
              <Button className="bg-white border-2 border-gray-400 text-gray-800 hover:bg-gray-100 px-8 py-6 text-lg">
                {t('common.startNow')}
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
