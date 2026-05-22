import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Map, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const MetaKgRoadmapCard: React.FC = () => {
  const { t } = useTranslation();
  return (
    <Card className="border-amber-200 bg-gradient-to-br from-amber-50/60 to-orange-50/40">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Map className="h-5 w-5 text-amber-600" />
          <CardTitle className="text-base">
            {t('fundamentos.roadmap.title', 'Roadmap do Meta-KG')}
          </CardTitle>
          <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-200">
            {t('fundamentos.roadmap.phaseAActive', 'Fase A ativa')}
          </Badge>
        </div>
        <CardDescription className="text-xs">
          {t(
            'fundamentos.roadmap.description',
            'Lembrete permanente das próximas evoluções desta área. Não esquecer.'
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        <div className="flex items-start gap-2">
          <Badge className="bg-amber-100 text-amber-800 border-amber-300 shrink-0">
            {t('fundamentos.roadmap.phaseB', 'Fase B')}
          </Badge>
          <div className="text-foreground/90">
            <span className="font-medium">{t('fundamentos.roadmap.phaseBTitle', 'Meta-KG navegável')}.</span>{' '}
            {t(
              'fundamentos.roadmap.phaseBBody',
              'Promover lições (padrões, recipes, anti-padrões) a entidades de primeira classe; criar tripletes arquiteturais entre elas; vínculo bidirecional RC ↔ lição.'
            )}
          </div>
        </div>
        <div className="flex items-start gap-2">
          <Badge className="bg-blue-100 text-blue-800 border-blue-300 shrink-0">
            {t('fundamentos.roadmap.phaseC', 'Fase C')}
          </Badge>
          <div className="text-foreground/90">
            <span className="font-medium">{t('fundamentos.roadmap.phaseCTitle', 'RAG do meta-KG')}.</span>{' '}
            {t(
              'fundamentos.roadmap.phaseCBody',
              'Embedding + busca semântica sobre meta-estudos quando atingirmos ≥30 estudos arquiteturais para justificar o custo.'
            )}
          </div>
        </div>
        <div className="flex items-center gap-1 text-[11px] text-muted-foreground pt-1">
          <Sparkles className="h-3 w-3" />
          {t(
            'fundamentos.roadmap.note',
            'Fase A entrega sandbox (lifecycle) + confiabilidade 0–5 por estudo, sem refatorar a modelagem atual.'
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default MetaKgRoadmapCard;