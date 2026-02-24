
import React from 'react';
import { ChartContainer } from "@/components/ui/chart";
import { LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Line } from 'recharts';
import { generateEfficacyOverTimeData } from '../utils';
import { NutraceuticalCondition } from "@/types";
import { useTranslation } from 'react-i18next';

interface EfficacyOverTimeProps {
  selectedCondition: NutraceuticalCondition;
}

const EfficacyOverTime: React.FC<EfficacyOverTimeProps> = ({ selectedCondition }) => {
  const { t } = useTranslation();
  const efficacyOverTimeData = generateEfficacyOverTimeData(selectedCondition.efficacyScore);

  return (
    <div>
      <h4 className="text-sm font-medium mb-2">{t('efficacyOverTime.title')}</h4>
      <p className="text-xs text-muted-foreground mb-2">
        {t('efficacyOverTime.description', { name: selectedCondition.name })}
      </p>
      <div className="h-64 w-full">
        <ChartContainer config={{
          efficacy: { color: "#9b87f5" }
        }}>
          <LineChart
            data={efficacyOverTimeData}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis domain={[0, 5]} />
            <Tooltip />
            <Line 
              type="monotone" 
              dataKey="eficácia" 
              stroke="#9b87f5" 
              activeDot={{ r: 8 }} 
            />
          </LineChart>
        </ChartContainer>
      </div>
    </div>
  );
};

export default EfficacyOverTime;
