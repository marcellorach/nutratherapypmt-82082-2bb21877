
import React from 'react';
import { SidebarProvider } from "@/components/ui/sidebar";

interface AdminContainerProps {
  children: React.ReactNode;
}

const AdminContainer: React.FC<AdminContainerProps> = ({ children }) => {
  return (
    <div className="container mx-auto p-0">
      <SidebarProvider defaultOpen={true}>
        <div className="flex min-h-[calc(100vh-6rem)] w-full">
          {children}
        </div>
      </SidebarProvider>
    </div>
  );
};

export default AdminContainer;
