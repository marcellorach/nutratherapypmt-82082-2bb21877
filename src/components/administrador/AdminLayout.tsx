
import React from 'react';
import Layout from "@/components/layout/Layout";
import AdminSidebar from './sidebar/AdminSidebar';
import AdminContainer from './layout/AdminContainer';
import AdminContent from './layout/AdminContent';
import { SidebarProvider } from "@/components/ui/sidebar";

interface AdminLayoutProps {
  children: React.ReactNode;
  currentStep: string;
  setCurrentStep: (step: string) => void;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ 
  children, 
  currentStep, 
  setCurrentStep 
}) => {
  return (
    <Layout>
      <SidebarProvider 
        defaultOpen={true}
        style={{
          "--sidebar-width": "280px",
          "--sidebar-width-icon": "56px",
        } as React.CSSProperties}
      >
        <AdminContainer>
          <AdminSidebar 
            currentStep={currentStep} 
            setCurrentStep={setCurrentStep} 
          />
          <AdminContent>
            {children}
          </AdminContent>
        </AdminContainer>
      </SidebarProvider>
    </Layout>
  );
};

export default AdminLayout;
