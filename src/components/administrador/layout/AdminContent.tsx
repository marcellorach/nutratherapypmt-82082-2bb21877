
import React from 'react';
import { SidebarInset } from "@/components/ui/sidebar";

interface AdminContentProps {
  children: React.ReactNode;
}

const AdminContent = ({ children }: AdminContentProps) => {
  return (
    <SidebarInset className="flex-1 min-w-0">
      <main className="flex-1 flex flex-col min-h-0 w-full overflow-x-auto">
        <div className="flex-1 p-6 w-full max-w-full">
          <div className="w-full max-w-full overflow-x-hidden">
            {children}
          </div>
        </div>
      </main>
    </SidebarInset>
  );
};

export default AdminContent;
