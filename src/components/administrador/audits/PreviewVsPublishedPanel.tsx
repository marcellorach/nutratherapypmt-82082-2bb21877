import React, { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, GitCompare, CheckCircle2, AlertCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
import SnapshotDiffDialog from "./SnapshotDiffDialog";

const FILES = [
  "drift-report.json",
  "ARCHITECTURE_LIVE.md",
  "CHANGELOG.md",
  "PROMPTS.md",
] as const;

// URL publicada canônica (custom domain). Outros origens (lovable.app) também valem.
const PUBLISHED_URL = "https://longevidade.ai";

interface SnapshotResult {
  file: string;
  equal: boolean;
  preview: { status: number; bytes: number; sha256: string | null; body: string; error?: string };
  published: { status: number; bytes: number; sha256: string | null; body: string; error?: string };
}

interface CompareResponse {
  compared_at: string;
  preview_url: string;
  published_url: string;
  results: SnapshotResult[];
}

function shortSha(s: string | null) {
  return s ? s.slice(0, 8) : "—";
}

const PreviewVsPublishedPanel: React.FC = () => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<CompareResponse | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [diffOpen, setDiffOpen] = useState<SnapshotResult | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const previewUrl = typeof window !== "undefined" ? window.location.origin : "";
      const { data: res, error } = await supabase.functions.invoke<CompareResponse>(
        "compare-snapshots",
        {
          body: {
            preview_url: previewUrl,
            published_url: PUBLISHED_URL,
            files: [...FILES],
          },
        },
      );
      if (error) throw error;
      setData(res ?? null);
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const allEqual = data?.results.every((r) => r.equal) ?? false;
  const anyMissing = data?.results.some(
    (r) => r.preview.status !== 200 || r.published.status !== 200,
  );

  return (
    <Card className="border-primary/30">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <GitCompare className="h-4 w-4 text-primary" />
              {t("audits.previewVsPublished.title")}
              {data && (
                allEqual ? (
                  <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    {t("audits.previewVsPublished.allEqual")}
                  </Badge>
                ) : (
                  <Badge className="bg-amber-100 text-amber-900 hover:bg-amber-100">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    {t("audits.previewVsPublished.hasDiff")}
                  </Badge>
                )
              )}
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-1 max-w-2xl">
              {t("audits.previewVsPublished.subtitle")}
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={load} disabled={loading}>
            <RefreshCw className={`h-3.5 w-3.5 mr-1 ${loading ? "animate-spin" : ""}`} />
            {t("audits.previewVsPublished.reload")}
          </Button>
        </div>
        {data && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-1 text-[11px] text-muted-foreground mt-2 font-mono">
            <div>preview: {data.preview_url}</div>
            <div>published: {data.published_url}</div>
          </div>
        )}
      </CardHeader>
      <CardContent>
        {err && (
          <div className="text-xs text-destructive border border-destructive/30 bg-destructive/5 rounded p-2 mb-3">
            {err}
          </div>
        )}
        {anyMissing && (
          <div className="text-[11px] text-amber-800 border border-amber-300 bg-amber-50 rounded p-2 mb-3">
            {t("audits.previewVsPublished.missingNote")}
          </div>
        )}
        <div className="border rounded divide-y">
          {(data?.results ?? []).map((r) => {
            const statusLabel = r.equal
              ? t("audits.previewVsPublished.equal")
              : t("audits.previewVsPublished.differs");
            const previewOk = r.preview.status === 200;
            const publishedOk = r.published.status === 200;
            return (
              <div
                key={r.file}
                className="flex items-center justify-between gap-3 p-2.5 text-sm"
              >
                <div className="min-w-0 flex-1">
                  <div className="font-mono text-xs truncate">{r.file}</div>
                  <div className="text-[10px] text-muted-foreground font-mono mt-0.5 flex gap-3 flex-wrap">
                    <span className={previewOk ? "" : "text-destructive"}>
                      preview: {previewOk ? shortSha(r.preview.sha256) : `HTTP ${r.preview.status || "err"}`}
                    </span>
                    <span className={publishedOk ? "" : "text-destructive"}>
                      published: {publishedOk ? shortSha(r.published.sha256) : `HTTP ${r.published.status || "err"}`}
                    </span>
                  </div>
                </div>
                <Badge
                  variant="outline"
                  className={
                    r.equal
                      ? "border-green-300 text-green-800 bg-green-50"
                      : "border-amber-300 text-amber-900 bg-amber-50"
                  }
                >
                  {statusLabel}
                </Badge>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setDiffOpen(r)}
                  disabled={!previewOk && !publishedOk}
                >
                  {t("audits.previewVsPublished.viewDiff")}
                </Button>
              </div>
            );
          })}
          {!data && !loading && !err && (
            <div className="p-3 text-xs text-muted-foreground">
              {t("audits.previewVsPublished.empty")}
            </div>
          )}
        </div>
        <p className="text-[10px] text-muted-foreground mt-2 italic">
          {t("audits.previewVsPublished.dbNote")}
        </p>
      </CardContent>

      {diffOpen && (
        <SnapshotDiffDialog
          open={!!diffOpen}
          onOpenChange={(v) => !v && setDiffOpen(null)}
          file={diffOpen.file}
          previewBody={diffOpen.preview.body}
          publishedBody={diffOpen.published.body}
        />
      )}
    </Card>
  );
};

export default PreviewVsPublishedPanel;