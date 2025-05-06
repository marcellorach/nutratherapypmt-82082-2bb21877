
import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from '@/components/ui/badge';

interface Nutraceutical {
  id: string;
  name: string;
  efficacy: number;
  condition: string;
  studies: number;
}

interface Props {
  data: Nutraceutical[];
  isLoading?: boolean;
  sortField: string;
  sortDirection: 'asc' | 'desc';
  setSortField: (field: string) => void;
  setSortDirection: (direction: 'asc' | 'desc') => void;
}

const EfficacyMatrixTable: React.FC<Props> = ({
  data,
  isLoading = false,
  sortField,
  sortDirection,
  setSortField,
  setSortDirection
}) => {
  const handleSort = (field: string) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  if (isLoading) {
    return (
      <div className="rounded-md border p-8 text-center">
        <div className="flex justify-center">
          <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full"></div>
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="rounded-md border p-8 text-center">
        <p className="text-muted-foreground">
          Não há dados para exibir
        </p>
      </div>
    );
  }

  const getSortIcon = (field: string) => {
    if (field === sortField) {
      return <ArrowUpDown className={`inline-block h-4 w-4 ml-2 ${sortDirection === 'asc' ? 'rotate-180' : ''}`} />;
    }
    return <ArrowUpDown className="inline-block h-4 w-4 ml-2 opacity-30" />;
  };

  return (
    <div className="rounded-md border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>
              <Button 
                variant="ghost" 
                onClick={() => handleSort('name')}
                className="h-8 p-0 font-medium"
              >
                Nome {getSortIcon('name')}
              </Button>
            </TableHead>
            <TableHead>
              <Button 
                variant="ghost" 
                onClick={() => handleSort('condition')}
                className="h-8 p-0 font-medium"
              >
                Condição {getSortIcon('condition')}
              </Button>
            </TableHead>
            <TableHead className="text-right">
              <Button 
                variant="ghost" 
                onClick={() => handleSort('efficacy')}
                className="h-8 p-0 font-medium"
              >
                Eficácia {getSortIcon('efficacy')}
              </Button>
            </TableHead>
            <TableHead className="text-right">
              <Button 
                variant="ghost" 
                onClick={() => handleSort('studies')}
                className="h-8 p-0 font-medium"
              >
                Estudos {getSortIcon('studies')}
              </Button>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((item) => (
            <TableRow key={item.id}>
              <TableCell className="font-medium">{item.name}</TableCell>
              <TableCell>
                <Badge variant="outline">{item.condition}</Badge>
              </TableCell>
              <TableCell className="text-right">{item.efficacy.toFixed(1)}</TableCell>
              <TableCell className="text-right">{item.studies}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default EfficacyMatrixTable;
