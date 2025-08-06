import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  Calendar, 
  Calculator, 
  DollarSign,
  Activity,
  Clock,
  PieChart
} from "lucide-react";
import { RecursosNecessarios } from '../types/sugestoes';

interface RecursosNecessariosSectionProps {
  recursos: RecursosNecessarios;
}

const RecursosNecessariosSection: React.FC<RecursosNecessariosSectionProps> = ({ recursos }) => {
  const formatCurrency = (value: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  return (
    <div className="space-y-6">
      {/* População do Estudo */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            População do Estudo
          </CardTitle>
          <CardDescription>
            Detalhes da amostra necessária para o estudo
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{recursos.populacao_estudo.total_caes}</div>
              <div className="text-sm text-muted-foreground">Total de Cães</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-secondary">{recursos.populacao_estudo.idade}</div>
              <div className="text-sm text-muted-foreground">Faixa Etária</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-accent">{recursos.populacao_estudo.duracao_meses}</div>
              <div className="text-sm text-muted-foreground">Meses</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold">
                {recursos.populacao_estudo.grupo_placebo}/{recursos.populacao_estudo.grupo_tratamento}
              </div>
              <div className="text-sm text-muted-foreground">Placebo/Tratamento</div>
            </div>
          </div>

          <div>
            <h5 className="font-medium mb-2 flex items-center gap-2">
              <PieChart className="h-4 w-4" />
              Distribuição por Porte
            </h5>
            <div className="flex gap-2 flex-wrap">
              <Badge variant="outline">
                Pequeno: {recursos.populacao_estudo.distribuicao_racas.pequeno_porte}%
              </Badge>
              <Badge variant="outline">
                Médio: {recursos.populacao_estudo.distribuicao_racas.medio_porte}%
              </Badge>
              <Badge variant="outline">
                Grande: {recursos.populacao_estudo.distribuicao_racas.grande_porte}%
              </Badge>
            </div>
          </div>

          {recursos.populacao_estudo.racas_cardiacas && (
            <div>
              <h5 className="font-medium mb-2 flex items-center gap-2">
                <Activity className="h-4 w-4 text-red-500" />
                Raças com Predisposição Cardíaca
              </h5>
              <div className="space-y-2">
                {recursos.populacao_estudo.racas_cardiacas.map((raca, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-800">
                    <div className="flex-1">
                      <div className="font-medium text-sm">{raca.raca}</div>
                      <div className="text-xs text-muted-foreground">{raca.predisposicao}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-red-600 dark:text-red-400">{raca.voluntarios}</div>
                      <div className="text-xs text-muted-foreground">voluntários</div>
                    </div>
                  </div>
                ))}
                <div className="text-xs text-muted-foreground mt-2 p-2 bg-amber-50 dark:bg-amber-950/20 rounded border border-amber-200 dark:border-amber-800">
                  <strong>Total de voluntários com predisposição cardíaca:</strong> {recursos.populacao_estudo.racas_cardiacas.reduce((total, raca) => total + raca.voluntarios, 0)} de {recursos.populacao_estudo.total_caes} cães
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Cronograma de Exames */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Cronograma de Exames
          </CardTitle>
          <CardDescription>
            Bateria de exames necessária em cada fase do estudo
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <h5 className="font-medium mb-2 flex items-center gap-2">
                <Activity className="h-4 w-4 text-green-500" />
                Pré-Estudo
              </h5>
              <ul className="text-sm text-muted-foreground space-y-1">
                {recursos.cronograma_exames.pre_estudo.map((exame, index) => (
                  <li key={index} className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                    {exame}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h5 className="font-medium mb-2 flex items-center gap-2">
                <Clock className="h-4 w-4 text-blue-500" />
                Durante Estudo
              </h5>
              <ul className="text-sm text-muted-foreground space-y-1">
                {recursos.cronograma_exames.durante_estudo.map((exame, index) => (
                  <li key={index} className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                    {exame}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h5 className="font-medium mb-2 flex items-center gap-2">
                <Activity className="h-4 w-4 text-purple-500" />
                Pós-Estudo
              </h5>
              <ul className="text-sm text-muted-foreground space-y-1">
                {recursos.cronograma_exames.pos_estudo.map((exame, index) => (
                  <li key={index} className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-purple-500 rounded-full"></div>
                    {exame}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h5 className="font-medium mb-2 flex items-center gap-2">
                <Calendar className="h-4 w-4 text-amber-500" />
                Acompanhamento
              </h5>
              <ul className="text-sm text-muted-foreground space-y-1">
                {recursos.cronograma_exames.acompanhamento.map((exame, index) => (
                  <li key={index} className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-amber-500 rounded-full"></div>
                    {exame}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Custos Estimados */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5 text-primary" />
            Custos Estimados
          </CardTitle>
          <CardDescription>
            Breakdown detalhado dos custos do projeto
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Exames Laboratoriais</span>
                  <span className="font-medium">{formatCurrency(recursos.custos_estimados.exames_laboratoriais)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Ultrassons</span>
                  <span className="font-medium">{formatCurrency(recursos.custos_estimados.ultrassons)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Medicamentos</span>
                  <span className="font-medium">{formatCurrency(recursos.custos_estimados.medicamentos)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Pessoal</span>
                  <span className="font-medium">{formatCurrency(recursos.custos_estimados.pessoal)}</span>
                </div>
              </div>

              <div className="space-y-3">
                <div className="p-4 bg-primary/10 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className="h-5 w-5 text-primary" />
                    <span className="text-sm font-medium">Custo Total</span>
                  </div>
                  <div className="text-2xl font-bold text-primary">
                    {formatCurrency(recursos.custos_estimados.total)}
                  </div>
                </div>

                <div className="p-4 bg-secondary/10 rounded-lg">
                  <div className="text-sm text-muted-foreground mb-1">Custo por Animal/Mês</div>
                  <div className="text-lg font-bold text-secondary">
                    {formatCurrency(recursos.custos_estimados.custo_por_animal_mes)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RecursosNecessariosSection;