
import React from 'react';
import { SidebarInset } from "@/components/ui/sidebar";

interface AdminContentProps {
  children: React.ReactNode;
}

const AdminContent: React.FC<AdminContentProps> = ({ children }) => {
  return (
    <SidebarInset>
      <main className="flex-1 flex flex-col min-h-0">
        <div className="flex-1 overflow-auto p-6">
          {children}
        </div>
      </main>
    </SidebarInset>
  );
};

export default AdminContent;
