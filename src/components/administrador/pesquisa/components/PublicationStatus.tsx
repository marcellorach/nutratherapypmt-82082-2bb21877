import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  BookOpen, 
  Clock, 
  CheckCircle, 
  XCircle, 
  FileText, 
  ExternalLink,
  AlertCircle 
} from "lucide-react";
import { Publication } from '../types/oraBiomedical';

interface PublicationStatusProps {
  publications: Publication[];
}

const PublicationStatus: React.FC<PublicationStatusProps> = ({ publications }) => {
  const getStatusIcon = (status: Publication['status']) => {
    switch (status) {
      case 'publicado':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'aceito':
        return <CheckCircle className="h-4 w-4 text-blue-600" />;
      case 'em revisão':
      case 'submetido':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'negado':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'não submetido':
        return <AlertCircle className="h-4 w-4 text-gray-400" />;
      default:
        return <FileText className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: Publication['status']) => {
    switch (status) {
      case 'publicado':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'aceito':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'em revisão':
      case 'submetido':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'negado':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'não submetido':
        return 'bg-gray-100 text-gray-600 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-600 border-gray-200';
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('pt-BR');
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <BookOpen className="h-5 w-5" />
          Status das Publicações
        </h3>
        <div className="text-sm text-muted-foreground">
          {publications.length} submissão{publications.length !== 1 ? 'ões' : ''}
        </div>
      </div>

      {publications.length === 0 ? (
        <Card>
          <CardContent className="flex items-center justify-center py-8">
            <div className="text-center text-muted-foreground">
              <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>Nenhuma publicação cadastrada</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {publications.map((publication, index) => (
            <Card key={index} className="border-l-4 border-l-primary/20">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-base font-medium line-clamp-2">
                      {publication.title}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      {publication.journal}
                      {publication.impactFactor && (
                        <span className="ml-2 text-xs font-medium">
                          (IF: {publication.impactFactor})
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    {getStatusIcon(publication.status)}
                    <Badge 
                      variant="outline" 
                      className={getStatusColor(publication.status)}
                    >
                      {publication.status}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="pt-0">
                <div className="flex items-center justify-between text-sm">
                  <div className="space-y-1">
                    {publication.submissionDate && (
                      <p className="text-muted-foreground">
                        <span className="font-medium">Submetido:</span> {formatDate(publication.submissionDate)}
                      </p>
                    )}
                    {publication.publicationDate && (
                      <p className="text-muted-foreground">
                        <span className="font-medium">Publicado:</span> {formatDate(publication.publicationDate)}
                      </p>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {publication.doi && (
                      <Button 
                        size="sm" 
                        variant="outline"
                        className="text-xs"
                        onClick={() => window.open(`https://doi.org/${publication.doi}`, '_blank')}
                      >
                        <ExternalLink className="h-3 w-3 mr-1" />
                        DOI
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default PublicationStatus;