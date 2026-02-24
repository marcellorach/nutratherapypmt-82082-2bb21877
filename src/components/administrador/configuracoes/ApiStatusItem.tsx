import React from 'react';
import { useTranslation } from 'react-i18next';

interface ApiStatusItemProps {
  service: string;
  isConfigured: boolean;
  icon: string;
  description?: string;
}

const ApiStatusItem: React.FC<ApiStatusItemProps> = ({ 
  service, 
  isConfigured, 
  icon, 
  description 
}) => {
  const { t } = useTranslation();
  
  return (
    <div className="flex items-center justify-between p-3 border border-border rounded-lg bg-card">
      <div className="flex items-center gap-3">
        <span className="text-2xl">{icon}</span>
        <div>
          <p className="font-medium text-foreground">{service}</p>
          {description && (
            <p className="text-xs text-muted-foreground">{description}</p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2">
        {isConfigured ? (
          <>
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-sm text-green-600 dark:text-green-400 font-medium">{t('apiStatus.configured')}</span>
          </>
        ) : (
          <>
            <div className="w-2 h-2 bg-muted rounded-full" />
            <span className="text-sm text-muted-foreground">{t('apiStatus.notConfigured')}</span>
          </>
        )}
      </div>
    </div>
  );
};

export default ApiStatusItem;
