
import React from 'react';
import { NutraceuticalCondition, Nutraceutical } from "@/types";
import EfficacyOverTime from './charts/EfficacyOverTime';
import ComparativeEfficacy from './charts/ComparativeEfficacy';

interface EfficacyTabProps {
  selectedCondition: NutraceuticalCondition;
  nutraceutical: Nutraceutical;
}

const EfficacyTab: React.FC<EfficacyTabProps> = ({ selectedCondition, nutraceutical }) => {
  return (
    <div className="space-y-4">
      <EfficacyOverTime selectedCondition={selectedCondition} />
      <ComparativeEfficacy 
        selectedCondition={selectedCondition}
        nutraceutical={nutraceutical}
      />
    </div>
  );
};

export default EfficacyTab;
