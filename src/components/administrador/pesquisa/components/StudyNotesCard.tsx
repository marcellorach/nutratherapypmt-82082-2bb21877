
import React from 'react';
import { Card } from "@/components/ui/card";
import { CheckCircle2, AlertTriangle, FlaskConical, TrendingUp } from "lucide-react";
import { useTranslation } from 'react-i18next';

interface StudyNotesCardProps {
  notes: string;
}

interface ParsedNotes {
  introduction: string;
  results: string[];
  limitations: string[];
  nextSteps: string[];
}

const StudyNotesCard: React.FC<StudyNotesCardProps> = ({ notes }) => {
  const { t } = useTranslation();

  const parseNotes = (text: string): ParsedNotes => {
    const lines = text.split('\n').filter(line => line.trim());
    
    const parsed: ParsedNotes = {
      introduction: '',
      results: [],
      limitations: [],
      nextSteps: []
    };

    let currentSection: 'intro' | 'results' | 'limitations' | 'nextSteps' = 'intro';

    lines.forEach(line => {
      const trimmed = line.trim();
      
      // Detect sections
      if (trimmed.includes('**Current Limitations**') || trimmed.includes('**Limitações Atuais**')) {
        currentSection = 'limitations';
        return;
      }
      if (trimmed.includes('**Next Steps**') || trimmed.includes('**Próximos Passos**')) {
        currentSection = 'nextSteps';
        return;
      }
      
      // Extract content
      if (currentSection === 'intro' && !trimmed.startsWith('✅') && !trimmed.startsWith('⚠️') && !trimmed.startsWith('🔬')) {
        if (!trimmed.includes('**') || trimmed.includes('observe:')) {
          parsed.introduction += trimmed + ' ';
        }
      } else if (trimmed.startsWith('✅')) {
        parsed.results.push(trimmed.replace('✅', '').trim());
      } else if (currentSection === 'limitations' && trimmed.startsWith('-')) {
        parsed.limitations.push(trimmed.replace('-', '').trim());
      } else if (currentSection === 'nextSteps' && trimmed.startsWith('-')) {
        parsed.nextSteps.push(trimmed.replace('-', '').trim());
      }
    });

    return parsed;
  };

  const parsedNotes = parseNotes(notes);

  return (
    <div className="space-y-4 mt-4">
      {/* Preliminary Results - Consolidated Card */}
      {(parsedNotes.introduction || parsedNotes.results.length > 0) && (
        <Card className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <div className="flex items-start gap-3">
            <TrendingUp className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-blue-900 mb-2">
                {t('admin.studies.ongoingStudies.notes.preliminaryResults')}
              </h4>
              
              {parsedNotes.introduction && (
                <p className="text-sm text-gray-700 leading-relaxed mb-3">
                  {parsedNotes.introduction}
                </p>
              )}
              
              {parsedNotes.results.length > 0 && (
                <ul className="space-y-2">
                  {parsedNotes.results.map((result, index) => {
                    const match = result.match(/\*\*(.+?)\*\*:\s*(.+)/);
                    const category = match ? match[1] : '';
                    const content = match ? match[2] : result;
                    
                    return (
                      <li key={index} className="text-sm text-gray-700 leading-relaxed flex items-start gap-2">
                        <span className="text-blue-600 mt-1">•</span>
                        <span>
                          {category && <strong className="text-gray-900">{category}:</strong>}
                          {' '}{content}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* Limitations */}
      {parsedNotes.limitations.length > 0 && (
        <Card className="p-4 bg-amber-50 border-amber-200">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
            <div className="space-y-2 flex-1">
              <h4 className="text-sm font-semibold text-amber-900">
                {t('admin.studies.ongoingStudies.notes.currentLimitations')}
              </h4>
              <ul className="space-y-1.5">
                {parsedNotes.limitations.map((limitation, index) => (
                  <li key={index} className="text-xs text-amber-800 leading-relaxed pl-4 relative before:content-['•'] before:absolute before:left-0">
                    {limitation}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Card>
      )}

      {/* Next Steps */}
      {parsedNotes.nextSteps.length > 0 && (
        <Card className="p-4 bg-purple-50 border-purple-200">
          <div className="flex items-start gap-3">
            <FlaskConical className="h-5 w-5 text-purple-600 mt-0.5 flex-shrink-0" />
            <div className="space-y-2 flex-1">
              <h4 className="text-sm font-semibold text-purple-900">
                {t('admin.studies.ongoingStudies.notes.nextSteps')}
              </h4>
              <ul className="space-y-1.5">
                {parsedNotes.nextSteps.map((step, index) => (
                  <li key={index} className="text-xs text-purple-800 leading-relaxed pl-4 relative before:content-['•'] before:absolute before:left-0">
                    {step}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default StudyNotesCard;
