
import React from 'react';

interface AdminContentProps {
  children: React.ReactNode;
}

const AdminContent: React.FC<AdminContentProps> = ({ children }) => {
  return (
    <div className="flex-1 overflow-auto p-6 pl-8 pr-12 mt-24">
      {children}
    </div>
  );
};

export default AdminContent;
