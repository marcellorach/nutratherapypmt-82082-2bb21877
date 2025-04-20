
import React, { useState } from 'react';
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const ConsumoPainel: React.FC = () => {
  const [consumptionData, setConsumptionData] = useState({
    totalUsage: 0,
    monthlyUsage: 0,
    dailyUsage: [0, 0.5, 1.2, 0.8, 1.5, 1.1, 0.9, 1.3, 0.6, 0.7, 1.0, 1.4, 0.5, 0.3, 0.8, 0.9, 1.1, 1.3, 1.2, 0.4, 0.9, 1.5, 0.8, 1.0, 1.2, 1.1, 0.7, 1.3, 0.5, 0.6],
    modelUsage: [
      { model: "gpt-4o", usage: 65 },
      { model: "gpt-4o-mini", usage: 25 },
      { model: "gpt-3.5-turbo", usage: 10 }
    ]
  });

  const gerarDadosAleatorios = () => {
    const totalUsage = Math.random() * 80 + 20;
    const monthlyUsage = Math.random() * 40 + 10;
    const dailyUsage = Array.from({ length: 30 }, () => Math.random() * 2);
    const modelUsage = [
      { model: "gpt-4o", usage: Math.floor(Math.random() * 70) + 30 },
      { model: "gpt-4o-mini", usage: Math.floor(Math.random() * 30) + 10 },
      { model: "gpt-3.5-turbo", usage: Math.floor(Math.random() * 20) + 5 }
    ];
    
    setConsumptionData({
      totalUsage,
      monthlyUsage,
      dailyUsage,
      modelUsage
    });
  };

  const renderBarChart = (data: number[]) => {
    const max = Math.max(...data);
    
    return (
      <div className="flex items-end h-40 gap-1">
        {data.map((value, index) => (
          <div
            key={index}
            className="bg-indigo-500 hover:bg-indigo-600 transition-all rounded-t w-full"
            style={{
              height: `${(value / max) * 100}%`,
              minHeight: '4px'
            }}
            title={`Dia ${index + 1}: $${value.toFixed(2)}`}
          />
        ))}
      </div>
    );
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Consumo da API OpenAI</CardTitle>
          <CardDescription>Análise de custos e utilização por modelo</CardDescription>
        </div>
        <Button size="sm" onClick={gerarDadosAleatorios}>Gerar dados aleatórios</Button>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="text-sm text-gray-500">Consumo Total</div>
            <div className="text-2xl font-bold">${consumptionData.totalUsage.toFixed(2)}</div>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="text-sm text-gray-500">Consumo do Mês Atual</div>
            <div className="text-2xl font-bold">${consumptionData.monthlyUsage.toFixed(2)}</div>
          </div>
        </div>
        
        <div>
          <h3 className="font-medium mb-2">Consumo Diário (últimos 30 dias)</h3>
          {renderBarChart(consumptionData.dailyUsage)}
          <div className="flex justify-between mt-1 text-xs text-gray-500">
            <span>1</span>
            <span>15</span>
            <span>30</span>
          </div>
        </div>
        
        <div>
          <h3 className="font-medium mb-2">Utilização por Modelo</h3>
          <div className="space-y-3">
            {consumptionData.modelUsage.map((item, index) => (
              <div key={index}>
                <div className="flex justify-between mb-1">
                  <span className="text-sm">{item.model}</span>
                  <span className="text-sm">{item.usage}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div 
                    className="bg-indigo-600 h-2.5 rounded-full" 
                    style={{ width: `${item.usage}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ConsumoPainel;
