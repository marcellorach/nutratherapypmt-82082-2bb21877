
import React from 'react';
import Layout from '@/components/layout/Layout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AdminHeader from '@/components/administrador/AdminHeader';
import NutraceuticosTab from '@/components/administrador/NutraceuticosTab';
import EstudosTab from '@/components/administrador/EstudosTab';
import PromptsTab from '@/components/administrador/PromptsTab';
import AnalyticsTab from '@/components/administrador/AnalyticsTab';

const AdministradorPage: React.FC = () => {
  return (
    <Layout>
      <div className="container mx-auto py-6 px-4">
        <AdminHeader />
        
        <Tabs defaultValue="nutraceuticos" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="nutraceuticos">Nutracêuticos</TabsTrigger>
            <TabsTrigger value="estudos">Estudos Científicos</TabsTrigger>
            <TabsTrigger value="prompts">Prompts da IA</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>
          
          <TabsContent value="nutraceuticos">
            <NutraceuticosTab />
          </TabsContent>
          
          <TabsContent value="estudos">
            <EstudosTab />
          </TabsContent>
          
          <TabsContent value="prompts">
            <PromptsTab />
          </TabsContent>
          
          <TabsContent value="analytics">
            <AnalyticsTab />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default AdministradorPage;
