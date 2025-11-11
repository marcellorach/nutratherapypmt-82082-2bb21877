
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { LogOut, LogIn, Settings } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from './LanguageSwitcher';
import { useAuth } from '@/contexts/AuthContext';

const Header: React.FC = () => {
  const { t } = useTranslation();
  const { user, userProfile, userRoles, signOut, hasRole } = useAuth();

  const isAuthenticated = !!user;
  const isVeterinarian = hasRole('veterinarian');
  const isAdmin = hasRole('admin');

  return (
    <header className="w-full bg-white text-gray-800 p-6 border-b border-gray-200 shadow-sm fixed top-0 left-0 z-50">
      <div className="container mx-auto flex justify-between items-center">
        <Link to="/" className="flex items-center gap-4">
          <img 
            src="/lovable-uploads/7f924bdb-8c9d-4162-b83d-9d001f6ea02c.png" 
            alt="NutraTherapy"
            className="h-6"
          />
          <div className="flex flex-col leading-tight">
            <div className="text-lg font-bold text-gray-800 text-center">
              NutraTherapy
            </div>
            <div className="text-xs text-gray-600 font-light text-center">
              {t('header.platformSubtitleLine1')}
            </div>
            <div className="text-xs text-gray-600 font-light text-center">
              {t('header.platformSubtitleLine2')}
            </div>
          </div>
        </Link>
        
        
        <div className="flex gap-3 items-center">
          <LanguageSwitcher />
          
          {isAuthenticated ? (
            <div className="flex items-center gap-4">
              {isAdmin && (
                <Link to="/administrador">
                  <Button 
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2 text-gray-700 hover:text-gray-900 border-gray-300 hover:border-gray-400 transition-all"
                  >
                    <Settings size={16} />
                    {t('header.administrator')}
                  </Button>
                </Link>
              )}
              <div className="flex flex-col items-end">
                <span className="font-medium text-sm text-gray-800">
                  {userProfile?.first_name} {userProfile?.last_name}
                </span>
                <span className="text-xs text-gray-500">
                  {userRoles.length > 0 && userRoles[0] === 'admin' 
                    ? t('header.administrator')
                    : userRoles.length > 0 && userRoles[0] === 'veterinarian' 
                      ? t('header.veterinarian')
                      : t('header.tutor')}
                </span>
              </div>
              <Avatar className="h-10 w-10 border-2 border-gray-200">
                <AvatarImage src={userProfile?.avatar_url || "/lovable-uploads/56284482-b2f9-4ef0-a5c8-6bd2afc82e04.png"} />
                <AvatarFallback className="bg-gray-100 text-gray-600">
                  {userProfile?.first_name?.charAt(0)}{userProfile?.last_name?.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <Button 
                variant="ghost" 
                size="icon"
                className="text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition-colors"
                onClick={() => signOut()}
              >
                <LogOut size={18} />
              </Button>
            </div>
          ) : (
            <Link to="/auth">
              <Button 
                variant="outline"
                className="flex items-center gap-2 text-gray-700 hover:text-gray-900 border-gray-300 hover:border-gray-400 transition-all"
              >
                <LogIn size={18} />
                {t('header.login')}
              </Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
