
import React from 'react';
import { Leaf } from 'lucide-react';
import NutraceuticalTag from '../../../tags/NutraceuticalTag';
import OutcomeTag from '../../../tags/OutcomeTag';
import { Badge } from "@/components/ui/badge";

interface EstudoDetailSectionsProps {
  estudo: any;
}

const EstudoDetailSections: React.FC<EstudoDetailSectionsProps> = ({ estudo }) => {
  // Extrair dados reais do analysis_data
  const analysisData = estudo?.analysis_data || {};
  
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
  
  // Sinergias/Interações positivas
  const interacoesPositivas = (analysisData.synergies || []).map((s: any) => ({
    nome: s.compound || s.name || 'N/A',
    score: s.confidence || 3.0
  }));
  
  // Interações negativas (contraindications)
  const interacoesNegativas = (analysisData.contraindications || []).map((ci: any) => ({
    nome: ci.name || ci.contraindication || 'N/A',
    score: ci.severity === 'high' ? 4.0 : ci.severity === 'moderate' ? 3.0 : 2.0
  }));
  
  // Efeitos colaterais detalhados
  const efeitosColaterais = (analysisData.detailedSideEffects || analysisData.extractedSideEffects || []).map((e: any) => ({
    nome: e.name,
    score: e.severity === 'mild' ? 2.0 : e.severity === 'moderate' ? 3.0 : 4.0
  }));

  return (
    <div className="space-y-6">
      {/* Seção Nutraceuticos */}
      <section className="space-y-2">
        <h4 className="text-sm font-medium text-gray-500">Nutraceuticos</h4>
        <div className="flex flex-wrap gap-2">
          {nutraceuticos.map((nutra, idx) => (
            <NutraceuticalTag 
              key={idx}
              name={nutra.nome}
              score={nutra.score}
            />
          ))}
        </div>
      </section>

      {/* Seção Condições */}
      <section className="space-y-2">
        <h4 className="text-sm font-medium text-gray-500">Condições</h4>
        <div className="flex flex-wrap gap-2">
          {condicoes.map((condicao, idx) => (
            <OutcomeTag 
              key={idx}
              outcome={condicao.nome}
              score={condicao.score}
            />
          ))}
        </div>
      </section>

      {/* Seção Interações Positivas */}
      <section className="space-y-2">
        <h4 className="text-sm font-medium text-gray-500">Interações Positivas</h4>
        <div className="flex flex-wrap gap-2">
          {interacoesPositivas.map((interacao, idx) => (
            <Badge 
              key={idx}
              variant="outline" 
              className="bg-green-50 text-green-700 border-green-200"
            >
              <Leaf className="w-3 h-3 mr-1 inline" />
              {interacao.nome} ({interacao.score.toFixed(1)})
            </Badge>
          ))}
        </div>
      </section>

      {/* Seção Interações Negativas */}
      <section className="space-y-2">
        <h4 className="text-sm font-medium text-gray-500">Interações Negativas</h4>
        <div className="flex flex-wrap gap-2">
          {interacoesNegativas.map((interacao, idx) => (
            <Badge 
              key={idx}
              variant="outline" 
              className="bg-red-50 text-red-700 border-red-200"
            >
              {interacao.nome} ({interacao.score.toFixed(1)})
            </Badge>
          ))}
        </div>
      </section>

      {/* Seção Efeitos Colaterais */}
      <section className="space-y-2">
        <h4 className="text-sm font-medium text-gray-500">Efeitos Colaterais</h4>
        <div className="flex flex-wrap gap-2">
          {efeitosColaterais.map((efeito, idx) => (
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
    </div>
  );
};

export default EstudoDetailSections;
