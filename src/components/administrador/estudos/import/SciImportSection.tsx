
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import FileUploadTab from './FileUploadTab';
import PdfStudiesUploadSection from './PdfStudiesUploadSection';

const SciImportSection: React.FC = () => {
  const [activeTab, setActiveTab] = useState('files');
  
  return (
    <Card>
      <Tabs className="w-full" value={activeTab} onValueChange={setActiveTab}>
        <div className="border-b px-6 py-3">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="files">Upload de Arquivos</TabsTrigger>
            <TabsTrigger value="pdf">Estudos Científicos PDF</TabsTrigger>
          </TabsList>
        </div>
        
        <div className="p-6">
          <TabsContent value="files" className="mt-0">
            <FileUploadTab />
          </TabsContent>
          
          <TabsContent value="pdf" className="mt-0">
            <PdfStudiesUploadSection />
          </TabsContent>
        </div>
      </Tabs>
    </Card>
  );
};

export default SciImportSection;
