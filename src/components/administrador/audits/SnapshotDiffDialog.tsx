import React, { useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { diffLines } from "diff";
import { useTranslation } from "react-i18next";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  file: string;
  previewBody: string;
  publishedBody: string;
}

/** Diff lado a lado, linha a linha. Verde = adicionado em preview, vermelho = removido. */
const SnapshotDiffDialog: React.FC<Props> = ({
  open,
  onOpenChange,
  file,
  previewBody,
  publishedBody,
}) => {
  const { t } = useTranslation();

  // Para JSON, prettifica antes de diffar para reduzir ruído de formatação.
  const { left, right } = useMemo(() => {
    if (file.endsWith(".json")) {
      try {
        const l = JSON.stringify(JSON.parse(publishedBody || "{}"), null, 2);
        const r = JSON.stringify(JSON.parse(previewBody || "{}"), null, 2);
        return { left: l, right: r };
      } catch {
        return { left: publishedBody, right: previewBody };
      }
    }
    return { left: publishedBody, right: previewBody };
  }, [file, previewBody, publishedBody]);

  const diffs = useMemo(() => diffLines(left, right), [left, right]);

  const added = diffs.filter((d) => d.added).reduce((s, d) => s + (d.count ?? 0), 0);
  const removed = diffs.filter((d) => d.removed).reduce((s, d) => s + (d.count ?? 0), 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] w-[95vw] h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <span className="font-mono text-sm">{file}</span>
            <Badge variant="outline" className="text-green-700 border-green-300">
              +{added} {t("audits.previewVsPublished.linesAdded")}
            </Badge>
            <Badge variant="outline" className="text-red-700 border-red-300">
              −{removed} {t("audits.previewVsPublished.linesRemoved")}
            </Badge>
          </DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-2 flex-1 min-h-0">
          <div className="flex flex-col min-h-0">
            <div className="px-2 py-1 text-xs font-semibold bg-muted rounded-t">
              {t("audits.previewVsPublished.published")}
            </div>
            <ScrollArea className="flex-1 border rounded-b">
              <pre className="text-[11px] font-mono leading-relaxed p-2">
                {diffs.map((d, i) => {
                  if (d.added) return null;
                  const cls = d.removed
                    ? "bg-red-100 text-red-900"
                    : "text-foreground";
                  return (
                    <span key={i} className={cls}>
                      {d.value}
                    </span>
                  );
                })}
              </pre>
            </ScrollArea>
          </div>
          <div className="flex flex-col min-h-0">
            <div className="px-2 py-1 text-xs font-semibold bg-muted rounded-t">
              {t("audits.previewVsPublished.preview")}
            </div>
            <ScrollArea className="flex-1 border rounded-b">
              <pre className="text-[11px] font-mono leading-relaxed p-2">
                {diffs.map((d, i) => {
                  if (d.removed) return null;
                  const cls = d.added
                    ? "bg-green-100 text-green-900"
                    : "text-foreground";
                  return (
                    <span key={i} className={cls}>
                      {d.value}
                    </span>
                  );
                })}
              </pre>
            </ScrollArea>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SnapshotDiffDialog;