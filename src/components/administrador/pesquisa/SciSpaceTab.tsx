
import React from 'react';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Microscope } from "lucide-react";
import { Card } from "@/components/ui/card";

const SciSpaceTab: React.FC = () => {
  return (
    <div className="space-y-4">
      <Alert>
        <Microscope className="h-4 w-4" />
        <AlertDescription>
          Você está acessando o SciSpace, uma plataforma externa para pesquisa científica.
        </AlertDescription>
      </Alert>

      <Card className="w-full">
        <iframe 
          src="https://scispace.com"
          className="w-full h-[calc(100vh-16rem)] border-none"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
          title="SciSpace Platform"
        />
      </Card>
    </div>
  );
};

export default SciSpaceTab;
