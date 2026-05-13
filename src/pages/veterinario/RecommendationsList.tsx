
import React, { useState, useEffect } from 'react';
import { Pet } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusCircle, FilePlus, Save, Brain, AlertTriangle } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';

interface RecommendationLog {
  id: string;
  pet_id: string | null;
  condition_id: string | null;
  recommendation_data: any;
  rationale: string | null;
  confidence_overall: number | null;
  confidence_level: string | null;
  recommendation_source: string | null;
  warnings: string[] | null;
  studies_referenced: string[] | null;
  veterinarian_reviewed: boolean | null;
  created_at: string | null;
}

interface RecommendationsListProps {
  selectedPet: Pet | null;
}

const RecommendationsList: React.FC<RecommendationsListProps> = ({ selectedPet }) => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [recommendations, setRecommendations] = useState<RecommendationLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  useEffect(() => {
    if (!selectedPet) return;
    
    const loadRecommendations = async () => {
      setIsLoading(true);
      try {
        // Query recommendation_logs by pet_id using pet profile lookup
        const { data: petProfiles } = await supabase
          .from('pet_profiles')
          .select('id')
          .eq('name', selectedPet.name)
          .limit(1);
        
        if (petProfiles && petProfiles.length > 0) {
          const { data, error } = await supabase
            .from('recommendation_logs')
            .select('*')
            .eq('pet_id', petProfiles[0].id)
            .order('created_at', { ascending: false });
          
          if (!error && data) {
            setRecommendations(data as RecommendationLog[]);
          }
        }
      } catch (err) {
        console.error('Erro ao carregar recomendações:', err);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadRecommendations();
  }, [selectedPet]);
  
  if (!selectedPet) {
    return (
      <div className="text-center py-12 bg-muted/50 rounded-lg border border-dashed border-border">
        <h3 className="text-xl font-semibold text-foreground mb-2">{t('veterinarian.noPetSelected')}</h3>
        <p className="text-muted-foreground mb-6">{t('veterinarian.selectPetPrompt')}</p>
      </div>
    );
  }
  
  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">Carregando recomendações...</p>
      </div>
    );
  }
  
  if (recommendations.length === 0) {
    return (
      <div className="text-center py-12 bg-muted/50 rounded-lg border border-dashed border-border">
        <Brain className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-xl font-semibold text-foreground mb-2">
          {selectedPet.name} ainda não possui recomendações
        </h3>
        <p className="text-muted-foreground mb-6">
          Execute a análise Senex AI no perfil do pet para gerar recomendações baseadas em evidências.
        </p>
        <Button className="flex items-center gap-2 mx-auto">
          <Brain size={16} />
          Ir para Perfil do Pet
        </Button>
      </div>
    );
  }
  
  const getConfidenceBadge = (level: string | null) => {
    switch (level) {
      case 'high':
        return <Badge className="bg-green-100 text-green-800 border-green-200">Alta Confiança</Badge>;
      case 'medium':
        return <Badge className="bg-amber-100 text-amber-800 border-amber-200">Média Confiança</Badge>;
      case 'low':
        return <Badge className="bg-red-100 text-red-800 border-red-200">Baixa Confiança</Badge>;
      default:
        return <Badge variant="outline">Sem classificação</Badge>;
    }
  };
  
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold text-foreground">{t('veterinarian.treatmentPlan')} {selectedPet.name}</h2>
          <p className="text-muted-foreground">{recommendations.length} recomendação(ões) encontrada(s)</p>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" className="flex items-center gap-2">
            <FilePlus size={16} />
            {t('veterinarian.report')}
          </Button>
        </div>
      </div>
      
      <div className="space-y-4">
        {recommendations.map(rec => {
          const data = rec.recommendation_data || {};
          const compounds = data.compounds || data.nutraceuticals || [];
          
          return (
            <Card key={rec.id} className="border-l-4 border-l-primary">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">
                      {data.title || data.condition || 'Recomendação Senex AI'}
                    </CardTitle>
                    <CardDescription>
                      Fonte: {rec.recommendation_source || 'Senex AI'} • 
                      {rec.created_at ? ` ${new Date(rec.created_at).toLocaleDateString('pt-BR')}` : ''}
                    </CardDescription>
                  </div>
                  {getConfidenceBadge(rec.confidence_level)}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {rec.rationale && (
                  <div>
                    <p className="text-sm font-medium text-foreground mb-1">Racional:</p>
                    <p className="text-sm text-muted-foreground">{rec.rationale}</p>
                  </div>
                )}
                
                {compounds.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-foreground mb-2">Compostos recomendados:</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {compounds.map((compound: any, idx: number) => (
                        <div key={idx} className="bg-muted/50 p-2 rounded text-sm">
                          <span className="font-medium">{compound.name || compound}</span>
                          {compound.dosage && <span className="text-muted-foreground"> — {compound.dosage}</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {rec.warnings && rec.warnings.length > 0 && (
                  <div className="bg-amber-50 p-3 rounded-md">
                    <div className="flex items-center gap-2 mb-1">
                      <AlertTriangle size={14} className="text-amber-600" />
                      <p className="text-sm font-medium text-amber-800">Avisos:</p>
                    </div>
                    <ul className="text-sm text-amber-700 list-disc list-inside">
                      {rec.warnings.map((w, i) => <li key={i}>{w}</li>)}
                    </ul>
                  </div>
                )}
                
                {rec.studies_referenced && rec.studies_referenced.length > 0 && (
                  <p className="text-xs text-muted-foreground">
                    {rec.studies_referenced.length} estudo(s) referenciado(s)
                  </p>
                )}
                
                {rec.confidence_overall && (
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-muted rounded-full h-2">
                      <div 
                        className="bg-primary rounded-full h-2" 
                        style={{ width: `${Math.round(rec.confidence_overall * 100)}%` }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {Math.round(rec.confidence_overall * 100)}%
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default RecommendationsList;
