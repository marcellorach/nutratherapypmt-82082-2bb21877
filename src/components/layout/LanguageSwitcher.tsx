
import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";

const LanguageSwitcher: React.FC = () => {
  const { i18n } = useTranslation();

  useEffect(() => {
    // Ensure the language is set from localStorage on component mount
    const savedLanguage = localStorage.getItem('language');
    if (savedLanguage) {
      i18n.changeLanguage(savedLanguage);
    }
  }, [i18n]);

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
    localStorage.setItem('language', lng);
    console.log(`Language changed to ${lng}`);
  };

  const currentFlag = i18n.language === 'pt' ? '🇧🇷' : '🇺🇸';
  const currentLabel = i18n.language === 'pt' ? 'PT' : 'EN';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-9 px-2.5 gap-1.5 text-gray-800 border-gray-300 hover:bg-gray-100 hover:border-gray-400"
          aria-label={`Idioma: ${currentLabel}`}
        >
          <span className="text-base leading-none" aria-hidden="true">{currentFlag}</span>
          <span className="text-xs font-semibold tracking-wide">{currentLabel}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => changeLanguage('pt')} className={i18n.language === 'pt' ? "bg-gray-100" : ""}>
          <span className="mr-2">🇧🇷</span> Português
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => changeLanguage('en')} className={i18n.language === 'en' ? "bg-gray-100" : ""}>
          <span className="mr-2">🇺🇸</span> English
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default LanguageSwitcher;
