import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield, Zap, Clock, AlertCircle } from "lucide-react";

interface NutraceuticalData {
  name: string;
  prevention: { score: number; dosage: string; duration: string };
  treatment: { score: number; dosage: string; duration: string };
  mechanism: string;
  evidence: string;
}

interface NutraceuticalComparisonChartProps {
  condition: any;
  nutraceuticals: NutraceuticalData[];
}

const NutraceuticalComparisonChart: React.FC<NutraceuticalComparisonChartProps> = ({ 
  condition, 
  nutraceuticals 
}) => {
  const [viewType, setViewType] = useState<'comparison' | 'radar' | 'detailed'>('comparison');

  // Dados para gráfico de barras comparativo
  const comparisonData = nutraceuticals.map(nutri => ({
    name: nutri.name,
    Prevenção: nutri.prevention.score,
    Tratamento: nutri.treatment.score
  }));

  // Dados para gráfico radar
  const radarData = nutraceuticals.map(nutri => ({
    subject: nutri.name,
    Prevenção: nutri.prevention.score,
    Tratamento: nutri.treatment.score,
    Evidência: nutri.evidence === 'Alta' ? 5 : nutri.evidence === 'Moderada' ? 3.5 : 2,
    Segurança: Math.random() * 1.5 + 3.5 // Simulado entre 3.5-5
  }));

  const getEvidenceBadge = (evidence: string) => {
    const variants = {
      'Alta': 'default',
      'Moderada': 'secondary',
      'Baixa': 'outline'
    } as const;
    
    return <Badge variant={variants[evidence as keyof typeof variants] || 'outline'}>{evidence}</Badge>;
  };

  const getScoreColor = (score: number) => {
    if (score >= 4.0) return 'text-green-600';
    if (score >= 3.5) return 'text-blue-600';
    if (score >= 3.0) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6">
      {/* Cabeçalho informativo */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-4 gap-4 text-center">
            <div className="flex items-center justify-center space-x-2">
              <Shield className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-muted-foreground">Prevenção</p>
                <p className="font-semibold">Reduz incidência</p>
              </div>
            </div>
            <div className="flex items-center justify-center space-x-2">
              <Zap className="h-5 w-5 text-orange-600" />
              <div>
                <p className="text-sm text-muted-foreground">Tratamento</p>
                <p className="font-semibold">Melhora sintomas</p>
              </div>
            </div>
            <div className="flex items-center justify-center space-x-2">
              <Clock className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm text-muted-foreground">Duração Média</p>
                <p className="font-semibold">6-12 meses</p>
              </div>
            </div>
            <div className="flex items-center justify-center space-x-2">
              <AlertCircle className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-sm text-muted-foreground">Combinações</p>
                <p className="font-semibold">Sinergia +30%</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Controles de visualização */}
      <Tabs value={viewType} onValueChange={setViewType as any}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="comparison">Comparação</TabsTrigger>
          <TabsTrigger value="radar">Radar</TabsTrigger>
          <TabsTrigger value="detailed">Detalhado</TabsTrigger>
        </TabsList>

        <TabsContent value="comparison" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Eficácia: Prevenção vs Tratamento</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-96">
                <ChartContainer config={{}}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={comparisonData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis domain={[0, 5]} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="Prevenção" fill="hsl(var(--chart-1))" />
                      <Bar dataKey="Tratamento" fill="hsl(var(--chart-2))" />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="radar" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Análise Multidimensional</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-96">
                <ChartContainer config={{}}>
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={radarData}>
                      <PolarGrid />
                      <PolarAngleAxis dataKey="subject" />
                      <PolarRadiusAxis domain={[0, 5]} />
                      <Radar
                        name="Score"
                        dataKey="Prevenção"
                        stroke="hsl(var(--chart-1))"
                        fill="hsl(var(--chart-1))"
                        fillOpacity={0.2}
                      />
                      <Radar
                        name="Score"
                        dataKey="Tratamento"
                        stroke="hsl(var(--chart-2))"
                        fill="hsl(var(--chart-2))"
                        fillOpacity={0.2}
                      />
                      <Tooltip />
                    </RadarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="detailed" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Comparação Detalhada</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nutracêutico</TableHead>
                    <TableHead>Prevenção</TableHead>
                    <TableHead>Tratamento</TableHead>
                    <TableHead>Mecanismo</TableHead>
                    <TableHead>Evidência</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {nutraceuticals.map((nutri, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{nutri.name}</TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className={`font-semibold ${getScoreColor(nutri.prevention.score)}`}>
                            {nutri.prevention.score.toFixed(1)}/5
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {nutri.prevention.dosage} • {nutri.prevention.duration}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className={`font-semibold ${getScoreColor(nutri.treatment.score)}`}>
                            {nutri.treatment.score.toFixed(1)}/5
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {nutri.treatment.dosage} • {nutri.treatment.duration}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">{nutri.mechanism}</TableCell>
                      <TableCell>{getEvidenceBadge(nutri.evidence)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Recomendações de combinações */}
      <Card>
        <CardHeader>
          <CardTitle>Combinações Sinérgicas Recomendadas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-3">
              <h4 className="font-semibold text-primary">Para Prevenção</h4>
              <div className="space-y-2">
                {condition.name.toLowerCase().includes('obesidade') ? (
                  <>
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <p className="font-medium">L-Carnitina + Cromo</p>
                      <p className="text-sm text-muted-foreground">Sinergia: +35% eficácia</p>
                      <Badge variant="outline" className="mt-1">Score: 4.6/5</Badge>
                    </div>
                    <div className="p-3 bg-green-50 rounded-lg">
                      <p className="font-medium">Chá Verde + Garcinia</p>
                      <p className="text-sm text-muted-foreground">Sinergia: +25% eficácia</p>
                      <Badge variant="outline" className="mt-1">Score: 4.1/5</Badge>
                    </div>
                  </>
                ) : (
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <p className="font-medium">Combinação A + B</p>
                    <p className="text-sm text-muted-foreground">Sinergia: +30% eficácia</p>
                    <Badge variant="outline" className="mt-1">Score: 4.2/5</Badge>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-semibold text-orange-600">Para Tratamento</h4>
              <div className="space-y-2">
                {condition.name.toLowerCase().includes('obesidade') ? (
                  <>
                    <div className="p-3 bg-orange-50 rounded-lg">
                      <p className="font-medium">L-Carnitina + Chá Verde</p>
                      <p className="text-sm text-muted-foreground">Sinergia: +40% eficácia</p>
                      <Badge variant="outline" className="mt-1">Score: 4.3/5</Badge>
                    </div>
                    <div className="p-3 bg-purple-50 rounded-lg">
                      <p className="font-medium">Cromo + Garcinia</p>
                      <p className="text-sm text-muted-foreground">Sinergia: +28% eficácia</p>
                      <Badge variant="outline" className="mt-1">Score: 3.9/5</Badge>
                    </div>
                  </>
                ) : (
                  <div className="p-3 bg-orange-50 rounded-lg">
                    <p className="font-medium">Combinação C + D</p>
                    <p className="text-sm text-muted-foreground">Sinergia: +35% eficácia</p>
                    <Badge variant="outline" className="mt-1">Score: 4.0/5</Badge>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default NutraceuticalComparisonChart;