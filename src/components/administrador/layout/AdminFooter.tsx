import React from 'react';
import Footer from '@/components/layout/Footer';

// AdminFooter agora reflete o mesmo Footer da landing (versão Senex auto-lida,
// copyright bilíngue, badge "Veterinary Geroscience", powered-by completo).
// Mantemos o wrapper `mt-auto` para preservar o layout sticky em AdminContent.
const AdminFooter: React.FC = () => {
  return (
    <div className="mt-auto">
      <Footer />
    </div>
  );
};

export default AdminFooter;