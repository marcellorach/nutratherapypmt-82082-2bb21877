
import React from 'react';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Microscope } from "lucide-react";

const SciSpaceHeader: React.FC = () => {
  return (
    <Alert>
      <Microscope className="h-4 w-4" />
      <AlertDescription>
        Configure a integração com o SciSpace para pesquisa científica.
      </AlertDescription>
    </Alert>
  );
};

export default SciSpaceHeader;
