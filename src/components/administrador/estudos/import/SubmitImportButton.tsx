
import React from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

interface SubmitImportButtonProps {
  onClick: () => void;
  disabled: boolean;
  loading: boolean;
  progress: number;
}

const SubmitImportButton: React.FC<SubmitImportButtonProps> = ({
  onClick,
  disabled,
  loading,
  progress,
}) => (
  <Button
    onClick={onClick}
    disabled={disabled}
    className="w-full md:w-auto"
  >
    {loading ? (
      <>
        <span>Salvando...</span>
        <Progress value={progress} className="h-2 bg-gray-100 mt-2 w-full" />
      </>
    ) : (
      <>Salvar Importação</>
    )}
  </Button>
);

export default SubmitImportButton;
