import React from "react";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { AI_INVENTORY, type AIInventoryStatus } from "@/data/aiInventory.generated";

const ORDER: AIInventoryStatus[] = ["obeys_screen", "hardcoded", "unregistered", "infra"];

/** Lista honesta de todas as rotinas que chamam IA, agrupadas pelo que o código faz de fato. */
const AIInventoryCard: React.FC = () => {
  const { t } = useTranslation();
  const groups = ORDER.map((s) => ({ status: s, rows: AI_INVENTORY.filter((r) => r.status === s) }));

  return (
    <div className="rounded-md border p-3 space-y-2">
      <div>
        <div className="font-medium text-sm">{t("aiGovernance.inventory.title", { count: AI_INVENTORY.length })}</div>
        <p className="text-[11px] text-muted-foreground">{t("aiGovernance.inventory.description")}</p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-center">
        {groups.map((g) => (
          <div key={g.status} className="rounded-md border bg-muted/30 p-2">
            <div className="text-xl font-semibold">{g.rows.length}</div>
            <div className="text-[11px] text-muted-foreground">{t(`aiGovernance.inventory.status.${g.status}`)}</div>
          </div>
        ))}
      </div>
      <Accordion type="multiple">
        {groups.map((g) => (
          <AccordionItem key={g.status} value={g.status}>
            <AccordionTrigger className="text-xs py-2">
              {t(`aiGovernance.inventory.status.${g.status}`)} ({g.rows.length})
            </AccordionTrigger>
            <AccordionContent>
              <p className="text-[11px] text-muted-foreground mb-2">{t(`aiGovernance.inventory.hint.${g.status}`)}</p>
              <ul className="space-y-1">
                {g.rows.map((r) => (
                  <li key={r.fn} className="text-xs flex flex-wrap gap-2 items-center">
                    <code className="font-mono">{r.fn}</code>
                    {r.providers.map((p) => (
                      <Badge key={p} variant="secondary" className="text-[10px]">{t(`aiGovernance.inventory.provider.${p}`)}</Badge>
                    ))}
                    {r.tasks.length > 0 && <span className="text-muted-foreground">→ {r.tasks.join(", ")}</span>}
                    {r.hardcoded_models.length > 0 && (
                      <span className="text-muted-foreground font-mono">[{r.hardcoded_models.join(", ")}]</span>
                    )}
                  </li>
                ))}
              </ul>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
};

export default AIInventoryCard;
