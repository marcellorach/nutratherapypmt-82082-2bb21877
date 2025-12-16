
import React from 'react';
import { Leaf, Zap, ArrowRight, Target, Activity, AlertTriangle, Sparkles, TrendingUp, TrendingDown, Shield, Link2 } from 'lucide-react';
import NutraceuticalTag from '../../../tags/NutraceuticalTag';
import OutcomeTag from '../../../tags/OutcomeTag';
import { Badge } from "@/components/ui/badge";
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface EstudoDetailSectionsProps {
  estudo: any;
}

// Mapeamento de predicados para cores e ícones
const predicateConfig: Record<string, { color: string; icon: React.ReactNode; label: string }> = {
  TREATS: { color: 'bg-emerald-100 text-emerald-800 border-emerald-300', icon: <Shield className="w-3 h-3" />, label: 'Trata' },
  PREVENTS: { color: 'bg-blue-100 text-blue-800 border-blue-300', icon: <Shield className="w-3 h-3" />, label: 'Previne' },
  INHIBITS: { color: 'bg-red-100 text-red-800 border-red-300', icon: <TrendingDown className="w-3 h-3" />, label: 'Inibe' },
  ACTIVATES: { color: 'bg-green-100 text-green-800 border-green-300', icon: <Zap className="w-3 h-3" />, label: 'Ativa' },
  MODULATES: { color: 'bg-purple-100 text-purple-800 border-purple-300', icon: <Activity className="w-3 h-3" />, label: 'Modula' },
  BINDS_TO: { color: 'bg-indigo-100 text-indigo-800 border-indigo-300', icon: <Link2 className="w-3 h-3" />, label: 'Liga-se a' },
  UPREGULATES: { color: 'bg-lime-100 text-lime-800 border-lime-300', icon: <TrendingUp className="w-3 h-3" />, label: 'Aumenta' },
  DOWNREGULATES: { color: 'bg-orange-100 text-orange-800 border-orange-300', icon: <TrendingDown className="w-3 h-3" />, label: 'Diminui' },
  SUPPORTS: { color: 'bg-cyan-100 text-cyan-800 border-cyan-300', icon: <Sparkles className="w-3 h-3" />, label: 'Suporta' },
  AMELIORATES: { color: 'bg-teal-100 text-teal-800 border-teal-300', icon: <TrendingUp className="w-3 h-3" />, label: 'Melhora' },
  CAUSES: { color: 'bg-amber-100 text-amber-800 border-amber-300', icon: <ArrowRight className="w-3 h-3" />, label: 'Causa' },
  CAUSES_SIDE_EFFECT: { color: 'bg-rose-100 text-rose-800 border-rose-300', icon: <AlertTriangle className="w-3 h-3" />, label: 'Efeito Colateral' },
  CONTRAINDICATED_FOR: { color: 'bg-red-200 text-red-900 border-red-400', icon: <AlertTriangle className="w-3 h-3" />, label: 'Contraindicado' },
  SYNERGIZES_WITH: { color: 'bg-violet-100 text-violet-800 border-violet-300', icon: <Sparkles className="w-3 h-3" />, label: 'Sinergia' },
};

const getPredicateConfig = (predicate: string) => {
  return predicateConfig[predicate] || { 
    color: 'bg-gray-100 text-gray-800 border-gray-300', 
    icon: <ArrowRight className="w-3 h-3" />, 
    label: predicate 
  };
};

// Mapeamento de ações de mecanismos
const actionConfig: Record<string, { color: string; icon: React.ReactNode }> = {
  inhibition: { color: 'bg-red-50 text-red-700 border-red-200', icon: <TrendingDown className="w-3 h-3" /> },
  activation: { color: 'bg-green-50 text-green-700 border-green-200', icon: <Zap className="w-3 h-3" /> },
  modulation: { color: 'bg-purple-50 text-purple-700 border-purple-200', icon: <Activity className="w-3 h-3" /> },
  binding: { color: 'bg-indigo-50 text-indigo-700 border-indigo-200', icon: <Link2 className="w-3 h-3" /> },
};

const getActionConfig = (action: string) => {
  return actionConfig[action] || { color: 'bg-gray-50 text-gray-700 border-gray-200', icon: <Activity className="w-3 h-3" /> };
};

