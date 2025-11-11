import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useTranslation } from 'react-i18next';
import { Pet, generateTimelineData } from '@/utils/mockClinicalData';

interface ResponseTimelineProps {
  pets: Pet[];
}

const ResponseTimeline: React.FC<ResponseTimelineProps> = ({ pets }) => {
  const { t } = useTranslation();
  
  const timelineData = useMemo(() => generateTimelineData(pets), [pets]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{t('clinicalMonitoring.timeline.newPetsPerMonth')}</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={timelineData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="newPets" 
                stroke="hsl(var(--primary))" 
                strokeWidth={2}
                name={t('clinicalMonitoring.timeline.newPets')}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('clinicalMonitoring.timeline.responseRates')}</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={timelineData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="significantResponse" 
                stroke="#22c55e" 
                strokeWidth={2}
                name={t('clinicalMonitoring.status.significant')}
              />
              <Line 
                type="monotone" 
                dataKey="mildResponse" 
                stroke="#eab308" 
                strokeWidth={2}
                name={t('clinicalMonitoring.status.mild')}
              />
              <Line 
                type="monotone" 
                dataKey="noResponse" 
                stroke="#ef4444" 
                strokeWidth={2}
                name={t('clinicalMonitoring.status.none')}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('clinicalMonitoring.timeline.dropoutRate')}</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={timelineData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="dropouts" 
                stroke="#6366f1" 
                strokeWidth={2}
                name={t('clinicalMonitoring.timeline.dropouts')}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};

export default ResponseTimeline;
