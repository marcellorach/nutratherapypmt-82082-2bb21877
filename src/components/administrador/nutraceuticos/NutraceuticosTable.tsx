
import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText } from "lucide-react";
import { Nutraceutical } from "@/types";

interface NutraceuticosTableProps {
  nutraceuticals: Nutraceutical[];
  onOpenDetails: (nutraceutical: Nutraceutical) => void;
}

export const NutraceuticosTable: React.FC<NutraceuticosTableProps> = ({ 
  nutraceuticals,
  onOpenDetails
}) => {
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>Condição de Saúde</TableHead>
            <TableHead>Evidência</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {nutraceuticals.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} className="text-center py-8 text-gray-500">
                Nenhum nutracêutico encontrado com os filtros selecionados.
              </TableCell>
            </TableRow>
          ) : (
            nutraceuticals.map((item) => (
              <TableRow key={item.id} className="hover:bg-gray-50">
                <TableCell className="font-medium">{item.name}</TableCell>
                <TableCell>
                  <Badge variant="outline" className="bg-slate-50">
                    {item.condition}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center">
                    <span className="font-medium mr-1">{item.scientificEvidence.efficacyScore.toFixed(1)}</span>
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <span 
                          key={i}
                          className={`text-sm ${
                            i < Math.floor(item.scientificEvidence.efficacyScore) 
                              ? "text-amber-400" 
                              : "text-gray-300"
                          }`}
                        >
                          ★
                        </span>
                      ))}
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => onOpenDetails(item)}
                    className="hover:bg-gray-100"
                  >
                    <FileText className="h-4 w-4 mr-1" />
                    Detalhes
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
};
