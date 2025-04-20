
import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-50 text-gray-700 p-4 text-center text-sm border-t border-gray-200">
      NutraTherapy PET © {new Date().getFullYear()} - Sistema inteligente de recomendação de nutracêuticos para pets
    </footer>
  );
};

export default Footer;
