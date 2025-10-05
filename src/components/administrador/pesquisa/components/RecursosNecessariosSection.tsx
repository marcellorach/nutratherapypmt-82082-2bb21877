import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
  const formatCurrency = (value: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  return (
    <div className="space-y-6">
      {/* População do Estudo */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            {t('studyProposals.dialog.resources.studyPopulation.title')}
          </CardTitle>
          <CardDescription>
            {t('studyProposals.dialog.resources.studyPopulation.description')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{recursos.populacao_estudo.total_caes}</div>
              <div className="text-sm text-muted-foreground">{t('studyProposals.dialog.resources.studyPopulation.totalDogs')}</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-secondary">{recursos.populacao_estudo.idade}</div>
              <div className="text-sm text-muted-foreground">{t('studyProposals.dialog.resources.studyPopulation.ageRange')}</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-accent">{recursos.populacao_estudo.duracao_meses}</div>
              <div className="text-sm text-muted-foreground">{t('studyProposals.dialog.resources.studyPopulation.months')}</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold">
                {recursos.populacao_estudo.grupo_placebo}/{recursos.populacao_estudo.grupo_tratamento}
              </div>
              <div className="text-sm text-muted-foreground">{t('studyProposals.dialog.resources.studyPopulation.placeboTreatment')}</div>
            </div>
          </div>

          <div>
            <h5 className="font-medium mb-2 flex items-center gap-2">
              <PieChart className="h-4 w-4" />
              {t('studyProposals.dialog.resources.studyPopulation.breedDistribution')}
            </h5>
            <div className="flex gap-2 flex-wrap">
              <Badge variant="outline">
                {t('studyProposals.dialog.resources.studyPopulation.small')}: {recursos.populacao_estudo.distribuicao_racas.pequeno_porte}%
              </Badge>
              <Badge variant="outline">
                {t('studyProposals.dialog.resources.studyPopulation.medium')}: {recursos.populacao_estudo.distribuicao_racas.medio_porte}%
              </Badge>
              <Badge variant="outline">
                {t('studyProposals.dialog.resources.studyPopulation.large')}: {recursos.populacao_estudo.distribuicao_racas.grande_porte}%
              </Badge>
            </div>
          </div>

          {recursos.populacao_estudo.racas_cardiacas && (
            <div>
              <h5 className="font-medium mb-2 flex items-center gap-2">
                <Activity className="h-4 w-4 text-red-500" />
                {t('studyProposals.dialog.resources.studyPopulation.cardiacBreeds')}
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
                      <div className="text-xs text-muted-foreground">{t('studyProposals.dialog.resources.studyPopulation.volunteers')}</div>
                    </div>
                  </div>
                ))}
                <div className="text-xs text-muted-foreground mt-2 p-2 bg-amber-50 dark:bg-amber-950/20 rounded border border-amber-200 dark:border-amber-800">
                  <strong>{t('studyProposals.dialog.resources.studyPopulation.totalCardiacVolunteers')}:</strong> {recursos.populacao_estudo.racas_cardiacas.reduce((total, raca) => total + raca.voluntarios, 0)} {t('studyProposals.dialog.resources.studyPopulation.of')} {recursos.populacao_estudo.total_caes} {t('studyProposals.dialog.resources.studyPopulation.totalDogs').toLowerCase()}
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
            {t('studyProposals.dialog.resources.examSchedule.title')}
          </CardTitle>
          <CardDescription>
            {t('studyProposals.dialog.resources.examSchedule.description')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <h5 className="font-medium mb-2 flex items-center gap-2">
                <Activity className="h-4 w-4 text-green-500" />
                {t('studyProposals.dialog.resources.examSchedule.preStudy')}
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
                {t('studyProposals.dialog.resources.examSchedule.duringStudy')}
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
                {t('studyProposals.dialog.resources.examSchedule.postStudy')}
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
                {t('studyProposals.dialog.resources.examSchedule.followup')}
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
            {t('studyProposals.dialog.resources.estimatedCosts.title')}
          </CardTitle>
          <CardDescription>
            {t('studyProposals.dialog.resources.estimatedCosts.description')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm">{t('studyProposals.dialog.resources.estimatedCosts.labExams')}</span>
                  <span className="font-medium">{formatCurrency(recursos.custos_estimados.exames_laboratoriais)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">{t('studyProposals.dialog.resources.estimatedCosts.ultrasounds')}</span>
                  <span className="font-medium">{formatCurrency(recursos.custos_estimados.ultrassons)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">{t('studyProposals.dialog.resources.estimatedCosts.medications')}</span>
                  <span className="font-medium">{formatCurrency(recursos.custos_estimados.medicamentos)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">{t('studyProposals.dialog.resources.estimatedCosts.personnel')}</span>
                  <span className="font-medium">{formatCurrency(recursos.custos_estimados.pessoal)}</span>
                </div>
              </div>

              <div className="space-y-3">
                <div className="p-4 bg-primary/10 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className="h-5 w-5 text-primary" />
                    <span className="text-sm font-medium">{t('studyProposals.dialog.resources.estimatedCosts.totalCost')}</span>
                  </div>
                  <div className="text-2xl font-bold text-primary">
                    {formatCurrency(recursos.custos_estimados.total)}
                  </div>
                </div>

                <div className="p-4 bg-secondary/10 rounded-lg">
                  <div className="text-sm text-muted-foreground mb-1">{t('studyProposals.dialog.resources.estimatedCosts.costPerAnimalMonth')}</div>
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
