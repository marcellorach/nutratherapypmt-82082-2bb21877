
import React from 'react';
import Layout from "@/components/layout/Layout";
import AdminSidebar from './sidebar/AdminSidebar';
import AdminContainer from './layout/AdminContainer';
import AdminContent from './layout/AdminContent';

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
      <AdminContainer>
        <AdminSidebar 
          currentStep={currentStep} 
          setCurrentStep={setCurrentStep} 
        />
        <AdminContent>
          {children}
        </AdminContent>
      </AdminContainer>
    </Layout>
  );
};

export default AdminLayout;
