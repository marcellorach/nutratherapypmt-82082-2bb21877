
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
              <img 
                src="https://cloud.google.com/_static/cloud/images/social-icon-google-cloud-1200-630.png" 
                alt="Google Cloud" 
                className="h-7 w-auto transition-all"
              />
            </div>
            
            {/* OpenAI */}
            <div className="flex items-center opacity-80 hover:opacity-100 transition-opacity">
              <img 
                src="https://upload.wikimedia.org/wikipedia/commons/thumb/0/04/ChatGPT_logo.svg/1024px-ChatGPT_logo.svg.png" 
                alt="OpenAI" 
                className="h-7 w-auto transition-all"
              />
            </div>
            
            {/* Claude/Anthropic */}
            <div className="flex items-center opacity-80 hover:opacity-100 transition-opacity">
              <div className="flex items-center space-x-2">
                <div className="w-7 h-7 bg-orange-500 rounded-lg flex items-center justify-center">
                  <span className="text-white text-sm font-bold">A</span>
                </div>
                <span className="text-sm text-gray-600 font-medium">Claude</span>
              </div>
            </div>
            
            {/* Mistral AI */}
            <div className="flex items-center opacity-80 hover:opacity-100 transition-opacity">
              <div className="flex items-center space-x-2">
                <div className="w-7 h-7 bg-orange-500 rounded-sm flex items-center justify-center">
                  <span className="text-white text-sm font-bold">M</span>
                </div>
                <span className="text-sm text-gray-600 font-medium">Mistral</span>
              </div>
            </div>
            
            {/* Google Co-Scientist - em breve */}
            <div className="flex items-center opacity-60">
              <div className="flex flex-col items-center space-y-1">
                <div className="flex items-center space-x-2">
                  <img 
                    src="https://www.google.com/images/branding/googleg/1x/googleg_standard_color_128dp.png" 
                    alt="Google" 
                    className="h-6 w-auto"
                  />
                  <span className="text-sm text-gray-500 font-medium">Co-Scientist</span>
                </div>
                <span className="text-xs text-gray-400 font-light italic">em breve</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
