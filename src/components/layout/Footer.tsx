
import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-50 text-gray-700 border-t border-gray-200">
      <div className="container mx-auto px-4 py-6">
        {/* Copyright e descrição principal */}
        <div className="text-center text-sm mb-4">
          NutraTherapy PET © {new Date().getFullYear()} - Sistema inteligente de recomendação de nutracêuticos para pets
        </div>
        
        {/* Seção Powered by com logos */}
        <div className="flex flex-col items-center space-y-3">
          <div className="text-xs text-gray-500 font-medium">
            Powered by
          </div>
          
          <div className="flex items-center justify-center space-x-8 flex-wrap gap-y-3">
            {/* Google Cloud */}
            <div className="flex items-center opacity-80 hover:opacity-100 transition-opacity">
              <div className="flex items-center space-x-2">
                <img 
                  src="/lovable-uploads/836ec4b0-4874-42fe-9d1d-6f1da2b92798.png" 
                  alt="Google Cloud" 
                  className="h-11 w-auto transition-all"
                />
                <span className="text-sm text-gray-600 font-medium">Google Cloud</span>
              </div>
            </div>
            
            {/* OpenAI */}
            <div className="flex items-center opacity-80 hover:opacity-100 transition-opacity">
              <div className="flex items-center space-x-2">
                <img 
                  src="https://upload.wikimedia.org/wikipedia/commons/thumb/0/04/ChatGPT_logo.svg/1024px-ChatGPT_logo.svg.png" 
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
                  src="https://upload.wikimedia.org/wikipedia/commons/thumb/7/78/Anthropic_logo.svg/2560px-Anthropic_logo.svg.png" 
                  alt="Anthropic" 
                  className="h-[18px] w-auto transition-all"
                />
              </div>
            </div>
            
            {/* Mistral AI */}
            <div className="flex items-center opacity-80 hover:opacity-100 transition-opacity">
              <div className="flex items-center space-x-2">
                <img 
                  src="/lovable-uploads/1a7e4474-434a-4b14-9905-18d52a577319.png" 
                  alt="Mistral AI" 
                  className="h-7 w-auto transition-all"
                />
                <span className="text-sm text-gray-600 font-medium">Mistral AI</span>
              </div>
            </div>
            
            {/* Google Co-Scientist - em breve */}
            <div className="flex items-center opacity-80 hover:opacity-100 transition-opacity">
              <div className="flex flex-col items-center space-y-1">
                <div className="flex items-center space-x-2">
                  <img 
                    src="https://www.google.com/images/branding/googleg/1x/googleg_standard_color_128dp.png" 
                    alt="Google" 
                    className="h-6 w-auto"
                  />
                  <span className="text-sm text-gray-600 font-medium">Co-Scientist</span>
                </div>
                <span className="text-xs text-gray-500 font-medium italic">em breve</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
