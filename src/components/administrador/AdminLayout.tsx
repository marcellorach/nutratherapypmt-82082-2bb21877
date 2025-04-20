
import React from 'react';
import Layout from "@/components/layout/Layout";
import { SidebarProvider } from "@/components/ui/sidebar";
import AdminSidebar from './sidebar/AdminSidebar';

interface AdminLayoutProps {
  children: React.ReactNode;
  currentStep: string;
  setCurrentStep: (step: string) => void;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children, currentStep, setCurrentStep }) => {
  return (
    <Layout>
      <div className="container mx-auto p-0">
        <SidebarProvider defaultOpen={true}>
          <div className="flex min-h-[calc(100vh-6rem)] w-full">
            <AdminSidebar currentStep={currentStep} setCurrentStep={setCurrentStep} />
            <div className="flex-1 overflow-auto p-6 pl-8 pr-12 mt-24"> {/* Increased padding, added top margin */}
              {children}
            </div>
          </div>
        </SidebarProvider>
      </div>
    </Layout>
  );
};

export default AdminLayout;
