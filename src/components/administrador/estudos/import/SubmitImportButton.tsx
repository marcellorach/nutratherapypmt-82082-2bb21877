
import React from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useTranslation } from 'react-i18next';

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
}) => {
  const { t } = useTranslation();

  return (
    <Button
      onClick={onClick}
      disabled={disabled}
      className="w-full md:w-auto"
    >
      {loading ? (
        <>
          <span>{t('submitImport.saving')}</span>
          <Progress value={progress} className="h-2 bg-muted mt-2 w-full" />
        </>
      ) : (
        <>{t('submitImport.saveImport')}</>
      )}
    </Button>
  );
};

export default SubmitImportButton;
