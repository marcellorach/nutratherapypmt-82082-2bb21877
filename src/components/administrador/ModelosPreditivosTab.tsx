import React, { useState } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Brain, Search, Target, Sparkles, Play } from "lucide-react";
import { useTranslation } from 'react-i18next';
import { modelEvolutionData } from './modelosPreditivos/data/modelEvolutionData';
import ModelsDashboard from './modelosPreditivos/components/ModelsDashboard';
import ModelDetailDialog from './modelosPreditivos/components/ModelDetailDialog';
import { ModelEvolution } from './modelosPreditivos/types/evolutionTypes';
import { Badge } from "@/components/ui/badge";

const ModelosPreditivosTab: React.FC = () => {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedModel, setSelectedModel] = useState<ModelEvolution | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const filteredModelos = modelEvolutionData.filter(modelo => 
    modelo.modelName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    const configs = {
      'state-of-art': { label: '🎯 Estado da Arte', color: 'bg-purple-100 text-purple-700 border-purple-200' },
      'mature': { label: '✅ Maduro', color: 'bg-green-100 text-green-700 border-green-200' },
      'growing': { label: '📈 Crescendo', color: 'bg-blue-100 text-blue-700 border-blue-200' },
      'initial': { label: '🌱 Inicial', color: 'bg-yellow-100 text-yellow-700 border-yellow-200' }
    };
    return configs[status as keyof typeof configs] || configs.initial;
  };

  const hasRecentInsight = (model: ModelEvolution) => {
    if (model.insights.length === 0) return false;
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return model.insights.some(i => new Date(i.discoveredAt) > thirtyDaysAgo);
  };

  const handleViewEvolution = (modelId: string) => {
    const model = modelEvolutionData.find(m => m.modelId === modelId);
    if (model) {
      setSelectedModel(model);
      setDialogOpen(true);
    }
  };

  return (
    <div className="space-y-6">
      {/* Dashboard Overview */}
      <ModelsDashboard />

      {/* Lista de Modelos */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-semibold">Modelos em Evolução</h3>
            <p className="text-sm text-muted-foreground">
              Acompanhe cada modelo em detalhe
            </p>
          </div>
          <div className="w-72">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar modelos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </div>

        <div className="border border-border rounded-lg overflow-hidden">
          <Card>
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-accent/50">
                  <th className="p-4 text-left text-sm font-medium text-muted-foreground">Modelo</th>
                  <th className="p-4 text-left text-sm font-medium text-muted-foreground">Status</th>
                  <th className="p-4 text-left text-sm font-medium text-muted-foreground">Performance</th>
                  <th className="p-4 text-left text-sm font-medium text-muted-foreground">Volume de Dados</th>
                  <th className="p-4 text-left text-sm font-medium text-muted-foreground">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredModelos.map((modelo) => (
                  <tr key={modelo.modelId} className="border-b border-border hover:bg-accent/50 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <Brain className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{modelo.modelName}</p>
                            {hasRecentInsight(modelo) && (
                              <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 text-xs">
                                <Sparkles className="h-3 w-3 mr-1" />
                                Novo Insight!
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {modelo.totalSamples.toLocaleString()} amostras • {modelo.insights.length} insights
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <Badge 
                        variant="outline" 
                        className={`${getStatusBadge(modelo.status).color} border`}
                      >
                        {getStatusBadge(modelo.status).label}
                      </Badge>
                    </td>
                    <td className="p-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">{modelo.currentAccuracy}%</span>
                          <span className="text-xs text-green-600">+{modelo.monthlyGrowthRate}%</span>
                        </div>
                        <div className="w-full bg-accent rounded-full h-2">
                          <div 
                            className="bg-primary rounded-full h-2 transition-all"
                            style={{ width: `${modelo.currentAccuracy}%` }}
                          />
                        </div>
                        {/* Mini sparkline visual */}
                        <div className="flex items-end gap-0.5 h-8">
                          {modelo.snapshots.slice(-6).map((snap, i) => (
                            <div 
                              key={i}
                              className="flex-1 bg-primary/30 rounded-t"
                              style={{ height: `${(snap.accuracy / 100) * 100}%` }}
                            />
                          ))}
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="text-sm">
                        <p className="font-medium">{(modelo.totalSamples / 1000).toFixed(1)}k</p>
                        <p className="text-xs text-muted-foreground">
                          T: {(modelo.treatmentSamples / 1000).toFixed(1)}k • C: {(modelo.controlSamples / 1000).toFixed(1)}k
                        </p>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="text-xs"
                          onClick={() => handleViewEvolution(modelo.modelId)}
                        >
                          <Target className="h-3 w-3 mr-1" />
                          Ver Evolução
                        </Button>
                        <Button size="sm" className="text-xs">
                          <Play className="h-3 w-3 mr-1" />
                          Executar
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </div>
      </div>

      {/* Model Detail Dialog */}
      <ModelDetailDialog 
        model={selectedModel}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </div>
  );
};

export default ModelosPreditivosTab;
