import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Key, ExternalLink, CheckCircle2, XCircle } from 'lucide-react';
import type { SourceStatus } from './SourceStatusCard';

interface Props { sources: SourceStatus[] }

const SecretsPanel: React.FC<Props> = ({ sources }) => {
  const { t } = useTranslation();
  const seen = new Set<string>();
  const secrets = sources
    .filter(s => s.secret_name && !seen.has(s.secret_name!) && seen.add(s.secret_name!))
    .map(s => ({ secret: s.secret_name!, configured: s.configured, docs: s.docs_url, owner: s.name, required: s.requires_key }));

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Key className="h-4 w-4" /> {t('externalSources.secrets.title')}
        </CardTitle>
        <p className="text-xs text-muted-foreground">{t('externalSources.secrets.description')}</p>
      </CardHeader>
      <CardContent className="space-y-2">
        {secrets.map(s => (
          <div key={s.secret} className="flex items-center justify-between gap-3 py-2 border-b last:border-0">
            <div className="flex items-center gap-2 min-w-0">
              {s.configured
                ? <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                : <XCircle className={`h-4 w-4 flex-shrink-0 ${s.required ? 'text-red-600' : 'text-amber-600'}`} />}
              <code className="text-xs font-mono truncate">{s.secret}</code>
              {!s.required && <Badge variant="outline" className="text-[10px]">{t('externalSources.secrets.optional')}</Badge>}
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <Button size="sm" variant="ghost" className="text-xs h-7" asChild>
                <a href={s.docs} target="_blank" rel="noopener noreferrer">
                  {t('externalSources.secrets.howToGet')} <ExternalLink className="h-3 w-3 ml-1" />
                </a>
              </Button>
            </div>
          </div>
        ))}
        <p className="text-xs text-muted-foreground pt-3">
          {t('externalSources.secrets.addHint')}
        </p>
      </CardContent>
    </Card>
  );
};

export default SecretsPanel;