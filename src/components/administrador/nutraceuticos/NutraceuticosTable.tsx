
import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import NutraceuticoDetailDialog from '../dialogs/NutraceuticoDetailDialog';
import ManageRelationshipsDialog from '../pesquisa/nutraceuticoGerenciamento/dialogs/ManageRelationshipsDialog';

interface NutraceuticosTableProps {
  nutraceuticals: any[];
}

export const NutraceuticosTable: React.FC<NutraceuticosTableProps> = ({ nutraceuticals }) => {
  const [selectedNutraceutical, setSelectedNutraceutical] = useState<any>(null);
  const [isDetailOpen, setIsDetailOpen] = useState<boolean>(false);
  const [isManageRelationsOpen, setIsManageRelationsOpen] = useState<boolean>(false);
  
  // Seleciona um nutracêutico e abre o diálogo de detalhes
  const handleViewDetails = (nutraceutical: any) => {
    setSelectedNutraceutical(nutraceutical);
    setIsDetailOpen(true);
  };
  
  // Seleciona um nutracêutico e abre o diálogo de gerenciamento de relacionamentos
  const handleManageRelations = (nutraceutical: any, event: React.MouseEvent) => {
    event.stopPropagation(); // Previne que o evento de clique propague para a linha
    setSelectedNutraceutical(nutraceutical);
    setIsManageRelationsOpen(true);
  };

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left p-3 font-medium text-sm">Nome</th>
              <th className="text-left p-3 font-medium text-sm">Descrição</th>
              <th className="text-left p-3 font-medium text-sm">Outcome</th>
              <th className="text-left p-3 font-medium text-sm">Condições</th>
              <th className="text-left p-3 font-medium text-sm">Estudos</th>
              <th className="text-right p-3 font-medium text-sm">Ações</th>
            </tr>
          </thead>
          <tbody>
            {nutraceuticals.map((nutraceutical) => (
              <tr 
                key={nutraceutical.id} 
                className="border-b hover:bg-muted/30 cursor-pointer"
                onClick={() => handleViewDetails(nutraceutical)}
              >
                <td className="p-3 font-medium">{nutraceutical.name}</td>
                <td className="p-3 text-sm max-w-xs truncate">
                  {nutraceutical.description || 'Sem descrição'}
                </td>
                <td className="p-3">
                  {nutraceutical.outcome ? (
                    <Badge variant="outline">{nutraceutical.outcome.name}</Badge>
                  ) : 
                    <span className="text-sm text-muted-foreground">-</span>
                  }
                </td>
                <td className="p-3">
                  {nutraceutical.health_conditions?.length > 0 ? (
                    <Badge>{nutraceutical.health_conditions.length}</Badge>
                  ) : (
                    <span className="text-sm text-muted-foreground">-</span>
                  )}
                </td>
                <td className="p-3">
                  {nutraceutical.studies?.length > 0 ? (
                    <Badge>{nutraceutical.studies.length}</Badge>
                  ) : (
                    <span className="text-sm text-muted-foreground">-</span>
                  )}
                </td>
                <td className="p-3 text-right">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => handleManageRelations(nutraceutical, e)}
                    title="Gerenciar relacionamentos"
                  >
                    <ChevronDown size={16} />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Diálogo de detalhes */}
      <NutraceuticoDetailDialog 
        open={isDetailOpen}
        onOpenChange={setIsDetailOpen}
        nutraceutical={selectedNutraceutical}
      />
      
      {/* Diálogo de gerenciamento de relacionamentos */}
      <ManageRelationshipsDialog
        open={isManageRelationsOpen}
        onOpenChange={setIsManageRelationsOpen}
        nutraceutical={selectedNutraceutical}
      />
    </>
  );
};
