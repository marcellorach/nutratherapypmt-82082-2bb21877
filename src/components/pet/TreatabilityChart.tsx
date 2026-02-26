import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp } from 'lucide-react';

interface TreatabilityData {
  condition: string;
  scientificEvidence: number; // 0-100
  planExperience: number;     // 0-100
}

interface TreatabilityChartProps {
  data: TreatabilityData[];
}

const TreatabilityChart: React.FC<TreatabilityChartProps> = ({ data }) => {
  const { t } = useTranslation();

  if (data.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <TrendingUp className="h-4 w-4" />
          {t('petProfile.treatability.title')}
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          {t('petProfile.treatability.description')}
        </p>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={Math.max(180, data.length * 60)}>
          <BarChart data={data} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} opacity={0.3} />
            <XAxis type="number" domain={[0, 100]} tickFormatter={(v) => `${v}%`} fontSize={11} />
            <YAxis 
              type="category" 
              dataKey="condition" 
              width={120} 
              fontSize={11} 
              tick={{ fill: 'hsl(var(--foreground))' }}
            />
            <Tooltip
              formatter={(value: number, name: string) => [`${value}%`, name]}
              contentStyle={{ 
                fontSize: 12, 
                borderRadius: 8,
                background: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                color: 'hsl(var(--foreground))'
              }}
            />
            <Legend fontSize={11} />
            <Bar 
              dataKey="scientificEvidence" 
              name={t('petProfile.treatability.scientificEvidence')} 
              fill="hsl(142, 71%, 45%)"
              radius={[0, 4, 4, 0]}
              barSize={14}
            />
            <Bar 
              dataKey="planExperience" 
              name={t('petProfile.treatability.planExperience')} 
              fill="hsl(217, 91%, 60%)"
              radius={[0, 4, 4, 0]}
              barSize={14}
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default TreatabilityChart;
