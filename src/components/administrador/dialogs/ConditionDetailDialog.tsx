
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Lightbulb } from "lucide-react";
import { Nutraceutical, NutraceuticalCondition } from "@/types";
import { getEfficacyColor, getConditionTypeTitle } from './condition/utils';
import OverviewTab from './condition/OverviewTab';
import EfficacyTab from './condition/EfficacyTab';
import StudiesTab from './condition/StudiesTab';
import ApplicationsTab from './condition/ApplicationsTab';

interface ConditionDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  nutraceutical: Nutraceutical | null;
  selectedCondition: NutraceuticalCondition | null;
  conditionType: 'prevention' | 'treatment' | 'support' | null;
}

const ConditionDetailDialog: React.FC<ConditionDetailDialogProps> = ({
  open,
  onOpenChange,
  nutraceutical,
  selectedCondition,
  conditionType
}) => {
  const [activeTab, setActiveTab] = useState('overview');

  if (!nutraceutical || !selectedCondition || !conditionType) return null;
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Cabeçalho */}
        <div className="border-b pb-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium leading-none">
              {nutraceutical.name}
            </h2>
            <Badge className={`${getEfficacyColor(selectedCondition.efficacyScore)} px-2 py-1`}>
              {getConditionTypeTitle(conditionType)}: {selectedCondition.efficacyScore.toFixed(1)}/5
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            {nutraceutical.description}
          </p>
          <div className="flex items-center mt-3 space-x-2">
            <Badge variant="outline" className="bg-slate-50">
              {selectedCondition.name}
            </Badge>
          </div>
        </div>
        
        <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab} className="mt-2">
          <TabsList className="grid grid-cols-4 mb-4">
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="efficacy">Eficácia</TabsTrigger>
            <TabsTrigger value="studies">Estudos Científicos</TabsTrigger>
            <TabsTrigger value="applications">Aplicações</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview">
            <OverviewTab
              nutraceutical={nutraceutical}
              selectedCondition={selectedCondition}
              conditionType={conditionType}
            />
          </TabsContent>
          
          <TabsContent value="efficacy">
            <EfficacyTab
              selectedCondition={selectedCondition}
              nutraceutical={nutraceutical}
            />
          </TabsContent>
          
          <TabsContent value="studies">
            <StudiesTab
              selectedCondition={selectedCondition}
              nutraceutical={nutraceutical}
            />
          </TabsContent>
          
          <TabsContent value="applications">
            <ApplicationsTab
              selectedCondition={selectedCondition}
              nutraceutical={nutraceutical}
              conditionType={conditionType}
            />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default ConditionDetailDialog;
