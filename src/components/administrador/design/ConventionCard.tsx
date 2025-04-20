
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle, Clock, Edit, XCircle } from "lucide-react";
import { DesignConvention } from "@/types/design";

interface ConventionCardProps {
  convention: DesignConvention;
  onEditClick: (section: string) => void;
}

export const ConventionCard = ({ convention, onEditClick }: ConventionCardProps) => {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 flex items-center">
            <CheckCircle className="w-3 h-3 mr-1" />
            Aprovado
          </Badge>
        );
      case 'pending':
        return (
          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 flex items-center">
            <Clock className="w-3 h-3 mr-1" />
            Em Análise
          </Badge>
        );
      case 'rejected':
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 flex items-center">
            <XCircle className="w-3 h-3 mr-1" />
            Rejeitado
          </Badge>
        );
      default:
        return null;
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>{convention.section}</CardTitle>
          <CardDescription className="flex items-center gap-2">
            Última atualização: {new Date(convention.updated_at).toLocaleDateString()}
            {getStatusBadge(convention.status)}
          </CardDescription>
        </div>
        <Button 
          onClick={() => onEditClick(convention.section)}
          variant="ghost"
          className="flex items-center gap-2"
          disabled={convention.status === 'pending'}
        >
          <Edit className="w-4 h-4" />
          Propor Alterações
        </Button>
      </CardHeader>
      <CardContent>
        <div className="whitespace-pre-wrap">{convention.content}</div>
      </CardContent>
    </Card>
  );
};
