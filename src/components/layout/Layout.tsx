
import React from 'react';
import Header from './Header';
import Footer from './Footer';

interface LayoutProps {
  children: React.ReactNode;
  hideFooter?: boolean;
}

const Layout: React.FC<LayoutProps> = ({ children, hideFooter = false }) => {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50 overflow-x-hidden max-w-[100vw] w-full">
      <Header />
      <main className="flex-grow mt-24 overflow-x-hidden"> {/* Increased from mt-20 to mt-24 to account for header padding */}
        {children}
      </main>
      {!hideFooter && <Footer />}
    </div>
  );
};

export default Layout;
