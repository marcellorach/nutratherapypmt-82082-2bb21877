import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Sparkles, Brain, Database, FlaskConical, Stethoscope, GitCompare, ShieldCheck, Settings2 } from "lucide-react";
import { AI_TASKS, type AITaskDefinition, type AITaskCategory } from "@/config/ai-tasks";
import { useAIPromptVersions } from "@/hooks/useAIPromptVersions";
import TaskDetailSheet from "./TaskDetailSheet";

const CATEGORY_META: Record<AITaskCategory, { icon: React.ComponentType<{ className?: string }>; tone: string }> = {
  extraction: { icon: Database, tone: "bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300" },
  curation: { icon: ShieldCheck, tone: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300" },
  meta_analysis: { icon: GitCompare, tone: "bg-purple-100 text-purple-800 dark:bg-purple-950/40 dark:text-purple-300" },
  clinical_chat: { icon: Stethoscope, tone: "bg-teal-100 text-teal-800 dark:bg-teal-950/40 dark:text-teal-300" },
  clinical_inference: { icon: Brain, tone: "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300" },
  auditing: { icon: FlaskConical, tone: "bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300" },
};

function modelBadgeColor(model: string): string {
  if (model.startsWith("openai/")) return "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-900";
  if (model.includes("gemini-3")) return "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/30 dark:text-sky-300 dark:border-sky-900";
  return "bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-900/40 dark:text-slate-300 dark:border-slate-800";
}

const TaskRow: React.FC<{ task: AITaskDefinition; hasActivePrompt: boolean; lang: string; onOpen: (t: AITaskDefinition) => void }> = ({ task, hasActivePrompt, lang, onOpen }) => {
  const meta = CATEGORY_META[task.category];
  const Icon = meta.icon;
  const label = lang.startsWith("en") ? task.label_en : task.label_pt;
  const description = lang.startsWith("en") ? task.description_en : task.description_pt;
  const rationale = lang.startsWith("en") ? task.rationale_en : task.rationale_pt;

  return (
    <AccordionItem value={task.id} className="border rounded-md mb-2 bg-card">
      <AccordionTrigger className="px-4 py-3 hover:no-underline">
        <div className="flex items-start gap-3 text-left w-full">
          <span className={`mt-0.5 inline-flex h-7 w-7 items-center justify-center rounded-md ${meta.tone}`}>
            <Icon className="h-4 w-4" />
          </span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium text-sm">{label}</span>
              <Badge variant="outline" className={`text-[10px] ${modelBadgeColor(task.recommended_model)}`}>
                {task.recommended_model}
              </Badge>
              {task.routing.reasoning_effort && (
                <Badge variant="secondary" className="text-[10px]">
                  reasoning={task.routing.reasoning_effort}
                </Badge>
              )}
              {task.routing.context_caching && (
                <Badge variant="secondary" className="text-[10px]">context caching</Badge>
              )}
              {hasActivePrompt ? (
                <Badge className="text-[10px] bg-emerald-600 hover:bg-emerald-700">prompt v1 ativo</Badge>
              ) : (
                <Badge variant="outline" className="text-[10px] text-amber-700 border-amber-300">planejado</Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{description}</p>
          </div>
        </div>
      </AccordionTrigger>
      <AccordionContent className="px-4 pb-4 space-y-3 text-sm">
        <p className="text-muted-foreground">{description}</p>

        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">
            {lang.startsWith("en") ? "Why this model" : "Por que este modelo"}
          </div>
          <p className="text-sm">{rationale}</p>
          {task.routing.notes && (
            <p className="text-xs text-muted-foreground mt-1 italic">{task.routing.notes}</p>
          )}
        </div>

        <div className="grid md:grid-cols-2 gap-3">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">
              {lang.startsWith("en") ? "Candidate models" : "Modelos candidatos"}
            </div>
            <div className="flex flex-wrap gap-1">
              {task.candidate_models.map((m) => (
                <Badge key={m} variant="outline" className={`text-[10px] ${modelBadgeColor(m)}`}>
                  {m}
                </Badge>
              ))}
            </div>
          </div>
          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">
              {lang.startsWith("en") ? "Consumers" : "Consumidores"}
            </div>
            <div className="flex flex-wrap gap-1">
              {task.consumers.map((c) => (
                <Badge key={c} variant="secondary" className="text-[10px] font-mono">
                  {c}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        <div className="text-xs text-muted-foreground border-t pt-2">
          <code className="font-mono">task_id={task.id}</code> · <code className="font-mono">prompt_key={task.prompt_key}</code>
          {task.routing.temperature !== undefined && <> · temperature={task.routing.temperature}</>}
        </div>

        <div className="pt-2">
          <Button size="sm" variant="default" onClick={() => onOpen(task)}>
            <Settings2 className="h-3 w-3 mr-1" />
            {lang.startsWith("en") ? "Open editor & tests" : "Abrir editor & testes"}
          </Button>
        </div>
      </AccordionContent>
    </AccordionItem>
  );
};

const TaskModelGovernancePanel: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { data: prompts, isLoading, error } = useAIPromptVersions();
  const [filter, setFilter] = useState<AITaskCategory | "all">("all");
  const [openTask, setOpenTask] = useState<AITaskDefinition | null>(null);

  const activeByTask = useMemo(() => {
    const m = new Map<string, boolean>();
    (prompts ?? []).filter((p) => p.is_active).forEach((p) => m.set(p.task_id, true));
    return m;
  }, [prompts]);

  const filteredTasks = useMemo(
    () => (filter === "all" ? AI_TASKS : AI_TASKS.filter((t) => t.category === filter)),
    [filter],
  );

  const categories: Array<{ key: AITaskCategory | "all"; labelPt: string; labelEn: string }> = [
    { key: "all", labelPt: "Todas", labelEn: "All" },
    { key: "extraction", labelPt: "Extração", labelEn: "Extraction" },
    { key: "meta_analysis", labelPt: "Meta-análise", labelEn: "Meta-analysis" },
    { key: "clinical_inference", labelPt: "Inferência clínica", labelEn: "Clinical inference" },
    { key: "clinical_chat", labelPt: "Chat clínico", labelEn: "Clinical chat" },
    { key: "auditing", labelPt: "Auditoria", labelEn: "Auditing" },
  ];

  const isEn = i18n.language?.startsWith("en");

  const stats = useMemo(() => {
    const total = AI_TASKS.length;
    const seeded = AI_TASKS.filter((t) => activeByTask.get(t.id)).length;
    const gpt54 = AI_TASKS.filter((t) => t.recommended_model === "openai/gpt-5.4").length;
    const reasoning = AI_TASKS.filter((t) => t.routing.reasoning_effort === "high").length;
    return { total, seeded, gpt54, reasoning };
  }, [activeByTask]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          {t("aiGovernance.title", { defaultValue: "Modelos & Prompts por Tarefa" })}
        </CardTitle>
        <CardDescription>
          {t("aiGovernance.description", {
            defaultValue:
              "Registro central de qual modelo (Lovable AI Gateway) é usado em cada tarefa do sistema, com prompts versionados em banco. Fase 1: visualização somente.",
          })}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-center">
          <div className="rounded-md border bg-muted/30 p-2">
            <div className="text-xl font-semibold">{stats.total}</div>
            <div className="text-[11px] text-muted-foreground">{isEn ? "registered tasks" : "tarefas registradas"}</div>
          </div>
          <div className="rounded-md border bg-muted/30 p-2">
            <div className="text-xl font-semibold">{stats.seeded}/{stats.total}</div>
            <div className="text-[11px] text-muted-foreground">{isEn ? "prompts seeded" : "prompts semeados"}</div>
          </div>
          <div className="rounded-md border bg-muted/30 p-2">
            <div className="text-xl font-semibold">{stats.gpt54}</div>
            <div className="text-[11px] text-muted-foreground">{isEn ? "routed to GPT-5.4" : "roteadas para GPT-5.4"}</div>
          </div>
          <div className="rounded-md border bg-muted/30 p-2">
            <div className="text-xl font-semibold">{stats.reasoning}</div>
            <div className="text-[11px] text-muted-foreground">reasoning=high</div>
          </div>
        </div>

        {/* Filtro por categoria */}
        <div className="flex flex-wrap gap-1">
          {categories.map((c) => (
            <Button
              key={c.key}
              size="sm"
              variant={filter === c.key ? "default" : "outline"}
              className="h-7 text-xs"
              onClick={() => setFilter(c.key)}
            >
              {isEn ? c.labelEn : c.labelPt}
            </Button>
          ))}
        </div>

        {error && (
          <div className="rounded-md border border-destructive/40 bg-destructive/5 text-destructive text-sm p-3">
            {(error as Error).message}
          </div>
        )}

        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </div>
        ) : (
          <ScrollArea className="max-h-[520px] pr-2">
            <Accordion type="multiple" className="w-full">
              {filteredTasks.map((task) => (
                <TaskRow
                  key={task.id}
                  task={task}
                  hasActivePrompt={!!activeByTask.get(task.id)}
                  lang={i18n.language || "pt"}
                  onOpen={setOpenTask}
                />
              ))}
            </Accordion>
          </ScrollArea>
        )}

        <p className="text-[11px] text-muted-foreground border-t pt-2">
          {isEn
            ? "Phase 2: per-model prompt editing, model switcher and side-by-side testing. Phase 3 will add the automated model radar."
            : "Fase 2: edição de prompts por modelo, troca de modelo e testes lado a lado. Fase 3 adicionará o radar automatizado de modelos."}
        </p>

        <TaskDetailSheet task={openTask} onClose={() => setOpenTask(null)} />
      </CardContent>
    </Card>
  );
};

export default TaskModelGovernancePanel;