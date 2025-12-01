
import React from 'react';
import { SidebarInset } from "@/components/ui/sidebar";
import AdminFooter from './AdminFooter';

interface AdminContentProps {
  children: React.ReactNode;
}

const AdminContent = ({ children }: AdminContentProps) => {
  return (
    <SidebarInset className="flex-1 min-w-0 flex flex-col overflow-hidden">
      <main className="flex-1 flex flex-col min-h-0 w-full overflow-hidden">
        <div className="flex-1 p-6 w-full overflow-y-auto overflow-x-hidden">
          <div className="w-full">
            {children}
          </div>
        </div>
      </main>
      <AdminFooter />
    </SidebarInset>
  );
};

export default AdminContent;
