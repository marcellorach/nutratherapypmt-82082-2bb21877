
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { PawPrint, User, UserCog } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const Header: React.FC = () => {
  return (
    <header className="w-full bg-black text-white p-4 shadow-md">
      <div className="container mx-auto flex justify-between items-center">
        <Link to="/" className="text-xl font-semibold flex items-center gap-2">
          <div className="bg-gradient-to-r from-[#7E57C2] to-[#FF719A] p-1.5 rounded-full">
            <PawPrint size={24} className="text-white" />
          </div>
          <span className="bg-gradient-to-r from-[#7E57C2] to-[#FF719A] bg-clip-text text-transparent font-bold">
            NutraTherapy PET
          </span>
        </Link>
        
        <nav className="hidden md:flex gap-6">
          <Link to="/veterinario" className="text-white hover:text-[#7E57C2] transition-colors">
            Veterinário
          </Link>
          <Link to="/tutor" className="text-white hover:text-[#FF719A] transition-colors">
            Tutor
          </Link>
        </nav>
        
        <div className="flex gap-2 items-center">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Link 
                  to="/administrador" 
                  className="text-gray-300 hover:text-[#7E57C2] transition-colors mr-4"
                >
                  <UserCog size={20} />
                </Link>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p>Gerencie o banco de dados de nutracêuticos, prompts da IA, correlações clínicas e atualize estudos científicos.</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <Button 
            variant="outline" 
            className="text-white border-white hover:bg-gradient-to-r hover:from-[#7E57C2] hover:to-[#FF719A] hover:border-transparent"
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
