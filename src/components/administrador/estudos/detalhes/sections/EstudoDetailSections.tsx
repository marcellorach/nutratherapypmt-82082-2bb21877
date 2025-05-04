
import React from 'react';
import { Leaf } from 'lucide-react';
import NutraceuticalTag from '../../../tags/NutraceuticalTag';
import OutcomeTag from '../../../tags/OutcomeTag';
import { Badge } from "@/components/ui/badge";

interface EstudoDetailSectionsProps {
  estudo: any;
}

const EstudoDetailSections: React.FC<EstudoDetailSectionsProps> = ({ estudo }) => {
  // Dados de exemplo - em produção viriam do estudo
  const nutraceuticos = [
    { nome: "Ômega 3", score: 4.2 },
    { nome: "Ômega 6", score: 3.9 }
  ];

  const condicoes = [
    { nome: "Artrite Canina", score: 4.5 },
    { nome: "Osteoartrite", score: 4.2 },
    { nome: "Inflamação Articular", score: 3.8 }
  ];

  const interacoesPositivas = [
    { nome: "Glucosamina", score: 4.0 },
    { nome: "MSM", score: 3.8 }
  ];

  const interacoesNegativas = [
    { nome: "Anti-inflamatórios", score: 2.5 }
  ];

  const efeitosColaterais = [
    { nome: "Sonolência Leve", score: 2.0 },
    { nome: "Alteração Apetite", score: 1.8 }
  ];

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
