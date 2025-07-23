
import React from 'react';
import { SidebarInset } from "@/components/ui/sidebar";

interface AdminContentProps {
  children: React.ReactNode;
}

const AdminContent = ({ children }: AdminContentProps) => {
  return (
    <SidebarInset className="flex-1 min-w-0">
      <main className="flex flex-col min-h-0 w-full max-w-full">
        <div className="flex-1 overflow-hidden p-6 w-full max-w-full">
          <div className="w-full max-w-full overflow-x-auto">
            <div className="min-w-0 w-full">
              {children}
            </div>
          </div>
        </div>
      </main>
    </SidebarInset>
  );
};

export default AdminContent;
