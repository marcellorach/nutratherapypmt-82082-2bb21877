import React from 'react';
import { AlertTriangle, Info } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useTranslation } from 'react-i18next';

interface WarningsAlertProps {
  warnings: string[];
  showIfEmpty?: boolean;
  title?: string;
  variant?: 'default' | 'destructive' | 'info' | 'warning' | 'success';
  icon?: React.ReactNode;
}

const WarningsAlert: React.FC<WarningsAlertProps> = ({ 
  warnings, 
  showIfEmpty = false,
  title,
  variant = "warning",
  icon = <AlertTriangle className="h-4 w-4" />
}) => {
  const { t } = useTranslation();
  
  if (!warnings || (warnings.length === 0 && !showIfEmpty)) return null;

  const getVariantClasses = () => {
    switch (variant) {
      case 'destructive':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'success':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'info':
        return 'bg-blue-50 border-blue-200 text-blue-800';
      case 'warning':
      default:
        return 'bg-amber-50 border-amber-200 text-amber-800';
    }
  };

  const getIconComponent = () => {
    if (icon) return icon;
    if (variant === 'info') return <Info className="h-4 w-4" />;
    return <AlertTriangle className="h-4 w-4" />;
  };

  const displayTitle = title || t('import.results.warnings.title');

  return (
    <Alert className={`${getVariantClasses()} border`}>
      <div className="flex items-center gap-2">
        {getIconComponent()}
        <AlertTitle className="font-medium">{displayTitle}</AlertTitle>
      </div>
      <AlertDescription className="mt-3">
        {warnings.length > 0 ? (
          <ul className="list-disc ml-5 space-y-1">
            {warnings.map((warning, index) => (
              <li key={index} className="text-sm">{warning}</li>
            ))}
          </ul>
        ) : (
          <p className="text-sm">{t('import.results.warnings.noWarnings')}</p>
        )}
      </AlertDescription>
    </Alert>
  );
};

export default WarningsAlert;
