import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, RefreshCw, Dog, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface PetDataRow {
  date: string | null;
  HR_day_mean: number | null;
  HR_night_mean: number | null;
  BR_day_mean: number | null;
  BR_night_mean: number | null;
  all_sdnn: number | null;
  distance: number | null;
  night_sleep_duration_hours: number | null;
  sleep_score: number | null;
  [key: string]: string | number | null;
}

interface InvoxiaResponse {
  success: boolean;
  petId: number;
  rowCount: number;
  data: PetDataRow[];
  error?: string;
}

const DIONISIA_PET_ID = 3736;

export const InvoxiaDogsDataTab: React.FC = () => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<PetDataRow[]>([]);
  const [lastFetch, setLastFetch] = useState<Date | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);

    try {
      const { data: responseData, error: invokeError } = await supabase.functions.invoke('invoxia-api', {
        body: { petId: DIONISIA_PET_ID },
      });

      if (invokeError) {
        throw new Error(invokeError.message);
      }

      const response = responseData as InvoxiaResponse;

      if (!response.success) {
        throw new Error(response.error || 'Unknown error');
      }

      setData(response.data);
      setLastFetch(new Date());
    } catch (err) {
      console.error('Error fetching Invoxia data:', err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  const formatValue = (value: number | string | null, decimals = 1): string => {
    if (value === null || value === undefined) return '-';
    if (typeof value === 'string') return value;
    return value.toFixed(decimals);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div className="flex items-center gap-3">
          <Dog className="h-6 w-6 text-primary" />
          <div>
            <CardTitle className="text-lg">
              {t('admin.studies.ongoingStudies.dogsData.title')}
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {t('admin.studies.ongoingStudies.dogsData.petInfo.name')}: Dionisia | 
              {t('admin.studies.ongoingStudies.dogsData.petInfo.id')}: {DIONISIA_PET_ID}
            </p>
          </div>
        </div>
        <Button onClick={fetchData} disabled={loading} variant="outline" size="sm">
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <RefreshCw className="h-4 w-4 mr-2" />
          )}
          {t('admin.studies.ongoingStudies.dogsData.fetchButton')}
        </Button>
      </CardHeader>

      <CardContent>
        {error && (
          <div className="flex items-center gap-2 p-4 bg-destructive/10 text-destructive rounded-md mb-4">
            <AlertCircle className="h-5 w-5" />
            <span>{t('admin.studies.ongoingStudies.dogsData.error')}: {error}</span>
          </div>
        )}

        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-3 text-muted-foreground">
              {t('admin.studies.ongoingStudies.dogsData.loading')}
            </span>
          </div>
        )}

        {!loading && data.length === 0 && !error && (
          <div className="text-center py-12 text-muted-foreground">
            {t('admin.studies.ongoingStudies.dogsData.noData')}
          </div>
        )}

        {!loading && data.length > 0 && (
          <>
            {lastFetch && (
              <p className="text-xs text-muted-foreground mb-4">
                {t('admin.studies.ongoingStudies.dogsData.lastFetch')}: {lastFetch.toLocaleString()}
                {' | '}{data.length} {t('admin.studies.ongoingStudies.dogsData.records')}
              </p>
            )}
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="whitespace-nowrap">{t('admin.studies.ongoingStudies.dogsData.table.date')}</TableHead>
                    <TableHead className="whitespace-nowrap">{t('admin.studies.ongoingStudies.dogsData.table.hrDayMean')}</TableHead>
                    <TableHead className="whitespace-nowrap">{t('admin.studies.ongoingStudies.dogsData.table.hrNightMean')}</TableHead>
                    <TableHead className="whitespace-nowrap">{t('admin.studies.ongoingStudies.dogsData.table.brDayMean')}</TableHead>
                    <TableHead className="whitespace-nowrap">{t('admin.studies.ongoingStudies.dogsData.table.brNightMean')}</TableHead>
                    <TableHead className="whitespace-nowrap">{t('admin.studies.ongoingStudies.dogsData.table.hrvSdnn')}</TableHead>
                    <TableHead className="whitespace-nowrap">{t('admin.studies.ongoingStudies.dogsData.table.distance')}</TableHead>
                    <TableHead className="whitespace-nowrap">{t('admin.studies.ongoingStudies.dogsData.table.sleepHours')}</TableHead>
                    <TableHead className="whitespace-nowrap">{t('admin.studies.ongoingStudies.dogsData.table.sleepScore')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.slice(0, 50).map((row, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{row.date || '-'}</TableCell>
                      <TableCell>{formatValue(row.HR_day_mean)}</TableCell>
                      <TableCell>{formatValue(row.HR_night_mean)}</TableCell>
                      <TableCell>{formatValue(row.BR_day_mean)}</TableCell>
                      <TableCell>{formatValue(row.BR_night_mean)}</TableCell>
                      <TableCell>{formatValue(row.all_sdnn)}</TableCell>
                      <TableCell>{formatValue(row.distance, 0)}</TableCell>
                      <TableCell>{formatValue(row.night_sleep_duration_hours)}</TableCell>
                      <TableCell>{formatValue(row.sleep_score, 0)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {data.length > 50 && (
              <p className="text-xs text-muted-foreground mt-2 text-center">
                {t('admin.studies.ongoingStudies.dogsData.showingFirst', { count: 50, total: data.length })}
              </p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default InvoxiaDogsDataTab;
