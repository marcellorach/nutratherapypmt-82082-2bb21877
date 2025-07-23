
import React from 'react';

interface AdminContainerProps {
  children: React.ReactNode;
}

const AdminContainer: React.FC<AdminContainerProps> = ({ children }) => {
  return (
    <div className="flex min-h-[calc(100vh-6rem)] w-full max-w-full overflow-hidden bg-gray-50">
      {children}
    </div>
  );
};

export default AdminContainer;
