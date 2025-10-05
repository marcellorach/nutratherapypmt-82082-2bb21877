import React from 'react';
import { useTranslation } from 'react-i18next';
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
  AlertCircle,
  Stethoscope,
  Microscope,
  Users
} from "lucide-react";
import { Publication } from '../types/oraBiomedical';

interface PublicationStatusProps {
  publications: Publication[];
}

const PublicationStatus: React.FC<PublicationStatusProps> = ({ publications }) => {
  const { t } = useTranslation();

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

  const getStatusText = (status: Publication['status']) => {
    const statusMap: Record<Publication['status'], string> = {
      'publicado': t('admin.studies.publications.status.published'),
      'aceito': t('admin.studies.publications.status.accepted'),
      'em revisão': t('admin.studies.publications.status.underReview'),
      'submetido': t('admin.studies.publications.status.submitted'),
      'negado': t('admin.studies.publications.status.rejected'),
      'não submetido': t('admin.studies.publications.status.notSubmitted')
    };
    return statusMap[status];
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('pt-BR');
  };

  const getJournalIcon = (category?: string) => {
    switch (category) {
      case 'veterinária':
        return <Stethoscope className="h-4 w-4 text-blue-600" />;
      case 'biomédica':
        return <Microscope className="h-4 w-4 text-purple-600" />;
      default:
        return <FileText className="h-4 w-4 text-gray-600" />;
    }
  };

  const getJournalTypeBadge = (type?: string) => {
    if (type === 'nacional') {
      return <Badge variant="secondary" className="text-xs">{t('admin.studies.publications.type.national')}</Badge>;
    }
    if (type === 'internacional') {
      return <Badge variant="outline" className="text-xs">{t('admin.studies.publications.type.international')}</Badge>;
    }
    return null;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <BookOpen className="h-5 w-5" />
          {t('admin.studies.publications.title')}
        </h3>
        <div className="text-sm text-muted-foreground">
          {publications.length} {publications.length === 1 ? t('admin.studies.publications.submission') : t('admin.studies.publications.submissions')}
        </div>
      </div>

      {publications.length === 0 ? (
        <Card>
          <CardContent className="flex items-center justify-center py-8">
            <div className="text-center text-muted-foreground">
              <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>{t('admin.studies.publications.noPublications')}</p>
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
                     <div className="flex items-center gap-2 mt-1">
                       <div className="flex items-center gap-1">
                         {getJournalIcon(publication.journalCategory)}
                         <p className="text-sm text-muted-foreground">
                           {publication.journal}
                         </p>
                       </div>
                       {getJournalTypeBadge(publication.journalType)}
                       {publication.impactFactor && (
                         <span className="text-xs font-medium text-muted-foreground">
                           IF: {publication.impactFactor}
                         </span>
                       )}
                     </div>
                     <div className="flex items-center gap-1 mt-2">
                       <Users className="h-3 w-3 text-muted-foreground" />
                       <p className="text-xs text-muted-foreground line-clamp-1">
                         {publication.authors}
                       </p>
                     </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    {getStatusIcon(publication.status)}
                    <Badge 
                      variant="outline" 
                      className={getStatusColor(publication.status)}
                    >
                      {getStatusText(publication.status)}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="pt-0">
                <div className="flex items-center justify-between text-sm">
                  <div className="space-y-1">
                    {publication.submissionDate && (
                      <p className="text-muted-foreground">
                        <span className="font-medium">{t('admin.studies.publications.submittedOn')}</span> {formatDate(publication.submissionDate)}
                      </p>
                    )}
                    {publication.publicationDate && (
                      <p className="text-muted-foreground">
                        <span className="font-medium">{t('admin.studies.publications.publishedOn')}</span> {formatDate(publication.publicationDate)}
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
                        {t('admin.studies.publications.viewDoi')}
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
