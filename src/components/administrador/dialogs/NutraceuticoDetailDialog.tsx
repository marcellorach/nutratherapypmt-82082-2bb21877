
import React, { useState } from 'react';
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Nutraceutical } from "@/types";
import { DialogHeader } from './nutraceutico/DialogHeader';
import { OverviewTab } from './nutraceutico/OverviewTab';
import { ScientificTab } from './nutraceutico/ScientificTab';
import { IngredientsTab } from './nutraceutico/IngredientsTab';
import { UsageTab } from './nutraceutico/UsageTab';
import { DialogFooter } from './nutraceutico/DialogFooter';
import { useTranslation } from 'react-i18next';

interface NutraceuticoDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  nutraceutical: Nutraceutical | null;
}

const NutraceuticoDetailDialog: React.FC<NutraceuticoDetailDialogProps> = ({
  open,
  onOpenChange,
  nutraceutical
}) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('overview');

  if (!nutraceutical) return null;

  const getEfficacyColor = (score: number) => {
    if (score >= 4) return "text-green-600 bg-green-50";
    if (score >= 3) return "text-amber-600 bg-amber-50"; 
    return "text-red-600 bg-red-50";
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader nutraceutical={nutraceutical} getEfficacyColor={getEfficacyColor} />
        
        <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab} className="mt-2">
          <TabsList className="grid grid-cols-4 mb-4">
            <TabsTrigger value="overview">{t('nutraceuticoDetailDialog.tabs.overview')}</TabsTrigger>
            <TabsTrigger value="scientific">{t('nutraceuticoDetailDialog.tabs.scientific')}</TabsTrigger>
            <TabsTrigger value="ingredients">{t('nutraceuticoDetailDialog.tabs.ingredients')}</TabsTrigger>
            <TabsTrigger value="usage">{t('nutraceuticoDetailDialog.tabs.usage')}</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview">
            <OverviewTab nutraceutical={nutraceutical} />
          </TabsContent>
          
          <TabsContent value="scientific">
            <ScientificTab nutraceutical={nutraceutical} />
          </TabsContent>
          
          <TabsContent value="ingredients">
            <IngredientsTab nutraceutical={nutraceutical} />
          </TabsContent>
          
          <TabsContent value="usage">
            <UsageTab nutraceutical={nutraceutical} />
          </TabsContent>
        </Tabs>
        
        <DialogFooter />
      </DialogContent>
    </Dialog>
  );
};

export default NutraceuticoDetailDialog;
