import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Network } from 'lucide-react';

interface Row { source: string; pipelines: string[]; tables: string[] }

const USAGE: Row[] = [
  { source: 'UMLS / SNOMED-CT', pipelines: ['fetch-external-ontologies', 'ontology-mapping-service'], tables: ['health_conditions.snomed_code', 'health_conditions.umls_cui', 'nutraceuticals.snomed_code'] },
  { source: 'MeSH', pipelines: ['import-canonical-ids', 'kg-evidence-gap-fill'], tables: ['health_conditions.canonical_id', 'nutraceuticals.canonical_id'] },
  { source: 'OMIA', pipelines: ['import-canonical-ids', 'breed-predispositions'], tables: ['health_conditions.canonical_id', 'breed_predispositions'] },
  { source: 'ChEBI / PubChem / KEGG', pipelines: ['fetch-external-ontologies', 'ExternalSearchPanel'], tables: ['nutraceuticals.canonical_id', 'base_knowledge_candidates'] },
  { source: 'PubMed / NCBI', pipelines: ['kg-evidence-gap-fill', 'search-scientific-studies'], tables: ['scientific_studies', 'triplet_extractions'] },
  { source: 'Perplexity', pipelines: ['kg-evidence-gap-fill', 'query-perplexity'], tables: ['triplet_extractions (pending)'] },
];

const UsageMap: React.FC = () => {
  const { t } = useTranslation();
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Network className="h-4 w-4" /> {t('externalSources.usage.title')}
        </CardTitle>
        <p className="text-xs text-muted-foreground">{t('externalSources.usage.description')}</p>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[180px]">{t('externalSources.usage.source')}</TableHead>
              <TableHead>{t('externalSources.usage.pipelines')}</TableHead>
              <TableHead>{t('externalSources.usage.tables')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {USAGE.map(r => (
              <TableRow key={r.source}>
                <TableCell className="font-medium text-sm">{r.source}</TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {r.pipelines.map(p => <Badge key={p} variant="secondary" className="text-[10px] font-mono">{p}</Badge>)}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {r.tables.map(t2 => <Badge key={t2} variant="outline" className="text-[10px] font-mono">{t2}</Badge>)}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default UsageMap;