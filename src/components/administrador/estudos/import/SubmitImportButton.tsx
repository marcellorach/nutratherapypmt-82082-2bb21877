
import React from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

interface SubmitImportButtonProps {
  onClick: () => void;
  disabled: boolean;
  loading: boolean;
  progress: number;
  label?: string;
}

const SubmitImportButton: React.FC<SubmitImportButtonProps> = ({
  onClick,
  disabled,
  loading,
  progress,
  label = "Salvar Importação"
}) => (
  <Button
    onClick={onClick}
    disabled={disabled || loading}
    className="w-full md:w-auto"
  >
    {loading ? (
      <div className="w-full">
        <span>Salvando...</span>
        <Progress value={progress} className="h-2 bg-gray-100 mt-2 w-full" />
      </div>
    ) : (
      <>{label}</>
    )}
  </Button>
);

export default SubmitImportButton;
