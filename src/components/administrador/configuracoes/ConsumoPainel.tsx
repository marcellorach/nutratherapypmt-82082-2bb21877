import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Wand2, RefreshCw, TrendingUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';

const ConsumoPainel = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const { toast } = useToast();
  const { t } = useTranslation();

  useEffect(() => { loadRealStats(); }, []);

  const loadRealStats = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('api-usage-stats', {
        body: {
          period: 'daily',
          startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          endDate: new Date().toISOString()
        }
      });
      if (error) throw error;
      setStats(data.stats);
    } catch (error) {
      console.error('Error loading stats:', error);
      toast({
        title: t('consumoPainel.loadError'),
        description: t('consumoPainel.loadErrorDesc'),
        variant: "destructive"
      });
      setStats({ totalCalls: 0, totalCost: 0, byProvider: {}, byModel: {}, byDay: {} });
    } finally {
      setIsLoading(false);
    }
  };

  const gerarDadosAleatorios = () => {
    toast({
      title: t('consumoPainel.realDataTitle'),
      description: t('consumoPainel.realDataDesc')
    });
  };

  const renderBarChart = (data: Record<string, any>) => {
    if (!data || Object.keys(data).length === 0) {
      return <p className="text-sm text-muted-foreground">{t('consumoPainel.noData')}</p>;
    }
    const maxValue = Math.max(...Object.values(data).map((v: any) => v.calls || 0));
    const sortedDays = Object.keys(data).sort();
    const lastSevenDays = sortedDays.slice(-7);
    return (
      <div className="space-y-2">
        {lastSevenDays.map((day) => {
          const dayData = data[day];
          const percentage = maxValue > 0 ? (dayData.calls / maxValue) * 100 : 0;
          return (
            <div key={day} className="flex items-center gap-2">
              <span className="text-xs w-24 text-muted-foreground">
                {new Date(day).toLocaleDateString('pt-BR', { month: 'short', day: 'numeric' })}
              </span>
              <div className="flex-1 bg-muted rounded-full h-6 overflow-hidden">
                <div className="bg-primary h-full flex items-center justify-end pr-2" style={{ width: `${percentage}%` }}>
                  <span className="text-xs text-primary-foreground font-medium">
                    {dayData.calls} {t('consumoPainel.calls')}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            {t('consumoPainel.titleLoading')}
          </CardTitle>
          <CardDescription>{t('consumoPainel.loadingDesc')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-20 bg-muted rounded"></div>
            <div className="h-40 bg-muted rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const totalCalls = stats?.totalCalls || 0;
  const totalCost = stats?.totalCost || 0;
  const monthlyAvg = Object.keys(stats?.byDay || {}).length > 0 
    ? totalCalls / Object.keys(stats.byDay).length 
    : 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              {t('consumoPainel.title')}
            </CardTitle>
            <CardDescription>{t('consumoPainel.description')}</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={loadRealStats} disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-primary">{totalCalls}</p>
                <p className="text-sm text-muted-foreground mt-1">{t('consumoPainel.totalCalls')}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-secondary/5 border-secondary/20">
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-secondary">{monthlyAvg.toFixed(0)}</p>
                <p className="text-sm text-muted-foreground mt-1">{t('consumoPainel.avgCallsDay')}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div>
          <h3 className="text-sm font-semibold mb-3">{t('consumoPainel.dailyUsage')}</h3>
          {renderBarChart(stats?.byDay || {})}
        </div>

        <div>
          <h3 className="text-sm font-semibold mb-3">{t('consumoPainel.usageByModel')}</h3>
          <div className="space-y-2">
            {Object.entries(stats?.byModel || {}).map(([model, data]: [string, any]) => {
              const percentage = totalCalls > 0 ? (data.calls / totalCalls) * 100 : 0;
              return (
                <div key={model} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{model}</span>
                    <span className="text-muted-foreground">{data.calls} {t('consumoPainel.calls')}</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div className="bg-primary h-2 rounded-full" style={{ width: `${percentage}%` }}></div>
                  </div>
                </div>
              );
            })}
            {Object.keys(stats?.byModel || {}).length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">{t('consumoPainel.noUsageYet')}</p>
            )}
          </div>
        </div>

        {totalCost > 0 && (
          <div className="pt-4 border-t">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">{t('consumoPainel.estimatedCost')}</span>
              <span className="text-lg font-bold text-primary">${totalCost.toFixed(4)} USD</span>
            </div>
          </div>
        )}

        <Button onClick={gerarDadosAleatorios} variant="outline" className="w-full">
          <Wand2 className="h-4 w-4 mr-2" />
          {t('consumoPainel.aboutRealData')}
        </Button>
      </CardContent>
    </Card>
  );
};

export default ConsumoPainel;
