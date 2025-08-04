import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calculator, TrendingUp, PieChart, Download, Play } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RechartsPieChart, Cell } from 'recharts';
import { useROIIntelligence } from '@/hooks/roi/useROIIntelligence';

interface SimulationInputs {
  clientProfile: string;
  conditionFocus: string[];
  investmentAmount: number;
  timeHorizon: number;
  preventiveFocus: number;
  riskTolerance: 'low' | 'medium' | 'high';
}

export const BusinessCaseSimulator: React.FC = () => {
  const { clientProfiles, marketOpportunities, roiScenarios } = useROIIntelligence();
  
  const [inputs, setInputs] = useState<SimulationInputs>({
    clientProfile: 'medium',
    conditionFocus: ['Osteoartrite Canina'],
    investmentAmount: 50000,
    timeHorizon: 12,
    preventiveFocus: 60,
    riskTolerance: 'medium'
  });

  const [simulationResults, setSimulationResults] = useState<any>(null);

  const simulateBusinessCase = () => {
    const selectedProfile = clientProfiles.find(p => p.id === inputs.clientProfile);
    const selectedOpportunities = marketOpportunities.filter(op => 
      inputs.conditionFocus.includes(op.conditionName)
    );

    if (!selectedProfile || selectedOpportunities.length === 0) return;

    // Cálculos baseados nos inputs
    const baseRevenue = selectedProfile.petVolume * selectedProfile.avgCaseValue;
    const riskMultiplier = inputs.riskTolerance === 'high' ? 1.3 : inputs.riskTolerance === 'medium' ? 1.1 : 0.9;
    const preventiveBonus = (inputs.preventiveFocus / 100) * 1.4;
    
    const avgOpportunityROI = selectedOpportunities.reduce((sum, op) => sum + op.potentialROI, 0) / selectedOpportunities.length;
    
    const projectedRevenue = Math.round(baseRevenue * (1 + (avgOpportunityROI / 100) * riskMultiplier * preventiveBonus));
    const netProfit = projectedRevenue - inputs.investmentAmount;
    const roiPercentage = Math.round((netProfit / inputs.investmentAmount) * 100);
    
    // Breakdown de custos e receitas
    const costBreakdown = [
      { name: 'Implementação', value: Math.round(inputs.investmentAmount * 0.4), color: '#8b5cf6' },
      { name: 'Treinamento', value: Math.round(inputs.investmentAmount * 0.2), color: '#3b82f6' },
      { name: 'Estoque Inicial', value: Math.round(inputs.investmentAmount * 0.3), color: '#10b981' },
      { name: 'Marketing', value: Math.round(inputs.investmentAmount * 0.1), color: '#f59e0b' }
    ];

    const revenueBreakdown = [
      { name: 'Prevenção', value: Math.round(projectedRevenue * (inputs.preventiveFocus / 100)), color: '#10b981' },
      { name: 'Tratamento', value: Math.round(projectedRevenue * ((100 - inputs.preventiveFocus) / 100)), color: '#3b82f6' }
    ];

    // Timeline mensal
    const monthlyData = Array.from({ length: inputs.timeHorizon }, (_, i) => {
      const month = i + 1;
      const progressFactor = Math.min(month / 6, 1); // Ramp-up nos primeiros 6 meses
      const seasonality = 1 + 0.1 * Math.sin((month * 2 * Math.PI) / 12);
      
      return {
        month: `M${month}`,
        revenue: Math.round((projectedRevenue / inputs.timeHorizon) * progressFactor * seasonality),
        costs: Math.round((inputs.investmentAmount / inputs.timeHorizon) * (month <= 6 ? 1.5 : 0.8)),
        profit: 0
      };
    }).map(data => ({
      ...data,
      profit: data.revenue - data.costs
    }));

    const results = {
      summary: {
        totalInvestment: inputs.investmentAmount,
        projectedRevenue,
        netProfit,
        roiPercentage,
        paybackMonths: Math.ceil(inputs.investmentAmount / (netProfit / inputs.timeHorizon)),
        confidenceScore: selectedOpportunities.reduce((sum, op) => sum + op.confidenceScore, 0) / selectedOpportunities.length
      },
      breakdown: {
        costs: costBreakdown,
        revenue: revenueBreakdown
      },
      timeline: monthlyData,
      riskAnalysis: {
        level: inputs.riskTolerance,
        factors: [
          'Adoção da tecnologia pelos veterinários',
          'Aceitação dos tutores aos protocolos preventivos',
          'Variabilidade nos resultados clínicos',
          'Competição com tratamentos tradicionais'
        ]
      }
    };

    setSimulationResults(results);
  };

  const selectedProfile = clientProfiles.find(p => p.id === inputs.clientProfile);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="h-5 w-5 text-primary" />
          Simulador de Business Case
        </CardTitle>
        <CardDescription>
          Configure parâmetros e simule diferentes cenários de implementação
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Inputs de Simulação */}
          <div className="lg:col-span-1 space-y-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="profile">Perfil da Clínica</Label>
                <Select 
                  value={inputs.clientProfile} 
                  onValueChange={(value) => setInputs(prev => ({ ...prev, clientProfile: value }))}
                >
                  <SelectTrigger id="profile">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {clientProfiles.map(profile => (
                      <SelectItem key={profile.id} value={profile.id}>
                        {profile.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedProfile && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {selectedProfile.description} • {selectedProfile.petVolume} pets/mês
                  </p>
                )}
              </div>

              <div>
                <Label>Investimento Inicial (R$)</Label>
                <div className="mt-2">
                  <Slider
                    value={[inputs.investmentAmount]}
                    onValueChange={([value]) => setInputs(prev => ({ ...prev, investmentAmount: value }))}
                    min={10000}
                    max={200000}
                    step={5000}
                  />
                  <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                    <span>R$ 10k</span>
                    <span className="font-medium">R$ {(inputs.investmentAmount / 1000).toFixed(0)}k</span>
                    <span>R$ 200k</span>
                  </div>
                </div>
              </div>

              <div>
                <Label>Horizonte Temporal (meses)</Label>
                <div className="mt-2">
                  <Slider
                    value={[inputs.timeHorizon]}
                    onValueChange={([value]) => setInputs(prev => ({ ...prev, timeHorizon: value }))}
                    min={6}
                    max={36}
                    step={6}
                  />
                  <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                    <span>6m</span>
                    <span className="font-medium">{inputs.timeHorizon}m</span>
                    <span>36m</span>
                  </div>
                </div>
              </div>

              <div>
                <Label>Foco Preventivo (%)</Label>
                <div className="mt-2">
                  <Slider
                    value={[inputs.preventiveFocus]}
                    onValueChange={([value]) => setInputs(prev => ({ ...prev, preventiveFocus: value }))}
                    min={0}
                    max={100}
                    step={10}
                  />
                  <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                    <span>0%</span>
                    <span className="font-medium">{inputs.preventiveFocus}%</span>
                    <span>100%</span>
                  </div>
                </div>
              </div>

              <div>
                <Label htmlFor="risk">Tolerância ao Risco</Label>
                <Select 
                  value={inputs.riskTolerance} 
                  onValueChange={(value: any) => setInputs(prev => ({ ...prev, riskTolerance: value }))}
                >
                  <SelectTrigger id="risk">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Baixa - Conservador</SelectItem>
                    <SelectItem value="medium">Média - Equilibrado</SelectItem>
                    <SelectItem value="high">Alta - Agressivo</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button onClick={simulateBusinessCase} className="w-full" size="lg">
                <Play className="h-4 w-4 mr-2" />
                Simular Business Case
              </Button>
            </div>
          </div>

          {/* Resultados da Simulação */}
          <div className="lg:col-span-2">
            {simulationResults ? (
              <Tabs defaultValue="summary" className="space-y-4">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="summary">Resumo</TabsTrigger>
                  <TabsTrigger value="breakdown">Detalhamento</TabsTrigger>
                  <TabsTrigger value="timeline">Timeline</TabsTrigger>
                  <TabsTrigger value="risks">Riscos</TabsTrigger>
                </TabsList>

                <TabsContent value="summary" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Card>
                      <CardContent className="p-4">
                        <div className="text-center">
                          <p className="text-sm text-muted-foreground">ROI Projetado</p>
                          <p className={`text-3xl font-bold ${simulationResults.summary.roiPercentage > 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {simulationResults.summary.roiPercentage}%
                          </p>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-4">
                        <div className="text-center">
                          <p className="text-sm text-muted-foreground">Payback</p>
                          <p className="text-3xl font-bold">
                            {simulationResults.summary.paybackMonths} meses
                          </p>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-4">
                        <div className="text-center">
                          <p className="text-sm text-muted-foreground">Lucro Líquido</p>
                          <p className={`text-3xl font-bold ${simulationResults.summary.netProfit > 0 ? 'text-green-600' : 'text-red-600'}`}>
                            R$ {simulationResults.summary.netProfit.toLocaleString()}
                          </p>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-4">
                        <div className="text-center">
                          <p className="text-sm text-muted-foreground">Confiança</p>
                          <p className="text-3xl font-bold">
                            {Math.round(simulationResults.summary.confidenceScore)}%
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                <TabsContent value="breakdown" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Distribuição de Custos</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="h-48">
                          <ResponsiveContainer width="100%" height="100%">
                            <RechartsPieChart>
                              <Tooltip 
                                formatter={(value: any) => [`R$ ${value.toLocaleString()}`, 'Valor']}
                              />
                              <RechartsPieChart data={simulationResults.breakdown.costs}>
                                {simulationResults.breakdown.costs.map((entry: any, index: number) => (
                                  <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                              </RechartsPieChart>
                            </RechartsPieChart>
                          </ResponsiveContainer>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Distribuição de Receitas</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="h-48">
                          <ResponsiveContainer width="100%" height="100%">
                            <RechartsPieChart>
                              <Tooltip 
                                formatter={(value: any) => [`R$ ${value.toLocaleString()}`, 'Valor']}
                              />
                              <RechartsPieChart data={simulationResults.breakdown.revenue}>
                                {simulationResults.breakdown.revenue.map((entry: any, index: number) => (
                                  <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                              </RechartsPieChart>
                            </RechartsPieChart>
                          </ResponsiveContainer>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                <TabsContent value="timeline" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Projeção Mensal</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={simulationResults.timeline}>
                            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                            <XAxis dataKey="month" />
                            <YAxis />
                            <Tooltip 
                              formatter={(value: any, name: string) => [
                                `R$ ${value.toLocaleString()}`, 
                                name === 'revenue' ? 'Receita' : name === 'costs' ? 'Custos' : 'Lucro'
                              ]}
                            />
                            <Bar dataKey="revenue" fill="#10b981" name="Receita" />
                            <Bar dataKey="costs" fill="#ef4444" name="Custos" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="risks" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Análise de Riscos</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span>Nível de Risco:</span>
                          <Badge variant={
                            simulationResults.riskAnalysis.level === 'low' ? 'default' :
                            simulationResults.riskAnalysis.level === 'medium' ? 'secondary' : 'destructive'
                          }>
                            {simulationResults.riskAnalysis.level === 'low' ? 'Baixo' :
                             simulationResults.riskAnalysis.level === 'medium' ? 'Médio' : 'Alto'}
                          </Badge>
                        </div>
                        
                        <div>
                          <p className="font-medium mb-2">Principais Fatores de Risco:</p>
                          <ul className="space-y-2">
                            {simulationResults.riskAnalysis.factors.map((factor: string, index: number) => (
                              <li key={index} className="flex items-start gap-2 text-sm">
                                <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                                {factor}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            ) : (
              <div className="h-96 flex items-center justify-center bg-muted/30 rounded-lg">
                <div className="text-center">
                  <Calculator className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    Configure os parâmetros e execute a simulação para ver os resultados
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};