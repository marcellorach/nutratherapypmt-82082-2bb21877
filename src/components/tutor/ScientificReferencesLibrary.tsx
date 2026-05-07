import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { BookOpen, ExternalLink, Search } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@/components/ui/accordion';
import { useProposalReferences } from '@/hooks/useProposalReferences';
import { filterReferences } from '@/services/references-builder';

interface Props {
  compounds: string[];
  conditions: string[];
}

const ScientificReferencesLibrary: React.FC<Props> = ({
  compounds,
  conditions,
}) => {
  const { t } = useTranslation();
  const { references, loading } = useProposalReferences(compounds, conditions);
  const [query, setQuery] = useState('');

  const filtered = useMemo(
    () => filterReferences(references, query),
    [references, query],
  );

  if (!loading && references.length === 0) return null;

  return (
    <div>
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <h3 className="font-semibold text-foreground flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-primary" />
          {t('tutor.proposal.references.title')}
        </h3>
        <Badge variant="outline" className="text-[11px]">
          {t('tutor.proposal.references.count', { count: references.length })}
        </Badge>
      </div>
      <p className="text-xs text-muted-foreground mb-3">
        {t('tutor.proposal.references.description')}
      </p>

      {references.length > 3 && (
        <div className="relative mb-3">
          <Search className="h-3.5 w-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('tutor.proposal.references.searchPlaceholder')}
            className="pl-8 h-8 text-xs"
          />
        </div>
      )}

      {filtered.length === 0 ? (
        <p className="text-xs text-muted-foreground italic py-4 text-center">
          {t('tutor.proposal.references.empty')}
        </p>
      ) : (
        <Accordion type="multiple" className="border rounded-md">
          {filtered.map((ref, idx) => (
            <AccordionItem
              key={ref.id}
              value={ref.id}
              className="border-b last:border-b-0"
            >
              <AccordionTrigger className="px-3 py-2 text-left hover:no-underline">
                <div className="flex items-start gap-2 text-xs flex-1 min-w-0">
                  <span className="text-muted-foreground shrink-0 font-mono">
                    [{idx + 1}]
                  </span>
                  <span className="text-foreground line-clamp-2 flex-1">
                    {ref.title || t('tutor.proposal.references.untitled')}
                  </span>
                  {ref.year && (
                    <Badge variant="secondary" className="text-[10px] shrink-0">
                      {ref.year}
                    </Badge>
                  )}
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-3 pb-3 pt-0 space-y-2 text-xs">
                <p className="text-muted-foreground leading-relaxed">
                  {ref.vancouver}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {ref.compounds.slice(0, 4).map((c) => (
                    <Badge
                      key={`c-${c}`}
                      variant="outline"
                      className="text-[10px] border-emerald-300 text-emerald-800 dark:text-emerald-300 dark:border-emerald-700"
                    >
                      {c}
                    </Badge>
                  ))}
                  {ref.conditions.slice(0, 4).map((c) => (
                    <Badge
                      key={`d-${c}`}
                      variant="outline"
                      className="text-[10px] border-blue-300 text-blue-800 dark:text-blue-300 dark:border-blue-700"
                    >
                      {c}
                    </Badge>
                  ))}
                </div>
                {ref.url && (
                  <a
                    href={ref.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] text-primary hover:underline"
                  >
                    {ref.pmid
                      ? `PMID ${ref.pmid}`
                      : ref.doi
                        ? `doi:${ref.doi}`
                        : t('tutor.proposal.references.openSource')}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}
    </div>
  );
};

export default ScientificReferencesLibrary;