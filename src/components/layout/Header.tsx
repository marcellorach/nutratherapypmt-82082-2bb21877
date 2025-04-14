
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { User, UserCog, LogOut, Microscope } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from './LanguageSwitcher';

const Header: React.FC = () => {
  const { t } = useTranslation();

  return (
    <header className="w-full bg-white text-gray-800 p-4 border-b border-gray-200 shadow-sm">
      <div className="container mx-auto flex justify-between items-center">
        <Link to="/" className="text-xl font-semibold flex items-center gap-2">
          <img 
            src="/lovable-uploads/7f924bdb-8c9d-4162-b83d-9d001f6ea02c.png" 
            alt="NutraTherapy"
            className="h-16" 
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
          <Link to="/veterinario" className="text-gray-700 hover:text-gray-900 transition-colors font-medium">
            {t('common.veterinarian')}
          </Link>
          <Link to="/tutor" className="text-gray-700 hover:text-gray-900 transition-colors">
            {t('common.tutor')}
          </Link>
        </nav>
        
        <div className="flex gap-2 items-center">
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
          
          <LanguageSwitcher />
          
          <div className="flex items-center gap-3">
            <div className="flex flex-col items-end">
              <span className="font-medium text-sm">Dr. Ricardo Alves</span>
              <span className="text-xs text-gray-500">CRV: 12345-MG</span>
            </div>
            <Avatar className="h-9 w-9 border border-gray-200">
              <AvatarImage src="/lovable-uploads/56284482-b2f9-4ef0-a5c8-6bd2afc82e04.png" />
              <AvatarFallback>RA</AvatarFallback>
            </Avatar>
            <Button 
              variant="ghost" 
              size="icon"
              className="text-gray-500 hover:text-gray-800 hover:bg-gray-100"
            >
              <LogOut size={18} />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
