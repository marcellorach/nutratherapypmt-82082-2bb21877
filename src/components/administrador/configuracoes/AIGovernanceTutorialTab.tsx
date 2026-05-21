import React from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import {
  ArrowRight, BookOpen, CheckCircle2, FlaskConical, History,
  Info, Pencil, RotateCw, Sparkles, Workflow,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

/**
 * Aba "Tutorial — Governança de IA": walkthrough passo-a-passo
 * dentro do próprio admin, bilíngue, com link direto para o painel.
 */
const AIGovernanceTutorialTab: React.FC = () => {
  const { i18n } = useTranslation();
  const isEn = (i18n.language || "pt").startsWith("en");
  const navigate = useNavigate();

  const go = () => navigate("/administrador?tab=config-ia");

  const T = (en: string, pt: string) => (isEn ? en : pt);

  return (
    <div className="space-y-4 max-w-5xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            {T("AI Model Governance — Walkthrough", "Governança de Modelos de IA — Passo a Passo")}
          </CardTitle>
          <CardDescription>
            {T(
              "Where to find the per-task model & prompt panel, what each tab does, and how to swap a model in production without touching code.",
              "Onde encontrar o painel de modelos e prompts por tarefa, o que cada aba faz e como trocar o modelo em produção sem mexer no código.",
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>{T("Where does it live?", "Onde fica?")}</AlertTitle>
            <AlertDescription>
              {T(
                "Administrator → Configuration → AI Settings → card",
                "Administrador → Configuração → Configurações IA → card",
              )}{" "}
              <strong>{T("AI Models & Prompts per Task", "Modelos & Prompts por Tarefa")}</strong>.
            </AlertDescription>
          </Alert>

          <Button onClick={go} className="gap-2">
            <ArrowRight className="h-4 w-4" />
            {T("Open the AI Governance panel", "Abrir o painel de Governança de IA")}
          </Button>

          <div className="grid sm:grid-cols-3 gap-2 pt-2">
            <StatusLegend tone="connected" label={T("Connected", "Conectado")}
              hint={T("Wired to the shared router — changing the model here takes effect immediately.",
                     "Plugado no router — trocar o modelo aqui passa a valer imediatamente.")} />
            <StatusLegend tone="legacy" label={T("Legacy", "Legacy")}
              hint={T("Function still hardcoded. Switching the model in the panel has no effect yet.",
                     "Função ainda hardcoded. Trocar modelo no painel ainda NÃO produz efeito.")} />
            <StatusLegend tone="planned" label={T("Planned", "Planejado")}
              hint={T("Task is registered but no edge function consumes it yet.",
                     "Tarefa registrada mas nenhuma função consome ainda.")} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{T("Step-by-step", "Passo a passo")}</CardTitle>
        </CardHeader>
        <CardContent>
          <Accordion type="multiple" defaultValue={["s1", "s2"]} className="w-full">
            <Step id="s1" icon={Sparkles} title={T("1. Visualize", "1. Visualizar")}>
              <p>
                {T(
                  "Each row shows: task name, active model, recommended reasoning effort (when applicable), and the integration status badge.",
                  "Cada linha mostra: nome da tarefa, modelo ativo, reasoning_effort recomendado (quando aplicável) e o badge de status de integração.",
                )}
              </p>
              <p className="text-sm text-muted-foreground">
                {T("Click a row to open the side editor.", "Clique numa linha para abrir o editor lateral.")}
              </p>
            </Step>

            <Step id="s2" icon={Workflow} title={T("2. Switch the model", "2. Trocar o modelo")}>
              <ol className="list-decimal pl-5 space-y-1 text-sm">
                <li>{T("Open the task → tab", "Abra a tarefa → aba")} <Badge variant="secondary">Model</Badge></li>
                <li>{T("Pick a candidate model card.", "Escolha um dos cards de modelo candidato.")}</li>
                <li>{T("Click", "Clique em")} <Badge>Set Active</Badge> — {T("saved to ai_configurations.", "gravado em ai_configurations.")}</li>
                <li>{T("Takes effect on the next call (router cache: 30s).", "Passa a valer na próxima chamada (cache do router: 30s).")}</li>
              </ol>
              <Alert className="mt-2">
                <Info className="h-4 w-4" />
                <AlertDescription>
                  {T(
                    "Only tasks marked Connected actually re-route. Legacy tasks need their edge function migrated first.",
                    "Apenas tarefas marcadas Conectado realmente roteiam. Tarefas Legacy precisam ter a edge function migrada antes.",
                  )}
                </AlertDescription>
              </Alert>
            </Step>

            <Step id="s3" icon={Pencil} title={T("3. Edit the prompt", "3. Editar o prompt")}>
              <ol className="list-decimal pl-5 space-y-1 text-sm">
                <li>{T("Open the task → tab", "Abra a tarefa → aba")} <Badge variant="secondary">Prompt</Badge></li>
                <li>{T("Edit", "Edite")} <code>system_prompt</code> {T("and/or", "e/ou")} <code>user_prompt</code> ({T("supports", "suporta")} <code>{"{{input}}"}</code>).</li>
                <li>{T("Click", "Clique")} <Badge>Save as v2</Badge> — {T("does not auto-activate.", "não ativa automaticamente.")}</li>
                <li>{T("Click", "Clique")} <Badge>Activate</Badge> — {T("trigger ensures only one active version per (task, model).", "trigger garante 1 só versão ativa por (tarefa, modelo).")}</li>
              </ol>
            </Step>

            <Step id="s4" icon={FlaskConical} title={T("4. Test before activating", "4. Testar antes de ativar")}>
              <ol className="list-decimal pl-5 space-y-1 text-sm">
                <li>{T("Open the task → tab", "Abra a tarefa → aba")} <Badge variant="secondary">Test</Badge></li>
                <li>{T("Pick model + paste an input → Run.", "Escolha modelo + cole um input → Executar.")}</li>
                <li>{T("Latency, tokens and estimated cost are shown live.", "Latência, tokens e custo estimado aparecem ao vivo.")}</li>
                <li>{T("Every run is logged in ai_prompt_test_runs.", "Cada execução é gravada em ai_prompt_test_runs.")}</li>
              </ol>
            </Step>

            <Step id="s5" icon={History} title={T("5. Check history", "5. Ver histórico")}>
              <p className="text-sm">
                {T(
                  "Tab History shows the last 20 test runs with errors highlighted. Use it to compare models side-by-side before flipping production.",
                  "A aba Histórico mostra as últimas 20 execuções de teste com erros destacados. Use para comparar modelos lado a lado antes de virar produção.",
                )}
              </p>
            </Step>

            <Step id="s6" icon={RotateCw} title={T("6. Health monitoring", "6. Monitoramento de saúde")}>
              <p className="text-sm">
                {T(
                  "A daily healthcheck pings every active task with a tiny prompt. Failing tasks get a red badge on the panel.",
                  "Um healthcheck diário ping a cada tarefa ativa com um prompt mínimo. Tarefas com falha ganham badge vermelho no painel.",
                )}
              </p>
              <p className="text-xs text-muted-foreground">
                {T("Manual trigger:", "Disparo manual:")} <code className="font-mono">supabase functions invoke ai-task-healthcheck</code>
              </p>
            </Step>
          </Accordion>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">FAQ & {T("Glossary", "Glossário")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <FaqItem
            q={T("I changed the model and saw no effect — why?", "Mudei o modelo e não vi efeito — por quê?")}
            a={T(
              "Either the task is Legacy (badge), or the 30s router cache has not expired yet. Hit the task again after 30s.",
              "Ou a tarefa está como Legacy (badge), ou o cache de 30s do router ainda não expirou. Tente de novo após 30s.",
            )} />
          <FaqItem
            q={T("Can I revert a bad prompt?", "Posso reverter um prompt ruim?")}
            a={T(
              "Yes. Every save creates a new version; activating v1 again restores it.",
              "Sim. Cada save cria uma versão nova; ativar a v1 de novo restaura.",
            )} />
          <FaqItem
            q={T("Do switches require a deploy?", "Trocas exigem deploy?")}
            a={T("No. Model and prompt live in the database; edge functions read them on every call.",
                "Não. Modelo e prompt vivem no banco; edge functions leem em toda chamada.")} />

          <div className="border-t pt-3 mt-3 space-y-2">
            <GlossaryRow term="task_id" desc={T("Canonical name of an AI task (e.g. meta_study_analysis).",
                                                 "Nome canônico de uma tarefa de IA (ex.: meta_study_analysis).")} />
            <GlossaryRow term="reasoning_effort" desc={T("How much extra compute the model spends thinking before replying (minimal → xhigh).",
                                                          "Quanto cálculo extra o modelo gasta pensando antes de responder (minimal → xhigh).")} />
            <GlossaryRow term="context_caching" desc={T("Gemini-only: caches the PDF so subsequent questions cost ~25% less.",
                                                        "Só no Gemini: cacheia o PDF para perguntas subsequentes custarem ~25% menos.")} />
            <GlossaryRow term="prompt_version" desc={T("A row in ai_prompt_versions; only one can be active per (task, model).",
                                                       "Uma linha em ai_prompt_versions; só 1 pode estar ativa por (tarefa, modelo).")} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const Step: React.FC<{ id: string; icon: React.ComponentType<{ className?: string }>; title: string; children: React.ReactNode }> = ({ id, icon: Icon, title, children }) => (
  <AccordionItem value={id}>
    <AccordionTrigger className="hover:no-underline">
      <span className="flex items-center gap-2 text-sm font-medium">
        <Icon className="h-4 w-4 text-primary" /> {title}
      </span>
    </AccordionTrigger>
    <AccordionContent className="space-y-2 text-sm">{children}</AccordionContent>
  </AccordionItem>
);

const StatusLegend: React.FC<{ tone: "connected" | "legacy" | "planned"; label: string; hint: string }> = ({ tone, label, hint }) => {
  const classes =
    tone === "connected" ? "bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-900" :
    tone === "legacy" ? "bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-900" :
    "bg-slate-50 border-slate-200 text-slate-700 dark:bg-slate-900/40 dark:text-slate-300 dark:border-slate-800";
  return (
    <div className={`rounded-md border p-3 ${classes}`}>
      <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide">
        {tone === "connected" && <CheckCircle2 className="h-3.5 w-3.5" />} {label}
      </div>
      <p className="text-xs mt-1 opacity-90">{hint}</p>
    </div>
  );
};

const FaqItem: React.FC<{ q: string; a: string }> = ({ q, a }) => (
  <div>
    <div className="font-medium">{q}</div>
    <p className="text-muted-foreground">{a}</p>
  </div>
);

const GlossaryRow: React.FC<{ term: string; desc: string }> = ({ term, desc }) => (
  <div className="flex items-baseline gap-2">
    <code className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">{term}</code>
    <span className="text-muted-foreground">{desc}</span>
  </div>
);

export default AIGovernanceTutorialTab;
