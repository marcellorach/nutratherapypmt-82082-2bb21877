import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp, BookOpen, Wrench, CircleHelp, Activity } from 'lucide-react';

const STORAGE_KEY = 'external-sources-intro-open';

const OverviewIntro: React.FC = () => {
  const { t } = useTranslation();
  const [open, setOpen] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === null ? true : stored === '1';
  });

  const toggle = (v: boolean) => {
    setOpen(v);
    if (typeof window !== 'undefined') localStorage.setItem(STORAGE_KEY, v ? '1' : '0');
  };

  return (
    <Card className="border-primary/30 bg-primary/5">
      <Collapsible open={open} onOpenChange={toggle}>
        <CardContent className="p-4">
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full justify-between h-auto p-0 hover:bg-transparent">
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-primary" />
                <span className="font-semibold text-sm">{t('externalSources.intro.title')}</span>
              </div>
              {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </CollapsibleTrigger>

          <CollapsibleContent className="mt-4 space-y-4 text-sm">
            <section>
              <h4 className="flex items-center gap-2 font-medium mb-1">
                <BookOpen className="h-3.5 w-3.5" /> {t('externalSources.intro.whatTitle')}
              </h4>
              <p className="text-muted-foreground">{t('externalSources.intro.whatBody')}</p>
            </section>

            <section>
              <h4 className="flex items-center gap-2 font-medium mb-1">
                <Wrench className="h-3.5 w-3.5" /> {t('externalSources.intro.howTitle')}
              </h4>
              <ol className="list-decimal list-inside text-muted-foreground space-y-1">
                <li>{t('externalSources.intro.howStep1')}</li>
                <li>{t('externalSources.intro.howStep2')}</li>
                <li>{t('externalSources.intro.howStep3')}</li>
                <li>{t('externalSources.intro.howStep4')}</li>
              </ol>
            </section>

            <section>
              <h4 className="flex items-center gap-2 font-medium mb-1">
                <Activity className="h-3.5 w-3.5" /> {t('externalSources.intro.statusTitle')}
              </h4>
              <ul className="text-muted-foreground space-y-1">
                <li>🟢 <strong>{t('externalSources.intro.statusOkLabel')}</strong> — {t('externalSources.intro.statusOk')}</li>
                <li>🟡 <strong>{t('externalSources.intro.statusPendingLabel')}</strong> — {t('externalSources.intro.statusPending')}</li>
                <li>🔴 <strong>{t('externalSources.intro.statusErrorLabel')}</strong> — {t('externalSources.intro.statusError')}</li>
                <li>⚪ <strong>{t('externalSources.intro.statusEmptyLabel')}</strong> — {t('externalSources.intro.statusEmpty')}</li>
              </ul>
            </section>

            <section>
              <h4 className="flex items-center gap-2 font-medium mb-1">
                <CircleHelp className="h-3.5 w-3.5" /> {t('externalSources.intro.debugTitle')}
              </h4>
              <ul className="list-disc list-inside text-muted-foreground space-y-1">
                <li>{t('externalSources.intro.debug1')}</li>
                <li>{t('externalSources.intro.debug2')}</li>
                <li>{t('externalSources.intro.debug3')}</li>
                <li>{t('externalSources.intro.debug4')}</li>
              </ul>
            </section>
          </CollapsibleContent>
        </CardContent>
      </Collapsible>
    </Card>
  );
};

export default OverviewIntro;