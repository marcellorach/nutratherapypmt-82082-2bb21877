import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { lastChangelogDate } from "@/data/projectChangelog.generated";
import {
  FileText,
  Download,
  ExternalLink,
  Pencil,
  Plus,
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";

// I18N_VERSION precisa bater com src/i18n.ts no momento da geração de uma auditoria.
const CURRENT_I18N_VERSION = "1.63.0";

interface TechnicalAudit {
  id: string;
  version: string;
  audit_date: string;
  system_version: string;
  system_changelog_date: string | null;
  scope: string;
  scope_history: Array<{ scope: string; edited_at: string; edited_by?: string }>;
  html_path: string | null;
  pdf_path: string | null;
  docx_path: string | null;
  summary: { strengths?: number; gaps?: number; risks?: number; pages?: number; infographics?: number };
  created_at: string;
  updated_at: string;
}

interface AuditRequest {
  id: string;
  scope: string;
  system_version: string;
  system_date: string;
  status: string;
  fulfilled_audit_id: string | null;
  requested_at: string;
}

const DEFAULT_NEW_SCOPE = `Cobertura desejada da próxima auditoria:

• Pipeline de curadoria de 7 estágios (PDF → triplets → KG → recomendação)
• Modelo de 5 camadas do Knowledge Graph (Compostos · Mecanismos · Pathways · Condições · Outcomes)
• Políticas RLS de todas as tabelas críticas e função has_role
• Conformidade regulatória FDA / EMA / AVMA (requisitos vs evidências vs gaps)
• Sistema bilingue PT/EN — paridade de chaves, dados estáticos e DB
• Motor de recomendação híbrida (limite de 8 compostos sinérgicos)
• Digital Twin & projeções de longevidade (Gompertz por raça)
• Pipeline de gap-fill PubMed + Gemini
• Integração SNOMED-CT VetSCT e UMLS
• Auditoria de tradução e cache-busting i18n
• Infográficos de fluxo do sistema

Adicione ou remova itens conforme o foco desta auditoria.`;

export default function TechnicalAuditsTab() {
  const { toast } = useToast();
  const [audits, setAudits] = useState<TechnicalAudit[]>([]);
  const [requests, setRequests] = useState<AuditRequest[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // dialog state
  const [newScope, setNewScope] = useState(DEFAULT_NEW_SCOPE);
  const [newOpen, setNewOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [editTarget, setEditTarget] = useState<TechnicalAudit | null>(null);
  const [editScope, setEditScope] = useState("");

  const load = async () => {
    setLoading(true);
    const [a, r] = await Promise.all([
      supabase.from("technical_audits").select("*").order("audit_date", { ascending: false }),
      supabase.from("audit_requests").select("*").order("requested_at", { ascending: false }),
    ]);
    if (a.data) {
      setAudits(a.data as TechnicalAudit[]);
      if (!selectedId && a.data.length) setSelectedId(a.data[0].id);
    }
    if (r.data) setRequests(r.data as AuditRequest[]);
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selected = useMemo(
    () => audits.find((a) => a.id === selectedId) ?? null,
    [audits, selectedId],
  );

  const nextVersion = useMemo(() => {
    const nums = audits
      .map((a) => parseInt(a.id.replace(/\D/g, ""), 10))
      .filter((n) => Number.isFinite(n));
    const max = nums.length ? Math.max(...nums) : 0;
    return `v${max + 1}`;
  }, [audits]);

  const handleRequestNew = async () => {
    setSubmitting(true);
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from("audit_requests").insert({
      scope: newScope,
      system_version: `i18n ${CURRENT_I18N_VERSION}`,
      system_date: lastChangelogDate || new Date().toISOString().slice(0, 10),
      status: "pending",
      requested_by: user?.id ?? null,
    });
    setSubmitting(false);
    if (error) {
      toast({ title: "Erro ao solicitar auditoria", description: error.message, variant: "destructive" });
      return;
    }
    toast({
      title: `Auditoria ${nextVersion} solicitada`,
      description: "O escopo foi registrado. O agente Lovable irá gerar a auditoria na próxima sessão dedicada.",
    });
    setNewOpen(false);
    load();
  };

  const handleSaveScope = async () => {
    if (!editTarget) return;
    const history = [
      ...(editTarget.scope_history || []),
      { scope: editTarget.scope, edited_at: new Date().toISOString() },
    ];
    const { error } = await supabase
      .from("technical_audits")
      .update({ scope: editScope, scope_history: history })
      .eq("id", editTarget.id);
    if (error) {
      toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Escopo atualizado" });
    setEditTarget(null);
    load();
  };

  const pendingRequests = requests.filter((r) => r.status === "pending");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-primary" />
            Auditorias Técnicas Internas
          </h1>
          <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
            Histórico versionado de auditorias internas do Senex AI. Cada auditoria está
            vinculada à versão do sistema auditada (i18n + última entrada do changelog).
          </p>
        </div>

        <Dialog open={newOpen} onOpenChange={setNewOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Fazer nova auditoria ({nextVersion})
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                Solicitar nova auditoria técnica
              </DialogTitle>
              <DialogDescription>
                Edite o escopo abaixo. A auditoria será gerada pelo agente Lovable na próxima
                sessão dedicada (geração de relatórios completos com infográficos não roda em runtime).
              </DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <label className="text-xs text-muted-foreground">Versão da auditoria</label>
                <Input value={nextVersion} disabled />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Versão do sistema (i18n)</label>
                <Input value={CURRENT_I18N_VERSION} disabled />
              </div>
              <div className="col-span-2">
                <label className="text-xs text-muted-foreground">Última atualização do changelog</label>
                <Input value={lastChangelogDate || "—"} disabled />
              </div>
            </div>

            <div>
              <label className="text-xs text-muted-foreground">Escopo da auditoria</label>
              <Textarea
                value={newScope}
                onChange={(e) => setNewScope(e.target.value)}
                rows={14}
                className="font-mono text-xs mt-1"
              />
            </div>

            <DialogFooter>
              <Button variant="ghost" onClick={() => setNewOpen(false)}>Cancelar</Button>
              <Button onClick={handleRequestNew} disabled={submitting || !newScope.trim()}>
                {submitting ? "Enviando..." : "Solicitar auditoria"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {pendingRequests.length > 0 && (
        <Card className="border-amber-300 bg-amber-50/50 dark:bg-amber-950/20">
          <CardContent className="py-3 flex items-center gap-3 text-sm">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <span className="font-medium">{pendingRequests.length}</span>
            <span className="text-muted-foreground">
              auditoria(s) aguardando geração pelo agente Lovable.
            </span>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-6">
        {/* Lista */}
        <div className="space-y-3">
          {loading && (
            <p className="text-sm text-muted-foreground">Carregando…</p>
          )}
          {audits.map((a) => {
            const isSelected = a.id === selectedId;
            return (
              <Card
                key={a.id}
                className={`cursor-pointer transition-all ${isSelected ? "border-primary shadow-md" : "hover:border-muted-foreground/30"}`}
                onClick={() => setSelectedId(a.id)}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      <FileText className="h-4 w-4 text-primary" />
                      Auditoria {a.id.toUpperCase()}
                    </CardTitle>
                    <Badge variant="outline">{a.audit_date}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Sistema: <span className="font-mono">{a.system_version}</span>
                    {a.system_changelog_date && ` · ${a.system_changelog_date}`}
                  </p>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex flex-wrap gap-1.5 text-xs">
                    {typeof a.summary?.strengths === "number" && (
                      <Badge variant="secondary" className="gap-1">
                        <CheckCircle2 className="h-3 w-3" />{a.summary.strengths} forças
                      </Badge>
                    )}
                    {typeof a.summary?.gaps === "number" && (
                      <Badge variant="secondary" className="gap-1">
                        <AlertTriangle className="h-3 w-3" />{a.summary.gaps} gaps
                      </Badge>
                    )}
                    {typeof a.summary?.risks === "number" && (
                      <Badge variant="destructive" className="gap-1">
                        {a.summary.risks} riscos
                      </Badge>
                    )}
                    {typeof a.summary?.pages === "number" && (
                      <Badge variant="outline">{a.summary.pages} págs</Badge>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {a.html_path && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 px-2 text-xs gap-1"
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(a.html_path!, "_blank");
                        }}
                      >
                        <ExternalLink className="h-3 w-3" /> HTML
                      </Button>
                    )}
                    {a.pdf_path && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 px-2 text-xs gap-1"
                        asChild
                        onClick={(e) => e.stopPropagation()}
                      >
                        <a href={a.pdf_path} download>
                          <Download className="h-3 w-3" /> PDF
                        </a>
                      </Button>
                    )}
                    {a.docx_path && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 px-2 text-xs gap-1"
                        asChild
                        onClick={(e) => e.stopPropagation()}
                      >
                        <a href={a.docx_path} download>
                          <Download className="h-3 w-3" /> DOCX
                        </a>
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 px-2 text-xs gap-1 ml-auto"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditTarget(a);
                        setEditScope(a.scope);
                      }}
                    >
                      <Pencil className="h-3 w-3" /> Escopo
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}

          {!loading && audits.length === 0 && (
            <Card>
              <CardContent className="py-6 text-sm text-muted-foreground text-center">
                Nenhuma auditoria ainda. Clique em "Fazer nova auditoria".
              </CardContent>
            </Card>
          )}
        </div>

        {/* Visualizador */}
        <Card className="min-h-[600px]">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <CardTitle className="text-base">
                {selected ? `${selected.id.toUpperCase()} — ${selected.audit_date}` : "Selecione uma auditoria"}
              </CardTitle>
              {selected?.html_path && (
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1"
                  onClick={() => window.open(selected.html_path!, "_blank")}
                >
                  <ExternalLink className="h-3 w-3" /> Abrir em nova aba
                </Button>
              )}
            </div>
            {selected && (
              <ScrollArea className="max-h-32 mt-2">
                <p className="text-xs text-muted-foreground whitespace-pre-wrap">{selected.scope}</p>
              </ScrollArea>
            )}
          </CardHeader>
          <CardContent>
            {selected?.html_path ? (
              <iframe
                src={selected.html_path}
                title={`Auditoria ${selected.id}`}
                className="w-full h-[70vh] border rounded-md bg-white"
              />
            ) : (
              <p className="text-sm text-muted-foreground text-center py-12">
                Esta auditoria não tem versão HTML disponível.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Edit scope dialog */}
      <Dialog open={!!editTarget} onOpenChange={(o) => !o && setEditTarget(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar escopo — {editTarget?.id.toUpperCase()}</DialogTitle>
            <DialogDescription>
              Versões anteriores do escopo são preservadas no histórico.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={editScope}
            onChange={(e) => setEditScope(e.target.value)}
            rows={14}
            className="font-mono text-xs"
          />
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditTarget(null)}>Cancelar</Button>
            <Button onClick={handleSaveScope}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}