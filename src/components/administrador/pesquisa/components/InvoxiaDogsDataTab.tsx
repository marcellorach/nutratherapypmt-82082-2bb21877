import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Loader2, RefreshCw, Dog, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { 
  HeartRateChart, 
  BreathingRateChart, 
  HRVChart, 
  ActivityChart, 
  SleepChart 
} from './invoxia-charts';

interface PetDataRow {
  date: string | null;
  HR_day_mean: number | null;
  HR_night_mean: number | null;
  HR_day_min: number | null;
  HR_day_max: number | null;
  HR_night_min: number | null;
  HR_night_max: number | null;
  BR_day_mean: number | null;
  BR_night_mean: number | null;
  BR_day_min: number | null;
  BR_day_max: number | null;
  BR_night_min: number | null;
  BR_night_max: number | null;
  all_sdnn: number | null;
  all_rmssd: number | null;
  all_hrv: number | null;
  day_sdnn: number | null;
  night_sdnn: number | null;
  distance: number | null;
  calories: number | null;
  exercise_duration_minutes: number | null;
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

interface DogInfo {
  id: number;
  name: string;
  breed: string;
  weight: number;
  gender: 'male' | 'female';
}

interface DogState {
  data: PetDataRow[];
  loading: boolean;
  error: string | null;
  lastFetch: Date | null;
}

const DOGS_LIST: DogInfo[] = [
  { id: 3738, name: 'Luco', breed: 'Bouledogue Français', weight: 11.5, gender: 'male' },
  { id: 3736, name: 'Dionísia', breed: 'Miniature Pinscher', weight: 6.0, gender: 'female' },
  { id: 3732, name: 'Cash', breed: 'Unknown', weight: 11.3, gender: 'male' },
  { id: 3731, name: 'Mia', breed: 'Unknown', weight: 29.0, gender: 'female' },
  { id: 3694, name: 'Boris', breed: 'Bouledogue Français', weight: 19.4, gender: 'male' },
  { id: 3680, name: 'Berinjela', breed: 'Other', weight: 15.0, gender: 'male' },
];

export const InvoxiaDogsDataTab: React.FC = () => {
  const { t } = useTranslation();
  const [globalLoading, setGlobalLoading] = useState(false);
  const [dogsData, setDogsData] = useState<Record<number, DogState>>({});

  const fetchAllData = async () => {
    setGlobalLoading(true);

    // Set all dogs to loading
    const loadingState: Record<number, DogState> = {};
    DOGS_LIST.forEach(dog => {
      loadingState[dog.id] = {
        data: dogsData[dog.id]?.data || [],
        loading: true,
        error: null,
        lastFetch: dogsData[dog.id]?.lastFetch || null,
      };
    });
    setDogsData(loadingState);

    // Fetch all dogs in parallel
    const results = await Promise.allSettled(
      DOGS_LIST.map(dog =>
        supabase.functions.invoke('invoxia-api', { body: { petId: dog.id } })
      )
    );

    // Update state with results
    const newDogsData: Record<number, DogState> = {};
    DOGS_LIST.forEach((dog, index) => {
      const result = results[index];
      if (result.status === 'fulfilled' && result.value.data?.success) {
        const response = result.value.data as InvoxiaResponse;
        newDogsData[dog.id] = {
          data: response.data,
          loading: false,
          error: null,
          lastFetch: new Date(),
        };
      } else {
        const errorMsg = result.status === 'rejected' 
          ? result.reason?.message || t('admin.studies.ongoingStudies.dogsData.error')
          : result.value.data?.error || t('admin.studies.ongoingStudies.dogsData.error');
        newDogsData[dog.id] = {
          data: [],
          loading: false,
          error: errorMsg,
          lastFetch: null,
        };
      }
    });

    setDogsData(newDogsData);
    setGlobalLoading(false);
  };

  const getDogState = (dogId: number): DogState => {
    return dogsData[dogId] || { data: [], loading: false, error: null, lastFetch: null };
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div className="flex items-center gap-3">
          <Dog className="h-6 w-6 text-primary" />
          <div>
            <CardTitle className="text-lg">
              {t('admin.studies.ongoingStudies.dogsData.allDogsTitle')}
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {t('admin.studies.ongoingStudies.dogsData.allDogsSubtitle', { count: DOGS_LIST.length })}
            </p>
          </div>
        </div>
        <Button onClick={fetchAllData} disabled={globalLoading} variant="outline" size="sm">
          {globalLoading ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <RefreshCw className="h-4 w-4 mr-2" />
          )}
          {t('admin.studies.ongoingStudies.dogsData.fetchAllButton')}
        </Button>
      </CardHeader>

      <CardContent>
        {Object.keys(dogsData).length === 0 && !globalLoading && (
          <div className="text-center py-12 text-muted-foreground">
            {t('admin.studies.ongoingStudies.dogsData.noData')}
          </div>
        )}

        <Accordion type="multiple" className="w-full space-y-2">
          {DOGS_LIST.map(dog => {
            const state = getDogState(dog.id);
            
            return (
              <AccordionItem 
                key={dog.id} 
                value={`dog-${dog.id}`}
                className="border rounded-lg px-4"
              >
                <AccordionTrigger className="hover:no-underline py-4">
                  <div className="flex items-center gap-3 flex-1">
                    <Dog className="h-5 w-5 text-primary" />
                    <span className="font-medium">{dog.name}</span>
                    <span className="text-xs text-muted-foreground hidden sm:inline">
                      {dog.breed} • {dog.weight}kg
                    </span>
                    
                    {/* Status indicators */}
                    <div className="flex items-center gap-2 ml-auto mr-4">
                      {state.loading && (
                        <Loader2 className="h-4 w-4 animate-spin text-primary" />
                      )}
                      {state.error && (
                        <AlertCircle className="h-4 w-4 text-destructive" />
                      )}
                      {state.data.length > 0 && !state.loading && (
                        <Badge variant="secondary" className="text-xs">
                          {state.data.length} {t('admin.studies.ongoingStudies.dogsData.records')}
                        </Badge>
                      )}
                    </div>
                  </div>
                </AccordionTrigger>
                
                <AccordionContent className="pb-4">
                  {state.error && (
                    <div className="flex items-center gap-2 p-4 bg-destructive/10 text-destructive rounded-md mb-4">
                      <AlertCircle className="h-5 w-5" />
                      <span>{t('admin.studies.ongoingStudies.dogsData.error')}: {state.error}</span>
                    </div>
                  )}

                  {state.loading && (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                      <span className="ml-3 text-muted-foreground">
                        {t('admin.studies.ongoingStudies.dogsData.loading')}
                      </span>
                    </div>
                  )}

                  {!state.loading && state.data.length === 0 && !state.error && (
                    <div className="text-center py-8 text-muted-foreground">
                      {t('admin.studies.ongoingStudies.dogsData.noDataForDog')}
                    </div>
                  )}

                  {!state.loading && state.data.length > 0 && (
                    <>
                      {state.lastFetch && (
                        <p className="text-xs text-muted-foreground mb-4">
                          {t('admin.studies.ongoingStudies.dogsData.lastFetch')}: {state.lastFetch.toLocaleString()}
                        </p>
                      )}
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <HeartRateChart data={state.data} />
                        <BreathingRateChart data={state.data} />
                        <HRVChart data={state.data} />
                        <ActivityChart data={state.data} />
                        <SleepChart data={state.data} />
                      </div>
                    </>
                  )}
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      </CardContent>
    </Card>
  );
};

export default InvoxiaDogsDataTab;
