import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { ChartContainer } from "@/components/ui/chart";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Zap, TrendingUp, Clock, Target } from "lucide-react";

interface SimulatorInputs {
  species: string;
  breed: string;
  age: number;
  weight: number;
  severity: string;
  comorbidities: number;
  selectedNutraceuticals: string[];
}

interface PredictiveSimulatorProps {
  condition: any;
  nutraceuticals: any[];
}

const PredictiveSimulator: React.FC<PredictiveSimulatorProps> = ({ condition, nutraceuticals }) => {
  const [inputs, setInputs] = useState<SimulatorInputs>({
    species: '',
    breed: '',
    age: 5,
    weight: 15,
    severity: '',
    comorbidities: 0,
    selectedNutraceuticals: []
  });

  const [prediction, setPrediction] = useState<any>(null);
  const [isSimulating, setIsSimulating] = useState(false);

  // Simular predição baseada nos inputs
  const runSimulation = async () => {
    setIsSimulating(true);
    
    // Simular delay para processamento
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Calcular scores baseados nos inputs
    const baseEffectiveness = nutraceuticals
      .filter(n => inputs.selectedNutraceuticals.includes(n.name))
      .reduce((avg, n) => avg + (n.treatment.score + n.prevention.score) / 2, 0) / 
      Math.max(inputs.selectedNutraceuticals.length, 1);

    // Modificadores baseados no perfil do animal
    let ageModifier = inputs.age < 2 ? 1.2 : inputs.age > 8 ? 0.9 : 1.0;
    let severityModifier = inputs.severity === 'mild' ? 1.3 : inputs.severity === 'moderate' ? 1.0 : 0.7;
    let comorbiditiesModifier = 1.0 - (inputs.comorbidities * 0.15);
    let breedModifier = condition.breedsAffected.includes(inputs.breed) ? 0.9 : 1.1;

    const finalScore = baseEffectiveness * ageModifier * severityModifier * comorbiditiesModifier * breedModifier;
    const improvementExpected = Math.min(95, Math.max(10, finalScore * 20));

    // Gerar timeline de evolução
    const timelineData = [];
    for (let month = 0; month <= 12; month++) {
      const progressCurve = 1 - Math.exp(-month * 0.3);
      const monthlyImprovement = improvementExpected * progressCurve;
      timelineData.push({
        month: `Mês ${month}`,
        improvement: Math.round(monthlyImprovement),
        confidence: Math.max(60, 95 - month * 2)
      });
    }

    setPrediction({
      overallScore: finalScore,
      improvementExpected,
      timeToResults: Math.max(1, 4 - finalScore * 0.5),
      timeline: timelineData,
      recommendations: generateRecommendations(inputs, finalScore)
    });

    setIsSimulating(false);
  };

  const generateRecommendations = (inputs: SimulatorInputs, score: number) => {
    const recommendations = [];
    
    if (score > 4.0) {
      recommendations.push({
        type: 'success',
        title: 'Prognóstico Excelente',
        description: 'Combinação ideal para este perfil. Resultados esperados acima da média.',
        icon: Target
      });
    } else if (score > 3.0) {
      recommendations.push({
        type: 'info',
        title: 'Prognóstico Bom',
        description: 'Boa resposta esperada. Considere ajustes na dosagem.',
        icon: TrendingUp
      });
    } else {
      recommendations.push({
        type: 'warning',
        title: 'Resposta Limitada',
        description: 'Considere terapias complementares ou mudança de protocolo.',
        icon: Zap
      });
    }

    if (inputs.comorbidities > 1) {
      recommendations.push({
        type: 'info',
        title: 'Comorbidades Detectadas',
        description: 'Monitoramento veterinário mais frequente recomendado.',
        icon: Clock
      });
    }

    return recommendations;
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'hsl(var(--success))';
    if (score >= 60) return 'hsl(var(--warning))';
    return 'hsl(var(--destructive))';
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-6">
        {/* Inputs do Simulador */}
        <Card>
          <CardHeader>
            <CardTitle>Perfil do Animal</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Espécie</Label>
              <Select value={inputs.species} onValueChange={(value) => setInputs(prev => ({ ...prev, species: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a espécie" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="canine">Cão</SelectItem>
                  <SelectItem value="feline">Gato</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Raça</Label>
              <Select value={inputs.breed} onValueChange={(value) => setInputs(prev => ({ ...prev, breed: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a raça" />
                </SelectTrigger>
                <SelectContent>
                  {condition.breedsAffected.map((breed: string) => (
                    <SelectItem key={breed} value={breed}>{breed}</SelectItem>
                  ))}
                  <SelectItem value="outros">Outras raças</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Idade: {inputs.age} anos</Label>
              <Slider
                value={[inputs.age]}
                onValueChange={(value) => setInputs(prev => ({ ...prev, age: value[0] }))}
                max={15}
                min={0.5}
                step={0.5}
                className="mt-2"
              />
            </div>

            <div>
              <Label>Peso: {inputs.weight}kg</Label>
              <Slider
                value={[inputs.weight]}
                onValueChange={(value) => setInputs(prev => ({ ...prev, weight: value[0] }))}
                max={80}
                min={1}
                step={0.5}
                className="mt-2"
              />
            </div>

            <div>
              <Label>Severidade</Label>
              <Select value={inputs.severity} onValueChange={(value) => setInputs(prev => ({ ...prev, severity: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a severidade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mild">Leve</SelectItem>
                  <SelectItem value="moderate">Moderado</SelectItem>
                  <SelectItem value="severe">Grave</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Comorbidades: {inputs.comorbidities}</Label>
              <Slider
                value={[inputs.comorbidities]}
                onValueChange={(value) => setInputs(prev => ({ ...prev, comorbidities: value[0] }))}
                max={5}
                min={0}
                step={1}
                className="mt-2"
              />
            </div>
          </CardContent>
        </Card>

        {/* Seleção de Nutracêuticos */}
        <Card>
          <CardHeader>
            <CardTitle>Protocolo Nutracêutico</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              {nutraceuticals.map((nutri, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id={nutri.name}
                    checked={inputs.selectedNutraceuticals.includes(nutri.name)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setInputs(prev => ({
                          ...prev,
                          selectedNutraceuticals: [...prev.selectedNutraceuticals, nutri.name]
                        }));
                      } else {
                        setInputs(prev => ({
                          ...prev,
                          selectedNutraceuticals: prev.selectedNutraceuticals.filter(n => n !== nutri.name)
                        }));
                      }
                    }}
                    className="rounded"
                  />
                  <label htmlFor={nutri.name} className="text-sm font-medium">
                    {nutri.name}
                  </label>
                  <Badge variant="outline" className="text-xs">
                    {nutri.treatment.score.toFixed(1)}/5
                  </Badge>
                </div>
              ))}
            </div>

            <Button 
              onClick={runSimulation} 
              disabled={isSimulating || inputs.selectedNutraceuticals.length === 0}
              className="w-full"
            >
              {isSimulating ? 'Simulando...' : 'Executar Simulação'}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Resultados da Simulação */}
      {prediction && (
        <div className="space-y-6">
          {/* Métricas principais */}
          <div className="grid grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold" style={{ color: getScoreColor(prediction.improvementExpected) }}>
                  {prediction.improvementExpected}%
                </div>
                <p className="text-sm text-muted-foreground">Melhora Esperada</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-primary">
                  {prediction.timeToResults.toFixed(1)}
                </div>
                <p className="text-sm text-muted-foreground">Meses p/ Resultados</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-chart-2">
                  {(prediction.overallScore * 20).toFixed(0)}%
                </div>
                <p className="text-sm text-muted-foreground">Score Global</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-chart-3">
                  {prediction.timeline[6]?.confidence}%
                </div>
                <p className="text-sm text-muted-foreground">Confiança (6m)</p>
              </CardContent>
            </Card>
          </div>

          {/* Timeline de Evolução */}
          <Card>
            <CardHeader>
              <CardTitle>Evolução Temporal Prevista</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ChartContainer config={{}}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={prediction.timeline}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Area
                        type="monotone"
                        dataKey="improvement"
                        stroke="hsl(var(--primary))"
                        fill="hsl(var(--primary))"
                        fillOpacity={0.3}
                      />
                      <Line
                        type="monotone"
                        dataKey="confidence"
                        stroke="hsl(var(--chart-2))"
                        strokeDasharray="5 5"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </div>
            </CardContent>
          </Card>

          {/* Recomendações */}
          <Card>
            <CardHeader>
              <CardTitle>Recomendações Personalizadas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {prediction.recommendations.map((rec: any, index: number) => (
                  <div key={index} className="flex items-start space-x-3 p-3 rounded-lg bg-gray-50">
                    <rec.icon className="h-5 w-5 mt-0.5 text-primary" />
                    <div>
                      <h4 className="font-semibold">{rec.title}</h4>
                      <p className="text-sm text-muted-foreground">{rec.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default PredictiveSimulator;