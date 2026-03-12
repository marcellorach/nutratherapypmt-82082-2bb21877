
import React from 'react';
import Layout from '../components/layout/Layout';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Heart, Book, UserCog, LogIn, ArrowRight, ChevronDown } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { useTranslation } from 'react-i18next';
import LandingContent from '@/components/landing/LandingContent';

const Index: React.FC = () => {
  const { t } = useTranslation();
  const { user, hasRole } = useAuth();
  const navigate = useNavigate();
  
  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-full overflow-x-hidden min-w-0">
        {/* Hero Section */}
        <div className="text-center max-w-4xl mx-auto mb-12">
          <h1 className="text-5xl font-bold mb-4">{t('home.title')}</h1>
          <p className="text-xl text-gray-700 mb-6">
            {t('home.subtitle')}
          </p>
        </div>
        
        {!user ? (
          <div className="flex flex-col items-center justify-center mt-8">
            <div className="max-w-xl text-center mb-8">
              <h2 className="text-2xl font-semibold mb-4">{t('home.platformAccess')}</h2>
              <p className="text-gray-600 mb-6">
                {t('home.platformAccessDesc')}
              </p>
              <Link to="/administrador">
                <Button className="flex items-center gap-2 px-6 py-6 text-lg">
                  <LogIn size={20} />
                  {t('home.loginButton')}
                </Button>
              </Link>
            </div>
            
            {/* Destaque dos benefícios */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12 w-full min-w-0">
              <Card className="p-6 bg-white border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex flex-col items-center text-center">
                  <div className="rounded-full bg-gray-50 p-3 mb-4">
                    <Book size={32} className="text-gray-700" />
                  </div>
                  <h3 className="text-xl font-medium mb-2">{t('home.forTutors')}</h3>
                  <p className="text-gray-600">
                    {t('home.forTutorsDesc')}
                  </p>
                </div>
              </Card>
              
              <Card className="p-6 bg-white border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex flex-col items-center text-center">
                  <div className="rounded-full bg-gray-50 p-3 mb-4">
                    <Heart size={32} className="text-gray-700" />
                  </div>
                  <h3 className="text-xl font-medium mb-2">{t('home.forVeterinarians')}</h3>
                  <p className="text-gray-600">
                    {t('home.forVeterinariansDesc')}
                  </p>
                </div>
              </Card>
              
              <Card className="p-6 bg-white border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex flex-col items-center text-center">
                  <div className="rounded-full bg-gray-50 p-3 mb-4">
                    <UserCog size={32} className="text-gray-700" />
                  </div>
                  <h3 className="text-xl font-medium mb-2">{t('home.forResearchDev')}</h3>
                  <p className="text-gray-600">
                    {t('home.forResearchDevDesc')}
                  </p>
                </div>
              </Card>
            </div>
          </div>
        ) : (
          <div className="mt-8">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden w-full max-w-full">
              <div className="p-8 text-center border-b border-gray-100">
                <h2 className="text-2xl font-bold mb-2">{t('home.welcomeBack')}</h2>
                <p className="text-gray-600 mb-0">
                  {t('home.connectedAs')} <span className="font-medium">{user.email}</span>
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-0 divide-y md:divide-y-0 md:divide-x divide-gray-100 min-w-0">
                <div className="p-6 hover:bg-gray-50 transition-colors min-w-0 overflow-hidden">
                  <div className="flex flex-col items-center text-center min-w-0">
                    <div className="rounded-full bg-gray-100 p-3 mb-4">
                      <UserCog size={28} className="text-gray-800" />
                    </div>
                    <h3 className="text-lg font-medium mb-3">{t('home.researchArea')}</h3>
                    <p className="text-gray-500 mb-4">
                      {t('home.researchAreaDesc')}
                    </p>
                    <div className="relative">
                      <Link to="/administrador">
                        <Button 
                          variant="outline" 
                          className="w-full flex items-center justify-center gap-1"
                        >
                          {t('home.researchAreaButton')} <ArrowRight size={16} />
                        </Button>
                      </Link>
                      {/* Red arrow callout */}
                      <div className="absolute -right-4 top-1/2 -translate-y-1/2 translate-x-full flex items-center gap-1 animate-pulse">
                        <svg width="32" height="24" viewBox="0 0 32 24" fill="none" className="rotate-180">
                          <path d="M0 12H28M28 12L18 2M28 12L18 22" stroke="#EF4444" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        <span className="text-red-500 font-bold text-sm whitespace-nowrap italic" style={{ fontFamily: 'cursive' }}>
                          visite aqui!
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="p-6 hover:bg-gray-50 transition-colors min-w-0 overflow-hidden">
                  <div className="flex flex-col items-center text-center min-w-0">
                    <div className="rounded-full bg-gray-100 p-3 mb-4">
                      <Heart size={28} className="text-gray-800" />
                    </div>
                    <h3 className="text-lg font-medium mb-3">{t('home.veterinarianArea')}</h3>
                    <p className="text-gray-500 mb-4">
                      {t('home.veterinarianAreaDesc')}
                    </p>
                    <Link to="/veterinario">
                      <Button 
                        variant="outline" 
                        className="w-full flex items-center justify-center gap-1"
                      >
                        {t('home.veterinarianAreaButton')} <ArrowRight size={16} />
                      </Button>
                    </Link>
                  </div>
                </div>
                
                <div className="p-6 bg-gray-50 hover:bg-gray-100 transition-colors min-w-0 overflow-hidden">
                  <div className="flex flex-col items-center text-center min-w-0">
                    <div className="rounded-full bg-gray-100 p-3 mb-4">
                      <Book size={28} className="text-gray-800" />
                    </div>
                    <h3 className="text-lg font-medium mb-3">{t('home.tutorArea')}</h3>
                    <p className="text-gray-500 mb-4">
                      {t('home.tutorAreaDesc')}
                    </p>
                    <Button 
                      variant="outline" 
                      className="w-full flex items-center justify-center gap-1" 
                      onClick={() => navigate('/tutor')}
                    >
                      {t('home.tutorAreaButton')} <ArrowRight size={16} />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        {/* Scroll indicator */}
        <div 
          className="flex flex-col items-center mt-16 mb-4 cursor-pointer group"
          onClick={() => document.getElementById('vision')?.scrollIntoView({ behavior: 'smooth' })}
        >
          <span className="inline-block px-6 py-2.5 rounded-full bg-orange-300 text-orange-900 font-semibold text-sm tracking-wide shadow-lg shadow-orange-300/30 group-hover:shadow-orange-300/50 group-hover:scale-105 transition-all duration-300">
            {t('landing.scrollIndicator')} ↓
          </span>
          <ChevronDown size={28} className="text-orange-400 animate-bounce mt-3" />
        </div>
      </div>

      {/* Landing sections below hero */}
      <LandingContent />
    </Layout>
  );
};

export default Index;
