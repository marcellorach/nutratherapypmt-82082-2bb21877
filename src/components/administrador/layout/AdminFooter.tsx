import React from 'react';

const AdminFooter: React.FC = () => {
  return (
    <footer className="bg-gray-50 text-gray-700 border-t border-gray-200 mt-auto">
      <div className="px-6 py-4">
        {/* Copyright e descrição principal */}
        <div className="text-center text-sm mb-3">
          VetGeroTherapy PET © {new Date().getFullYear()} - Sistema inteligente de recomendação de nutracêuticos para pets
        </div>
        
        {/* Seção Powered by com logos */}
        <div className="flex flex-col items-center space-y-2">
          <div className="text-xs text-gray-500 font-medium">
            Powered by
          </div>
          
          <div className="flex items-center justify-center space-x-6 flex-wrap gap-y-2">
            {/* Google Cloud */}
            <div className="flex items-center opacity-80 hover:opacity-100 transition-opacity">
              <div className="flex items-center space-x-2">
                <img 
                  src="/images/google-cloud-logo.svg" 
                  alt="Google Cloud" 
                  className="h-6 w-auto transition-all"
                />
                <span className="text-xs text-gray-600 font-medium">Google Cloud</span>
              </div>
            </div>
            
            {/* OpenAI */}
            <div className="flex items-center opacity-80 hover:opacity-100 transition-opacity">
              <div className="flex items-center space-x-2">
                <img 
                  src="/images/openai-logo.png" 
                  alt="OpenAI" 
                  className="h-5 w-auto transition-all"
                />
                <span className="text-xs text-gray-600 font-medium">OpenAI</span>
              </div>
            </div>
            
            {/* Anthropic */}
            <div className="flex items-center opacity-80 hover:opacity-100 transition-opacity">
              <div className="flex items-center space-x-2">
                <img 
                  src="https://upload.wikimedia.org/wikipedia/commons/thumb/7/78/Anthropic_logo.svg/2560px-Anthropic_logo.svg.png" 
                  alt="Anthropic" 
                  className="h-4 w-auto transition-all"
                />
              </div>
            </div>
            
            {/* Neo4j */}
            <div className="flex items-center opacity-80 hover:opacity-100 transition-opacity">
              <div className="flex items-center space-x-2">
                <img 
                  src="/images/neo4j-logo.png" 
                  alt="Neo4j" 
                  className="h-12 w-auto transition-all"
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
                    className="h-4 w-auto"
                  />
                  <span className="text-xs text-gray-600 font-medium">Co-Scientist</span>
                </div>
                <span className="text-xs text-gray-500 font-medium italic">em breve</span>
              </div>
            </div> */}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default AdminFooter;