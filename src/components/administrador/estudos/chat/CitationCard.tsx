import { Quote, FileText } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useTranslation } from "react-i18next";

interface CitationCardProps {
  citation: string;
  section?: string;
}

export const CitationCard = ({ citation, section }: CitationCardProps) => {
  const { t } = useTranslation();
  
  return (
    <Card className="p-3 my-2 bg-blue-50 dark:bg-blue-950/20 border-l-4 border-blue-400">
      <div className="flex items-start gap-2">
        <Quote className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="text-xs font-medium text-blue-900 dark:text-blue-100 mb-1">
            {t("chat.citation")}
          </div>
          <div className="text-sm text-blue-800 dark:text-blue-200 break-words">
            {citation}
          </div>
          {section && (
            <div className="flex items-center gap-1 mt-2 text-xs text-blue-600 dark:text-blue-400">
              <FileText className="h-3 w-3" />
              <span>{section}</span>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};
