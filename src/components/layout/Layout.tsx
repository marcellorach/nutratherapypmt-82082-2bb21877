
import React from 'react';
import Header from './Header';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header />
      <main className="flex-grow mt-20"> {/* Added top margin to account for fixed header */}
        {children}
      </main>
      <footer className="bg-gray-50 text-gray-700 p-4 text-center text-sm border-t border-gray-200">
        NutraTherapy PET © {new Date().getFullYear()} - Sistema inteligente de recomendação de nutracêuticos para pets
      </footer>
    </div>
  );
};

export default Layout;

