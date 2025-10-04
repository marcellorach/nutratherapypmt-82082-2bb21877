
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Info } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const EvidenceLegendPanel = () => {
  const { t } = useTranslation();
  
  return (
    <Card className="mb-4 bg-slate-50">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <Info className="h-5 w-5 text-blue-600 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-medium text-sm mb-3">{t('nutraceuticals.legend.title')}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium text-sm mb-2">{t('nutraceuticals.legend.convergence.title')}</h4>
                <div className="flex flex-wrap gap-2 text-xs">
                  <Badge className="bg-green-100 text-green-800">{t('nutraceuticals.legend.convergence.high')}</Badge>
                  <Badge className="bg-amber-100 text-amber-800">{t('nutraceuticals.legend.convergence.moderate')}</Badge>
                  <Badge className="bg-red-100 text-red-800">{t('nutraceuticals.legend.convergence.low')}</Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {t('nutraceuticals.legend.convergence.description')}
                </p>
              </div>
              
              <div>
                <h4 className="font-medium text-sm mb-2">{t('nutraceuticals.legend.efficacy.title')}</h4>
                <div className="flex flex-wrap gap-2 text-xs">
                  <Badge className="bg-green-100 text-green-800">{t('nutraceuticals.legend.efficacy.high')}</Badge>
                  <Badge className="bg-amber-100 text-amber-800">{t('nutraceuticals.legend.efficacy.moderate')}</Badge>
                  <Badge className="bg-red-100 text-red-800">{t('nutraceuticals.legend.efficacy.low')}</Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {t('nutraceuticals.legend.efficacy.description')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default EvidenceLegendPanel;
