
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { PawPrint, User, UserCog } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const Header: React.FC = () => {
  return (
    <header className="w-full bg-white text-gray-800 p-4 border-b border-gray-200 shadow-sm">
      <div className="container mx-auto flex justify-between items-center">
        <Link to="/" className="text-xl font-semibold flex items-center gap-2">
          <div className="p-1.5 rounded-full border border-gray-400">
            <PawPrint size={24} className="text-gray-800" />
          </div>
          <span className="font-bold text-gray-800">
            NutraTherapy <span className="text-gray-600">PET</span>
          </span>
        </Link>
        
        <nav className="hidden md:flex gap-6">
          <Link to="/veterinario" className="text-gray-700 hover:text-gray-900 transition-colors">
            Veterinário
          </Link>
          <Link to="/tutor" className="text-gray-700 hover:text-gray-900 transition-colors">
            Tutor
          </Link>
        </nav>
        
        <div className="flex gap-2 items-center">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Link 
                  to="/administrador" 
                  className="text-gray-500 hover:text-gray-700 transition-colors mr-4"
                >
                  <UserCog size={20} />
                </Link>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs bg-white border border-gray-200 text-gray-800">
                <p>Gerencie o banco de dados de nutracêuticos, prompts da IA, correlações clínicas e atualize estudos científicos.</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <Button 
            variant="outline" 
            className="text-gray-800 border border-gray-300 hover:bg-gray-100 hover:border-gray-400"
          >
            <User size={18} className="mr-1" />
            Login
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Header;
