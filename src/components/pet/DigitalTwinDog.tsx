import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Dna, AlertTriangle, Activity } from 'lucide-react';
import dogSilhouette from '@/assets/dog-silhouette.png';

// Map conditions to body regions (percentage positions on the image)
const bodyRegionMap: Record<string, { x: number; y: number; region: string }> = {
  // Musculoskeletal
  'osteoarthritis': { x: 30, y: 75, region: 'joints' },
  'arthritis': { x: 30, y: 75, region: 'joints' },
  'hip dysplasia': { x: 20, y: 55, region: 'hip' },
  'elbow dysplasia': { x: 72, y: 65, region: 'elbow' },
  'intervertebral disc disease': { x: 45, y: 25, region: 'spine' },
  'spondylosis': { x: 40, y: 25, region: 'spine' },
  // Neurological
  'canine cognitive dysfunction': { x: 85, y: 15, region: 'brain' },
  'cognitive dysfunction': { x: 85, y: 15, region: 'brain' },
  'epilepsy': { x: 85, y: 15, region: 'brain' },
  // Cardiac
  'dilated cardiomyopathy': { x: 65, y: 40, region: 'heart' },
  'mitral valve disease': { x: 65, y: 40, region: 'heart' },
  'heart disease': { x: 65, y: 40, region: 'heart' },
  // Hepatic
  'hepatic lipidosis': { x: 50, y: 45, region: 'liver' },
  'liver disease': { x: 50, y: 45, region: 'liver' },
  // Renal
  'chronic kidney disease': { x: 35, y: 40, region: 'kidney' },
  'renal failure': { x: 35, y: 40, region: 'kidney' },
  // Endocrine
  'hypothyroidism': { x: 78, y: 35, region: 'thyroid' },
  'diabetes': { x: 48, y: 48, region: 'pancreas' },
  "cushing's disease": { x: 45, y: 35, region: 'adrenal' },
  // Dermatological
  'atopic dermatitis': { x: 50, y: 60, region: 'skin' },
  'allergies': { x: 50, y: 60, region: 'skin' },
  // Ocular
  'cataracts': { x: 88, y: 18, region: 'eyes' },
  'progressive retinal atrophy': { x: 88, y: 18, region: 'eyes' },
  // GI
  'inflammatory bowel disease': { x: 45, y: 55, region: 'gi' },
  'pancreatitis': { x: 48, y: 48, region: 'pancreas' },
  // Systemic/Cellular
  'cellular senescence': { x: 50, y: 30, region: 'systemic' },
  'oxidative stress': { x: 50, y: 30, region: 'systemic' },
  'chronic inflammation': { x: 50, y: 30, region: 'systemic' },
  'cancer': { x: 50, y: 30, region: 'systemic' },
  // Respiratory
  'brachycephalic syndrome': { x: 90, y: 22, region: 'respiratory' },
  'laryngeal paralysis': { x: 80, y: 30, region: 'respiratory' },
};

const severityPulseColors: Record<string, string> = {
  mild: 'bg-yellow-400',
  moderate: 'bg-orange-400',
  severe: 'bg-red-500',
};

const severityRingColors: Record<string, string> = {
  mild: 'ring-yellow-400/50',
  moderate: 'ring-orange-400/50',
  severe: 'ring-red-500/50',
};

interface DigitalTwinDogProps {
  conditions: Array<{
    id: string;
    condition_name: string;
    severity?: string;
    status?: string;
  }>;
  petName: string;
  petBreed: string;
  petAge: number;
}

