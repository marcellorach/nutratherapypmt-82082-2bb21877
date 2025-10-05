import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Eye, TrendingUp, Database, Calendar } from "lucide-react";
import ModelDetailDialog from "./modelosPreditivos/components/ModelDetailDialog";
import { predictiveModelsData } from "./modelosPreditivos/data/predictiveModelsData";
import { PredictiveModel } from "./modelosPreditivos/types/predictiveModelTypes";

const ModelosPreditivosTab = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedModel, setSelectedModel] = useState<PredictiveModel | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const filteredModelos = predictiveModelsData.filter((modelo) =>
    modelo.modelName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    modelo.algorithm.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'state-of-art':
        return {
          label: 'Estado da Arte',
          className: 'bg-brand-primary/10 text-brand-primary border-brand-primary/20'
        };
      case 'mature':
        return {
          label: 'Maduro',
          className: 'bg-success/10 text-success border-success/20'
        };
      case 'growing':
        return {
          label: 'Em Crescimento',
          className: 'bg-info/10 text-info border-info/20'
        };
      case 'initial':
        return {
          label: 'Fase Inicial',
          className: 'bg-warning/10 text-warning border-warning/20'
        };
      default:
        return {
          label: status,
          className: 'bg-muted text-muted-foreground'
        };
    }
  };

  const hasRecentInsight = (model: PredictiveModel) => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return model.degenerativeInsights.some(
      insight => new Date(insight.discoveredAt) > thirtyDaysAgo
    );
  };

  const handleViewEvolution = (model: PredictiveModel) => {
    setSelectedModel(model);
    setDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <Card className="p-6 border-border bg-card">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-foreground">Modelos Preditivos em Deep Learning</h3>
            <p className="text-sm text-muted-foreground">
              Acompanhe a performance e evolução de cada modelo preditivo
            </p>
          </div>
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Buscar modelo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 bg-background border-border"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Modelo</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Algoritmo</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Precisão</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Pets Monitorados</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Crescimento Mensal</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Ações</th>
              </tr>
            </thead>
            <tbody>
            {filteredModelos.map((modelo) => {
                return (
                  <tr key={modelo.modelId} className="border-b border-border hover:bg-muted/30 transition-colors">
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            {hasRecentInsight(modelo) && (
                              <div className="flex items-center gap-1.5 text-muted-foreground">
                                <Database className="h-3.5 w-3.5" />
                                <span className="text-xs">Dados recentes</span>
                              </div>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">{modelo.description}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <p className="text-sm font-medium text-foreground">{modelo.modelName}</p>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 min-w-[140px]">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium text-foreground">{modelo.currentAccuracy}%</span>
                          </div>
                          <div className="h-1.5 bg-muted rounded-full overflow-hidden mb-1.5">
                            <div
                              className="h-full bg-foreground transition-all"
                              style={{ width: `${modelo.currentAccuracy}%` }}
                            />
                          </div>
                          <div className="flex items-center gap-1.5 text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            <span className="text-xs">{new Date(modelo.trainedAt).toLocaleDateString('pt-BR')}</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {modelo.totalPetsMonitored.toLocaleString()}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Tratamento: {modelo.treatmentGroup.toLocaleString()} | Controle: {modelo.controlGroup.toLocaleString()}
                        </p>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-1 text-success">
                        <TrendingUp className="h-4 w-4" />
                        <span className="text-sm font-medium">+{modelo.monthlyGrowthRate}%</span>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewEvolution(modelo)}
                        className="gap-2"
                      >
                        <Eye className="h-4 w-4" />
                        Ver Evolução
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredModelos.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Nenhum modelo encontrado</p>
          </div>
        )}
      </Card>

      <ModelDetailDialog
        model={selectedModel}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </div>
  );
};

export default ModelosPreditivosTab;
