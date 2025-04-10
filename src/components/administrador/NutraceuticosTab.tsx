
import React from 'react';
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { nutraceuticals } from '@/data/mockData';

const NutraceuticosTab: React.FC = () => {
  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold">Catálogo de Nutracêuticos</h2>
        <Button className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Adicionar Nutracêutico
        </Button>
      </div>
      
      <div className="bg-white rounded-md shadow">
        <div className="p-4 border-b">
          <Input placeholder="Buscar nutracêutico..." />
        </div>
        
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead>Evidência</TableHead>
              <TableHead>Contraindicações</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {nutraceuticals.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">{item.name}</TableCell>
                <TableCell className="max-w-xs truncate">{item.description}</TableCell>
                <TableCell>{item.scientificEvidence.efficacyScore}/5</TableCell>
                <TableCell>{item.contraindications.length}</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm">Editar</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  );
};

export default NutraceuticosTab;