const DigitalTwinDog: React.FC<DigitalTwinDogProps> = ({ conditions, petName, petBreed, petAge }) => {
  const { t } = useTranslation();

  const mappedConditions = useMemo(() => {
    return conditions
      .filter(c => c.status === 'active' || !c.status)
      .map(c => {
        const key = c.condition_name.toLowerCase();
        const match = Object.entries(bodyRegionMap).find(([k]) => key.includes(k));
        return {
          ...c,
          position: match ? match[1] : { x: 50, y: 30, region: 'systemic' },
        };
      });
  }, [conditions]);

  // Group conditions by close proximity to avoid overlap
  const groupedByRegion = useMemo(() => {
    const groups: Record<string, typeof mappedConditions> = {};
    mappedConditions.forEach(c => {
      const regionKey = c.position.region;
      if (!groups[regionKey]) groups[regionKey] = [];
      groups[regionKey].push(c);
    });
    return groups;
  }, [mappedConditions]);

  if (conditions.length === 0) return null;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Dna className="h-4 w-4 text-primary" />
          {t('petProfile.digitalTwin.title')}
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          {t('petProfile.digitalTwin.description', { name: petName, breed: petBreed, age: petAge })}
        </p>
      </CardHeader>
      <CardContent className="p-4">
        <div className="relative w-full max-w-[500px] mx-auto">
          {/* Dog silhouette */}
          <img
            src={dogSilhouette}
            alt={t('petProfile.digitalTwin.silhouetteAlt')}
            className="w-full h-auto opacity-40 dark:opacity-25 dark:invert"
          />

          {/* Condition markers */}
          <TooltipProvider delayDuration={100}>
            {Object.entries(groupedByRegion).map(([region, conditionsInRegion]) => {
              const pos = conditionsInRegion[0].position;
              const worstSeverity = conditionsInRegion.reduce((worst, c) => {
                const order = ['mild', 'moderate', 'severe'];
                const cIdx = order.indexOf(c.severity || 'mild');
                const wIdx = order.indexOf(worst);
                return cIdx > wIdx ? (c.severity || 'mild') : worst;
              }, 'mild');

              return (
                <Tooltip key={region}>
                  <TooltipTrigger asChild>
                    <div
                      className="absolute cursor-pointer group"
                      style={{
                        left: `${pos.x}%`,
                        top: `${pos.y}%`,
                        transform: 'translate(-50%, -50%)',
                      }}
                    >
                      {/* Pulse ring */}
                      <div
                        className={`absolute inset-0 rounded-full animate-ping opacity-30 ${severityPulseColors[worstSeverity] || 'bg-orange-400'}`}
                        style={{ width: 24, height: 24, margin: '-4px' }}
                      />
                      {/* Core dot */}
                      <div
                        className={`relative w-4 h-4 rounded-full ring-2 ${severityPulseColors[worstSeverity] || 'bg-orange-400'} ${severityRingColors[worstSeverity] || 'ring-orange-400/50'} shadow-lg flex items-center justify-center`}
                      >
                        {conditionsInRegion.length > 1 && (
                          <span className="text-[8px] text-white font-bold">
                            {conditionsInRegion.length}
                          </span>
                        )}
                      </div>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-[220px]">
                    <div className="space-y-1">
                      <p className="text-xs font-semibold capitalize flex items-center gap-1">
                        <Activity className="h-3 w-3" />
                        {t(`petProfile.digitalTwin.regions.${region}`, region)}
                      </p>
                      {conditionsInRegion.map(c => (
                        <div key={c.id} className="flex items-center gap-1.5">
                          <div className={`w-2 h-2 rounded-full ${severityPulseColors[c.severity || 'mild']}`} />
                          <span className="text-xs">{c.condition_name}</span>
                          {c.severity && (
                            <Badge variant="outline" className="text-[9px] h-3.5 px-1">
                              {t(`petProfile.severity.${c.severity}`, c.severity)}
                            </Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </TooltipProvider>

          {/* Legend */}
          <div className="absolute bottom-0 right-0 flex items-center gap-3 text-[10px] text-muted-foreground bg-background/80 rounded-md px-2 py-1">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-yellow-400" />
              {t('petProfile.severity.mild')}
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-orange-400" />
              {t('petProfile.severity.moderate')}
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-red-500" />
              {t('petProfile.severity.severe')}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DigitalTwinDog;
