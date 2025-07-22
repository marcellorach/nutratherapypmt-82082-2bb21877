
import React from 'react';

interface AdminContainerProps {
  children: React.ReactNode;
}

const AdminContainer: React.FC<AdminContainerProps> = ({ children }) => {
  return (
    <div className="flex h-full w-full bg-gray-50">
      {children}
    </div>
  );
};

export default AdminContainer;
