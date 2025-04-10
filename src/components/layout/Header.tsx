
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { PawPrint, User, Settings } from "lucide-react";

const Header: React.FC = () => {
  return (
    <header className="w-full bg-black text-white p-4 shadow-md">
      <div className="container mx-auto flex justify-between items-center">
        <Link to="/" className="text-xl font-semibold flex items-center gap-2">
          <PawPrint size={24} />
          <span>NutraTherapy PET</span>
        </Link>
        
        <nav className="hidden md:flex gap-6">
          <Link to="/veterinario" className="text-white hover:text-gray-200 transition-colors">
            Veterinário
          </Link>
          <Link to="/tutor" className="text-white hover:text-gray-200 transition-colors">
            Tutor
          </Link>
          <Link to="/administrador" className="text-white hover:text-gray-200 transition-colors">
            Administrador
          </Link>
        </nav>
        
        <div className="flex gap-2">
          <Button variant="outline" className="text-white border-white hover:bg-white hover:text-black">
            <User size={18} className="mr-1" />
            Login
          </Button>
          <Button variant="ghost" className="text-white">
            <Settings size={18} />
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Header;