const EstudoDetailSections: React.FC<EstudoDetailSectionsProps> = ({ estudo }) => {
  // Extrair dados reais do analysis_data
  const analysisData = estudo?.analysis_data || {};
  
  // Buscar triplets do banco de dados para este estudo
  const { data: triplets = [] } = useQuery({
    queryKey: ['study-triplets', estudo?.id],
    queryFn: async () => {
      if (!estudo?.id) return [];
      const { data, error } = await supabase
        .from('triplet_extractions')
        .select('*')
        .eq('study_id', estudo.id)
        .order('extraction_confidence', { ascending: false });
      
      if (error) {
        console.error('Error fetching triplets:', error);
        return [];
      }
      return data || [];
    },
    enabled: !!estudo?.id,
  });
  
  // Nutracêuticos identificados no estudo
  const nutraceuticos = (analysisData.extractedNutraceuticals || []).map((n: any) => ({
    nome: n.name,
    score: n.confidence || 3.0
  }));
  
  // Condições de saúde identificadas
  const condicoes = (analysisData.extractedConditions || []).map((c: any) => ({
    nome: c.name,
    score: c.confidence || 3.0
  }));
  
  // Mecanismos moleculares
  const mecanismos = analysisData.molecularMechanisms || [];
  
  // Efeitos colaterais detalhados
  const efeitosColaterais = (analysisData.detailedSideEffects || analysisData.extractedSideEffects || []).map((e: any) => ({
    nome: e.name,
    score: e.severity === 'mild' ? 2.0 : e.severity === 'moderate' ? 3.0 : 4.0
  }));

  // Agrupar triplets por predicado para melhor visualização
  const tripletsByPredicate = triplets.reduce((acc: Record<string, any[]>, triplet: any) => {
    const pred = triplet.predicate || 'OTHER';
    if (!acc[pred]) acc[pred] = [];
    acc[pred].push(triplet);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {/* Seção Nutracêuticos */}
      {nutraceuticos.length > 0 && (
        <section className="space-y-2">
          <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <Leaf className="w-4 h-4 text-green-600" />
            Nutracêuticos Identificados
          </h4>
          <div className="flex flex-wrap gap-2">
            {nutraceuticos.map((nutra: any, idx: number) => (
              <NutraceuticalTag 
                key={idx}
                name={nutra.nome}
                score={nutra.score}
              />
            ))}
          </div>
        </section>
      )}

      {/* Seção Condições */}
      {condicoes.length > 0 && (
        <section className="space-y-2">
          <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <Target className="w-4 h-4 text-blue-600" />
            Condições de Saúde
          </h4>
          <div className="flex flex-wrap gap-2">
            {condicoes.map((condicao: any, idx: number) => (
              <OutcomeTag 
                key={idx}
                outcome={condicao.nome}
                score={condicao.score}
              />
            ))}
          </div>
        </section>
      )}

      {/* Seção Mecanismos de Ação */}
      {mecanismos.length > 0 && (
        <section className="space-y-3">
          <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <Activity className="w-4 h-4 text-purple-600" />
            Mecanismos de Ação
          </h4>
          <div className="space-y-2">
            {mecanismos.map((mech: any, idx: number) => {
              const config = getActionConfig(mech.action);
              return (
                <div 
                  key={idx}
                  className="p-3 rounded-lg border bg-card/50 hover:bg-card transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <Badge 
                      variant="outline" 
                      className={`${config.color} shrink-0`}
                    >
                      {config.icon}
                      <span className="ml-1 capitalize">{mech.action}</span>
                    </Badge>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-foreground">{mech.name}</p>
                      {mech.target && (
                        <p className="text-xs text-muted-foreground mt-1">
                          <span className="font-medium">Alvo:</span> {mech.target}
                        </p>
                      )}
                      {mech.downstream_effects && mech.downstream_effects.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {mech.downstream_effects.map((effect: string, effIdx: number) => (
                            <span 
                              key={effIdx}
                              className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground"
                            >
                              {effect}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    {mech.category && (
                      <Badge variant="secondary" className="text-xs shrink-0">
                        {mech.category.replace('_', ' ')}
                      </Badge>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Seção Relações/Triplets - TAGs elegantes */}
      {triplets.length > 0 && (
        <section className="space-y-3">
          <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <Link2 className="w-4 h-4 text-indigo-600" />
            Relações Extraídas ({triplets.length})
          </h4>
          
          {/* Agrupado por predicado */}
          <div className="space-y-4">
            {Object.entries(tripletsByPredicate).map(([predicate, items]) => {
              const config = getPredicateConfig(predicate);
              return (
                <div key={predicate} className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={`${config.color} font-medium`}>
                      {config.icon}
                      <span className="ml-1">{config.label}</span>
                    </Badge>
                    <span className="text-xs text-muted-foreground">({(items as any[]).length})</span>
                  </div>
                  <div className="flex flex-wrap gap-2 pl-4">
                    {(items as any[]).map((triplet: any, idx: number) => (
                      <div 
                        key={idx}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-sm ${config.color} hover:shadow-sm transition-shadow`}
                        title={`Confiança: ${((triplet.extraction_confidence || 0) * 100).toFixed(0)}%`}
                      >
                        <span className="font-medium">{triplet.subject_name}</span>
                        <ArrowRight className="w-3 h-3 opacity-60" />
                        <span>{triplet.object_name}</span>
                        {triplet.extraction_confidence && (
                          <span className="ml-1 text-xs opacity-70">
                            ({(triplet.extraction_confidence * 100).toFixed(0)}%)
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Seção Efeitos Colaterais */}
      {efeitosColaterais.length > 0 && (
        <section className="space-y-2">
          <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            Efeitos Colaterais
          </h4>
          <div className="flex flex-wrap gap-2">
            {efeitosColaterais.map((efeito: any, idx: number) => (
              <Badge 
                key={idx}
                variant="outline" 
                className="bg-amber-50 text-amber-700 border-amber-200"
              >
                {efeito.nome} ({efeito.score.toFixed(1)})
              </Badge>
            ))}
          </div>
        </section>
      )}

      {/* Mensagem quando não há dados */}
      {nutraceuticos.length === 0 && condicoes.length === 0 && mecanismos.length === 0 && triplets.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <Activity className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm">Nenhum dado extraído disponível para este estudo.</p>
          <p className="text-xs mt-1">Execute a análise IA para extrair informações.</p>
        </div>
      )}
    </div>
  );
};

export default EstudoDetailSections;
