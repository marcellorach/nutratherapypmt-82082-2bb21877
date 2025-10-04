import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer } from "@/components/ui/chart";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TreePine, Users, TrendingUp, AlertTriangle } from "lucide-react";
import { useTranslation } from 'react-i18next';

interface EpidemiologyData {
  totalCases: number;
  geneticOnly: number;
  geneticEnvironmental: number;
  environmentalOnly: number;
  severityDistribution: {
    asymptomatic: number;
    mild: number;
    moderate: number;
    severe: number;
  };
  comorbidities: {
    none: number;
    one: number;
    multiple: number;
  };
}

interface EpidemiologicalTreeProps {
  condition: any;
  data: EpidemiologyData;
}

const COLORS = {
  origin: ['hsl(var(--primary))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))'],
  severity: ['hsl(var(--chart-4))', 'hsl(var(--chart-5))', 'hsl(var(--muted-foreground))', 'hsl(var(--destructive))'],
  comorbidities: ['hsl(var(--success))', 'hsl(var(--warning))', 'hsl(var(--destructive))']
};

const EpidemiologicalTree: React.FC<EpidemiologicalTreeProps> = ({ condition, data }) => {
  const { t } = useTranslation();
  const [selectedView, setSelectedView] = useState<'origin' | 'severity' | 'comorbidities'>('origin');

  // Dados para gráfico de pizza - Origem
  const originData = [
    { name: t('visualization.detailedAnalysis.epidemiology.genetic'), value: data.geneticOnly, percentage: data.geneticOnly },
    { name: t('visualization.detailedAnalysis.epidemiology.geneticEnvironmental'), value: data.geneticEnvironmental, percentage: data.geneticEnvironmental },
    { name: t('visualization.detailedAnalysis.epidemiology.environmental'), value: data.environmentalOnly, percentage: data.environmentalOnly }
  ];

  // Dados para gráfico de barras - Severidade por origem
  const severityByOriginData = [
    {
      origin: t('visualization.detailedAnalysis.epidemiology.genetic'),
      [t('visualization.detailedAnalysis.epidemiology.asymptomatic')]: Math.round(data.severityDistribution.asymptomatic * 0.4),
      [t('visualization.detailedAnalysis.epidemiology.mild')]: Math.round(data.severityDistribution.mild * 0.3),
      [t('visualization.detailedAnalysis.epidemiology.moderate')]: Math.round(data.severityDistribution.moderate * 0.5),
      [t('visualization.detailedAnalysis.epidemiology.severe')]: Math.round(data.severityDistribution.severe * 0.7)
    },
    {
      origin: 'Gen. + Amb.',
      [t('visualization.detailedAnalysis.epidemiology.asymptomatic')]: Math.round(data.severityDistribution.asymptomatic * 0.35),
      [t('visualization.detailedAnalysis.epidemiology.mild')]: Math.round(data.severityDistribution.mild * 0.4),
      [t('visualization.detailedAnalysis.epidemiology.moderate')]: Math.round(data.severityDistribution.moderate * 0.35),
      [t('visualization.detailedAnalysis.epidemiology.severe')]: Math.round(data.severityDistribution.severe * 0.2)
    },
    {
      origin: t('visualization.detailedAnalysis.epidemiology.environmental'),
      [t('visualization.detailedAnalysis.epidemiology.asymptomatic')]: Math.round(data.severityDistribution.asymptomatic * 0.25),
      [t('visualization.detailedAnalysis.epidemiology.mild')]: Math.round(data.severityDistribution.mild * 0.3),
      [t('visualization.detailedAnalysis.epidemiology.moderate')]: Math.round(data.severityDistribution.moderate * 0.15),
      [t('visualization.detailedAnalysis.epidemiology.severe')]: Math.round(data.severityDistribution.severe * 0.1)
    }
  ];

  // Dados para comorbidades
  const comorbiditiesData = [
    { name: t('visualization.detailedAnalysis.epidemiology.noComorbidities'), value: data.comorbidities.none },
    { name: t('visualization.detailedAnalysis.epidemiology.oneComorbidity'), value: data.comorbidities.one },
    { name: t('visualization.detailedAnalysis.epidemiology.multipleComorbidities'), value: data.comorbidities.multiple }
  ];

  const getCurrentData = () => {
    switch (selectedView) {
      case 'origin': return originData;
      case 'severity': return Object.entries(data.severityDistribution).map(([key, value]) => ({
        name: key === 'asymptomatic' ? t('visualization.detailedAnalysis.epidemiology.asymptomatic') : 
              key === 'mild' ? t('visualization.detailedAnalysis.epidemiology.mild') : 
              key === 'moderate' ? t('visualization.detailedAnalysis.epidemiology.moderate') : t('visualization.detailedAnalysis.epidemiology.severe'),
        value
      }));
      case 'comorbidities': return comorbiditiesData;
      default: return originData;
    }
  };

  const getCurrentColors = () => {
    switch (selectedView) {
      case 'origin': return COLORS.origin;
      case 'severity': return COLORS.severity;
      case 'comorbidities': return COLORS.comorbidities;
      default: return COLORS.origin;
    }
  };

  return (
    <div className="space-y-6">
      {/* Cabeçalho com estatísticas principais */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">{t('visualization.detailedAnalysis.epidemiology.totalCases')}</p>
                <p className="text-2xl font-bold">{data.totalCases}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TreePine className="h-5 w-5 text-chart-2" />
              <div>
                <p className="text-sm text-muted-foreground">{t('visualization.detailedAnalysis.epidemiology.geneticFactor')}</p>
                <p className="text-2xl font-bold">{data.geneticOnly + data.geneticEnvironmental}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-success" />
              <div>
                <p className="text-sm text-muted-foreground">{t('visualization.detailedAnalysis.epidemiology.mildAsymptomatic')}</p>
                <p className="text-2xl font-bold">{data.severityDistribution.asymptomatic + data.severityDistribution.mild}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              <div>
                <p className="text-sm text-muted-foreground">{t('visualization.detailedAnalysis.epidemiology.withComorbidities')}</p>
                <p className="text-2xl font-bold">{data.comorbidities.one + data.comorbidities.multiple}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Controles de visualização */}
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">{t('visualization.detailedAnalysis.epidemiology.viewBy')}</span>
        <Button 
          variant={selectedView === 'origin' ? 'default' : 'outline'} 
          size="sm"
          onClick={() => setSelectedView('origin')}
        >
          {t('visualization.detailedAnalysis.epidemiology.origin')}
        </Button>
        <Button 
          variant={selectedView === 'severity' ? 'default' : 'outline'} 
          size="sm"
          onClick={() => setSelectedView('severity')}
        >
          {t('visualization.detailedAnalysis.epidemiology.severity')}
        </Button>
        <Button 
          variant={selectedView === 'comorbidities' ? 'default' : 'outline'} 
          size="sm"
          onClick={() => setSelectedView('comorbidities')}
        >
          {t('visualization.detailedAnalysis.epidemiology.comorbidities')}
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Gráfico de Pizza */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              Distribuição por {selectedView === 'origin' ? 'Origem' : 
                                selectedView === 'severity' ? 'Severidade' : 'Comorbidades'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ChartContainer config={{}}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={getCurrentData()}
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}%`}
                    >
                      {getCurrentData().map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={getCurrentColors()[index % getCurrentColors().length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </ChartContainer>
            </div>
          </CardContent>
        </Card>

        {/* Gráfico de Barras - Severidade por Origem */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Severidade por Origem Etiológica</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ChartContainer config={{}}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={severityByOriginData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="origin" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="Assintomático" fill={COLORS.severity[0]} />
                    <Bar dataKey="Leve" fill={COLORS.severity[1]} />
                    <Bar dataKey="Moderado" fill={COLORS.severity[2]} />
                    <Bar dataKey="Grave" fill={COLORS.severity[3]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Análise Detalhada */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Análise Estratificada</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-3">
              <h4 className="font-semibold text-primary">Origem Genética</h4>
              <p className="text-sm text-muted-foreground">
                {data.geneticOnly}% dos casos são puramente genéticos, com maior predisposição em:
              </p>
              <div className="space-y-1">
                {condition.name.toLowerCase().includes('obesidade') ? (
                  <>
                    <Badge variant="outline" className="mr-1">Labrador</Badge>
                    <Badge variant="outline" className="mr-1">Beagle</Badge>
                    <Badge variant="outline">Pug</Badge>
                  </>
                ) : (
                  condition.breedsAffected.slice(0, 3).map((breed, index) => (
                    <Badge key={index} variant="outline" className="mr-1">{breed}</Badge>
                  ))
                )}
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-semibold text-chart-2">Origem Mista</h4>
              <p className="text-sm text-muted-foreground">
                {data.geneticEnvironmental}% apresentam fatores genéticos + ambientais. Maior responsividade ao tratamento nutracêutico.
              </p>
              <Badge variant="secondary">Alta responsividade</Badge>
            </div>

            <div className="space-y-3">
              <h4 className="font-semibold text-chart-3">Origem Ambiental</h4>
              <p className="text-sm text-muted-foreground">
                {data.environmentalOnly}% são puramente ambientais. Excelente prognóstico com intervenção nutracêutica.
              </p>
              <Badge variant="default">Excelente prognóstico</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EpidemiologicalTree;