
import React, { useState } from 'react';
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Study } from '../types/oraBiomedical';
import StudyDetailsDialog from './StudyDetailsDialog';
import { useTranslation } from 'react-i18next';

interface StudyCardProps {
  study: Study;
}

const StudyCard: React.FC<StudyCardProps> = ({ study }) => {
  const [showDetails, setShowDetails] = useState(false);
  const { t } = useTranslation();

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-lg font-semibold">{study.title}</h3>
              <p className="text-sm text-muted-foreground">{study.description}</p>
            </div>
            <Button variant="outline" onClick={() => setShowDetails(true)}>
              {t('admin.studies.studyCard.viewDetails')}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 text-sm">
            <div className="flex justify-between">
              <span className="font-medium">{t('admin.studies.studyCard.status')}</span>
              <span>{study.status}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">{t('admin.studies.studyCard.start')}</span>
              <span>{study.startDate}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">{t('admin.studies.studyCard.end')}</span>
              <span>{study.endDate || t('admin.studies.studyCard.ongoing')}</span>
            </div>
            {study.objective && (
              <div className="flex justify-between">
                <span className="font-medium">{t('admin.studies.studyCard.objective')}</span>
                <span>{study.objective}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <StudyDetailsDialog study={study} />
      </Dialog>
    </>
  );
};

export default StudyCard;
