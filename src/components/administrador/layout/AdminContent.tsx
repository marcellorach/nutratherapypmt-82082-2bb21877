
import React from 'react';

interface AdminContentProps {
  children: React.ReactNode;
}

const AdminContent: React.FC<AdminContentProps> = ({ children }) => {
  return (
    <main className="flex-1 overflow-auto bg-white">
      <div className="p-6">
        {children}
      </div>
    </main>
  );
};

export default AdminContent;
