
import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FolderInput } from "lucide-react";
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import HistoryTab from './HistoryTab';

interface TabHeaderProps {
  activeTab: string;
  scispaceLogo: string;
  onProcessWithAI?: () => void;
}

const TabHeader: React.FC<TabHeaderProps> = ({ activeTab, scispaceLogo, onProcessWithAI }) => {
  const { t } = useTranslation();
  const [showHistory, setShowHistory] = useState(false);
  
  return (
    <>
      <div className="p-6 pb-0 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight mb-1">{t('studies.import.title')}</h2>
          <p className="text-muted-foreground">
            {t('studies.import.description')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowHistory(true)}
            className="flex items-center gap-1 text-muted-foreground"
          >
            <FolderInput className="h-4 w-4" />
            <span>{t('studies.import.importHistory')}</span>
          </Button>
          {activeTab === 'scispace-api' && (
            <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200 flex items-center gap-1">
              <img 
                src={scispaceLogo} 
                alt="SciSpace Logo" 
                className="h-8 w-auto mr-1 inline-block" 
              />
            </Badge>
          )}
        </div>
      </div>

      <Dialog open={showHistory} onOpenChange={setShowHistory}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('studies.import.importHistory')}</DialogTitle>
          </DialogHeader>
          <HistoryTab onProcessWithAI={onProcessWithAI || (() => {})} />
        </DialogContent>
      </Dialog>
    </>
  );
};

export default TabHeader;
