
import React from 'react';
import Layout from "@/components/layout/Layout";
import AdminSidebar from './sidebar/AdminSidebar';
import AdminContainer from './layout/AdminContainer';
import AdminContent from './layout/AdminContent';
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";

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
    <Layout hideFooter={true}>
      <SidebarProvider defaultOpen={true} className="w-full max-w-full overflow-hidden">
        <div className="flex w-full max-w-full overflow-hidden">
          <AdminContainer>
            <AdminSidebar 
              currentStep={currentStep} 
              setCurrentStep={setCurrentStep} 
            />
            <AdminContent>
              {children}
            </AdminContent>
          </AdminContainer>
        </div>
      </SidebarProvider>
    </Layout>
  );
};

export default AdminLayout;
