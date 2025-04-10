
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { PawPrint, User, UserCog } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const Header: React.FC = () => {
  return (
    <header className="w-full bg-black text-white p-4 border-b border-white/10">
      <div className="container mx-auto flex justify-between items-center">
        <Link to="/" className="text-xl font-semibold flex items-center gap-2">
          <div className="p-1.5 rounded-full border border-[#7E57C2]">
            <PawPrint size={24} className="text-[#7E57C2]" />
          </div>
          <span className="font-bold text-white">
            NutraTherapy <span className="text-[#7E57C2]">PET</span>
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
                  className="text-gray-400 hover:text-[#7E57C2] transition-colors mr-4"
                >
                  <UserCog size={20} />
                </Link>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs bg-black border border-white/20 text-white">
                <p>Gerencie o banco de dados de nutracêuticos, prompts da IA, correlações clínicas e atualize estudos científicos.</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <Button 
            variant="outline" 
            className="text-white border border-white/30 hover:bg-white/5 hover:border-[#7E57C2] hover:text-[#7E57C2]"
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
