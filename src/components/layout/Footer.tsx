
import React from 'react';
import { useTranslation } from 'react-i18next';
import { SENEX_VERSION, SENEX_LAST_UPDATE } from '@/config/senex-version';

const Footer: React.FC = () => {
  const { t } = useTranslation();
  return (
    <footer className="bg-gray-50 text-gray-700 border-t border-gray-200 w-full max-w-full overflow-x-hidden">
      <div className="container mx-auto px-4 py-6 max-w-full overflow-x-hidden">
        {/* Copyright e slogan */}
        <div className="text-center mb-4 space-y-1">
          <div className="flex items-baseline justify-center gap-2">
            <span className="text-sm font-bold text-gray-800">Senex AI</span>
            <span
              className="text-[10px] text-gray-500 font-mono tabular-nums"
              title={`Senex AI v${SENEX_VERSION} — atualizado em ${SENEX_LAST_UPDATE}`}
            >
              v{SENEX_VERSION} · {SENEX_LAST_UPDATE}
            </span>
          </div>
          <div className="text-xs text-gray-500">
            {t('footer.copyrightFull')}
            <span className="ml-2 text-gray-400 font-mono tabular-nums">· v{SENEX_VERSION} · {SENEX_LAST_UPDATE}</span>
          </div>
          <div className="text-[11px] text-gray-500 italic">{t('footer.petMoreTimeTagline')}</div>
          <div className="text-sm font-semibold text-gray-800 pt-1">{t('footer.sloganLine1')}</div>
        </div>
        
        {/* Seção Powered by com logos */}
        <div className="flex flex-col items-center space-y-3">
          <div className="text-xs text-gray-500 font-medium">
            {t('footer.poweredBy')}
          </div>
          
          <div className="flex items-center justify-center space-x-8 flex-wrap gap-y-3">
            {/* Gemini */}
            <div className="flex items-center opacity-80 hover:opacity-100 transition-opacity">
              <div className="flex items-center space-x-2">
                <img 
                  src="/images/gemini-logo.svg" 
                  alt="Gemini" 
                  className="h-8 w-auto transition-all"
                />
                <span className="text-sm text-gray-600 font-medium">Gemini</span>
              </div>
            </div>
            
            {/* OpenAI */}
            <div className="flex items-center opacity-80 hover:opacity-100 transition-opacity">
              <div className="flex items-center space-x-2">
                <img 
                  src="/images/openai-logo.png" 
                  alt="OpenAI" 
                  className="h-7 w-auto transition-all"
                />
                <span className="text-sm text-gray-600 font-medium">OpenAI</span>
              </div>
            </div>
            
            {/* Anthropic */}
            <div className="flex items-center opacity-80 hover:opacity-100 transition-opacity">
              <div className="flex items-center space-x-2">
                <img 
                  src="/images/anthropic-logo.png" 
                  alt="Anthropic" 
                  className="h-[18px] w-auto transition-all"
                />
              </div>
            </div>
            
            {/* Neo4j */}
            <div className="flex items-center opacity-80 hover:opacity-100 transition-opacity">
              <div className="flex items-center space-x-2">
                <img 
                  src="/images/neo4j-logo.png" 
                  alt="Neo4j" 
                  className="h-16 w-auto transition-all"
                />
              </div>
            </div>
            
            {/* Google Co-Scientist - temporariamente escondido */}
            {/* <div className="flex items-center opacity-80 hover:opacity-100 transition-opacity">
              <div className="flex flex-col items-center space-y-1">
                <div className="flex items-center space-x-2">
                  <img 
                    src="https://www.google.com/images/branding/googleg/1x/googleg_standard_color_128dp.png" 
                    alt="Google" 
                    className="h-6 w-auto"
                  />
                  <span className="text-sm text-gray-600 font-medium">Co-Scientist</span>
                </div>
                <span className="text-xs text-gray-500 font-medium italic">{t('footer.comingSoon')}</span>
              </div>
            </div> */}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
