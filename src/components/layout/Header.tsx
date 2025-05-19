
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { User, UserCog, LogOut, Microscope, LogIn } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from './LanguageSwitcher';
import { useAuth } from '@/contexts/AuthContext';

const Header: React.FC = () => {
  const { t } = useTranslation();
  const { user, userProfile, userRoles, signOut, hasRole } = useAuth();

  const isAuthenticated = !!user;
  const isAdmin = hasRole('admin');
  const isVeterinarian = hasRole('veterinarian');

  return (
    <header className="w-full bg-white text-gray-800 p-4 border-b border-gray-200 shadow-sm fixed top-0 left-0 z-50">
      <div className="container mx-auto flex justify-between items-center">
        <Link to="/" className="text-xl font-semibold flex items-center gap-2">
          <img 
            src="/lovable-uploads/7f924bdb-8c9d-4162-b83d-9d001f6ea02c.png" 
            alt="NutraTherapy"
            className="h-5" // Further reduced logo height from h-10 to h-5 (50% reduction)
          />
          <div className="flex flex-col">
            <span className="font-bold text-gray-800 text-xl">
              <span className="text-gray-600">NutraTherapy</span>
            </span>
            <span className="text-xs text-gray-600 font-light">
              {t('home.subtitle')}
            </span>
          </div>
        </Link>
        
        <nav className="hidden md:flex gap-6">
          {isVeterinarian && (
            <Link to="/veterinario" className="text-gray-700 hover:text-gray-900 transition-colors font-medium">
              {t('common.veterinarian')}
            </Link>
          )}
          <Link to="/tutor" className="text-gray-700 hover:text-gray-900 transition-colors">
            {t('common.tutor')}
          </Link>
        </nav>
        
        <div className="flex gap-2 items-center">
          {isAdmin && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link 
                    to="/administrador" 
                    className="text-gray-500 hover:text-gray-700 transition-colors mr-4 flex items-center gap-1"
                  >
                    <Microscope size={20} />
                    <span className="text-sm font-medium">{t('common.researchDev')}</span>
                  </Link>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs bg-white border border-gray-200 text-gray-800">
                  <p>{t('home.advancedRDDesc')}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          
          <LanguageSwitcher />
          
          {isAuthenticated ? (
            <div className="flex items-center gap-3">
              <div className="flex flex-col items-end">
                <span className="font-medium text-sm">
                  {userProfile?.first_name} {userProfile?.last_name}
                </span>
                <span className="text-xs text-gray-500">
                  {userRoles.length > 0 && userRoles[0] === 'admin' 
                    ? 'Administrador' 
                    : userRoles.length > 0 && userRoles[0] === 'veterinarian' 
                      ? 'Veterinário' 
                      : 'Tutor'}
                </span>
              </div>
              <Avatar className="h-9 w-9 border border-gray-200">
                <AvatarImage src={userProfile?.avatar_url || "/lovable-uploads/56284482-b2f9-4ef0-a5c8-6bd2afc82e04.png"} />
                <AvatarFallback>
                  {userProfile?.first_name?.charAt(0)}{userProfile?.last_name?.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <Button 
                variant="ghost" 
                size="icon"
                className="text-gray-500 hover:text-gray-800 hover:bg-gray-100"
                onClick={() => signOut()}
              >
                <LogOut size={18} />
              </Button>
            </div>
          ) : (
            <Link to="/auth">
              <Button 
                variant="ghost"
                className="flex items-center gap-2 text-gray-700 hover:text-gray-900"
              >
                <LogIn size={18} />
                Entrar
              </Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
