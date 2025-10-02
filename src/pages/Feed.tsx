import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import PageHeader from "@/components/shared/PageHeader";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { AlertTriangle, ClipboardCheck, Package, TrendingUp, FileText, Search } from "lucide-react";
import { useObraScope } from "@/app/obraScope";
import { useTasks } from "@/integrations/supabase/hooks/useTasks";
import { useRelatorios } from "@/integrations/supabase/hooks/useRelatorios";
import { useAtualizacoesProgresso } from "@/integrations/supabase/hooks/useAtualizacoesProgresso";
import { useObras } from "@/integrations/supabase/hooks/useObras";
import { fmtDateTime } from "@/lib/date";
import { LoadingPlaceholder, EmptyState } from "@/components/shared/States";

type TaskRecord = {
  id: string;
  titulo?: string;
  descricao?: string;
  tipo?: string;
  prioridade?: string;
  status?: string;
  data_criacao?: string;
  created_at?: string;
  updated_at?: string;
  responsavel?: string;
  area?: string;
  obra?: { nome?: string | null } | null;
  obra_id?: string | null;
};

type RelatorioRecord = {
  id: string;
  titulo?: string;
  resumo?: string;
  status?: string;
  data_publicacao?: string;
  created_at?: string;
  obra_id?: string | null;
};

type ProgressRecord = {
  id: string;
  descricao?: string;
  marco?: string;
  data?: string;
  created_at?: string;
  relatorio_id?: string | null;
};

type FeedEntryType = "task" | "report" | "progress";

interface TaskFeedEntry {
  id: string;
  kind: "task";
  timestamp: Date;
  data: TaskRecord & { obraNome?: string | null };
}

interface ReportFeedEntry {
  id: string;
  kind: "report";
  timestamp: Date;
  data: RelatorioRecord;
}

interface ProgressFeedEntry {
  id: string;
  kind: "progress";
  timestamp: Date;
  data: { update: ProgressRecord; relatorio: RelatorioRecord };
}

type FeedEntry = TaskFeedEntry | ReportFeedEntry | ProgressFeedEntry;

type TypeFilter = "all" | FeedEntryType;

function isTaskClosed(status?: string | null) {
  const value = status?.toLowerCase() ?? "";
  return value.includes("concl");
}

function priorityLabel(priority?: string | null) {
  const value = priority?.toLowerCase() ?? "";
  if (value.includes("alta")) return "Alta";
  if (value.includes("media")) return "Media";
  if (value.includes("baixa")) return "Baixa";
  return "Nao informada";
}

function priorityBadgeClass(priority?: string | null) {
  const value = priority?.toLowerCase() ?? "";
  if (value.includes("alta")) return "bg-[hsl(var(--problem))] text-[hsl(var(--problem-foreground))]";
  if (value.includes("media")) return "bg-[hsl(var(--report))] text-[hsl(var(--report-foreground))]";
  if (value.includes("baixa")) return "bg-[hsl(var(--progress))] text-[hsl(var(--progress-foreground))]";
  return "bg-muted text-muted-foreground";
}

function taskVisualMeta(tipo?: string | null) {
  const value = tipo?.toLowerCase() ?? "";
  if (value.includes("proble")) {
    return {
      label: "Problema",
      border: "border-[hsl(var(--problem))]",
      background: "bg-[hsl(var(--problem-light))]",
      Icon: AlertTriangle,
    };
  }
  if (value.includes("material")) {
    return {
      label: "Solicitacao de materiais",
      border: "border-[hsl(var(--material))]",
      background: "bg-[hsl(var(--material-light))]",
      Icon: Package,
    };
  }
  return {
    label: "Servico",
    border: "border-[hsl(var(--progress))]",
    background: "bg-[hsl(var(--progress-light))]",
    Icon: ClipboardCheck,
  };
}

function isReportVisible(status?: string | null) {
  if (!status) return true;
  const value = status.toLowerCase();
  return value.includes("public") || value.includes("apro") || value.includes("final");
}

export default function Feed() {
  const { obra: scope } = useObraScope();
  const { data: tasks = [], isLoading: loadingTasks } = useTasks();
  const { data: relatorios = [], isLoading: loadingReports } = useRelatorios();
  const { data: progress = [], isLoading: loadingProgress } = useAtualizacoesProgresso();
  const { data: obras = [] } = useObras();
  const navigate = useNavigate();

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [order, setOrder] = useState<"desc" | "asc">("desc");

  const obraNameById = useMemo(() => {
    const map = new Map<string, string>();
    obras.forEach((obra) => {
      if (obra?.id && obra?.nome) {
        map.set(obra.id, obra.nome);
      }
    });
    return map;
  }, [obras]);

  const entries = useMemo<FeedEntry[]>(() => {
    if (!scope || scope === "todas") return [];

    const relatorioById = new Map(relatorios.map((rel) => [rel.id, rel]));
    const items: FeedEntry[] = [];

    (tasks as TaskRecord[]).forEach((task) => {
      const obraNome = task.obra?.nome ?? (task.obra_id ? obraNameById.get(task.obra_id) : undefined);
      if (obraNome !== scope) return;
      if (!isTaskClosed(task.status)) return;
      const completedAt = task.updated_at ?? task.created_at ?? task.data_criacao ?? new Date().toISOString();
      items.push({
        id: `task-${task.id}`,
        kind: "task",
        timestamp: new Date(completedAt),
        data: { ...task, obraNome: obraNome ?? scope },
      });
    });

    (relatorios as RelatorioRecord[])
      .filter((rel) => rel.obra_id && obraNameById.get(rel.obra_id) === scope)
      .filter((rel) => isReportVisible(rel.status))
      .forEach((rel) => {
        const publishedAt = rel.data_publicacao ?? rel.created_at ?? new Date().toISOString();
        items.push({
          id: `report-${rel.id}`,
          kind: "report",
          timestamp: new Date(publishedAt),
          data: rel,
        });
      });

    (progress as ProgressRecord[]).forEach((update) => {
      if (!update.relatorio_id) return;
      const rel = relatorioById.get(update.relatorio_id);
      if (!rel) return;
      const obraNome = rel.obra_id ? obraNameById.get(rel.obra_id) : undefined;
      if (obraNome !== scope) return;
      const eventDate = update.data ?? update.created_at ?? new Date().toISOString();
      items.push({
        id: `progress-${update.id}`,
        kind: "progress",
        timestamp: new Date(eventDate),
        data: { update, relatorio: rel },
      });
    });

    return items.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }, [scope, tasks, relatorios, progress, obraNameById]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return entries
      .filter((entry) => (typeFilter === "all" ? true : entry.kind === typeFilter))
      .filter((entry) => {
        if (!query) return true;
        if (entry.kind === "task") {
          const task = entry.data;
          const text = `${task.titulo ?? ""} ${task.descricao ?? ""} ${task.area ?? ""}`.toLowerCase();
          return text.includes(query);
        }
        if (entry.kind === "report") {
          const rel = entry.data;
          const text = `${rel.titulo ?? ""} ${rel.resumo ?? ""}`.toLowerCase();
          return text.includes(query);
        }
        const { update } = entry.data;
        const text = `${update.marco ?? ""} ${update.descricao ?? ""}`.toLowerCase();
        return text.includes(query);
      })
      .sort((a, b) => {
        if (order === "desc") {
          return b.timestamp.getTime() - a.timestamp.getTime();
        }
        return a.timestamp.getTime() - b.timestamp.getTime();
      });
  }, [entries, search, typeFilter, order]);

  const isLoading = loadingTasks || loadingReports || loadingProgress;

  if (!scope || scope === "todas") {
    return (
      <div className="space-y-6">
        <PageHeader title="Feed de registros" subtitle="Selecione uma obra para visualizar o feed" />
        <EmptyState message="Escolha uma obra no seletor do topo para carregar o feed de registros." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Feed de registros"
        subtitle={`Eventos da obra ${scope}: tarefas concluidas, relatorios e marcos`}
      />

      <div className="rounded-lg border p-3 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="relative">
            <Input
              placeholder="Buscar por titulo ou descricao"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
            <Search className="h-4 w-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
          </div>
          <Select value={typeFilter} onValueChange={(value: TypeFilter) => setTypeFilter(value)}>
            <SelectTrigger>
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os tipos</SelectItem>
              <SelectItem value="task">Tarefas</SelectItem>
              <SelectItem value="report">Relatorios</SelectItem>
              <SelectItem value="progress">Progresso</SelectItem>
            </SelectContent>
          </Select>
          <Select value={order} onValueChange={(value: "asc" | "desc") => setOrder(value)}>
            <SelectTrigger>
              <SelectValue placeholder="Ordenacao" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="desc">Mais recentes primeiro</SelectItem>
              <SelectItem value="asc">Mais antigos primeiro</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading ? (
        <LoadingPlaceholder rows={4} />
      ) : filtered.length === 0 ? (
        <EmptyState message="Nenhum registro encontrado para esta obra" />
      ) : (
        <div className="space-y-3">
          {filtered.map((entry) => {
            if (entry.kind === "task") {
              const task = entry.data;
              const visual = taskVisualMeta(task.tipo);
              const { Icon } = visual;
              return (
                <article
                  key={entry.id}
                  className={`rounded-lg border-l-4 p-4 ${visual.background} ${visual.border}`}
                >
                  <div className="flex items-start gap-3">
                    <Icon className="h-5 w-5 text-primary mt-1" />
                    <div className="flex-1 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-medium text-sm md:text-base">{task.titulo}</h3>
                        <span className="text-xs px-2 py-0.5 rounded-md border bg-background">
                          {visual.label}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded-md ${priorityBadgeClass(task.prioridade)}`}>
                          Prioridade: {priorityLabel(task.prioridade)}
                        </span>
                      </div>
                      {task.descricao && (
                        <p className="text-sm text-muted-foreground">{task.descricao}</p>
                      )}
                      <div className="text-xs text-muted-foreground flex flex-wrap gap-3">
                        <span>Entrada no kanban: {task.data_criacao ? fmtDateTime(task.data_criacao) : "-"}</span>
                        <span>Conclusao: {fmtDateTime(entry.timestamp)}</span>
                        {task.responsavel && <span>Responsavel: {task.responsavel}</span>}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="px-2 h-7 text-xs"
                        onClick={() => navigate("/kanban")}
                      >
                        Abrir no Kanban
                      </Button>
                    </div>
                  </div>
                </article>
              );
            }

            if (entry.kind === "report") {
              const rel = entry.data;
              return (
                <button
                  key={entry.id}
                  onClick={() => navigate(`/report/${rel.id}`)}
                  className="w-full text-left rounded-lg border-l-4 p-4 bg-[hsl(var(--report-light))] border-[hsl(var(--report))] hover:bg-[hsl(var(--report-light))]/80 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <FileText className="h-5 w-5 text-primary mt-1" />
                    <div className="flex-1 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-medium text-sm md:text-base">{rel.titulo}</h3>
                        {rel.status && (
                          <span className="text-xs px-2 py-0.5 rounded-md border bg-background">{rel.status}</span>
                        )}
                      </div>
                      {rel.resumo && (
                        <p className="text-sm text-muted-foreground">{rel.resumo}</p>
                      )}
                      <div className="text-xs text-muted-foreground flex flex-wrap gap-3">
                        <span>Publicado em: {fmtDateTime(rel.data_publicacao ?? rel.created_at ?? entry.timestamp)}</span>
                      </div>
                    </div>
                  </div>
                </button>
              );
            }

            const { update, relatorio } = entry.data;
            return (
              <article
                key={entry.id}
                className="rounded-lg border-l-4 p-4 bg-[hsl(var(--progress-light))] border-[hsl(var(--progress))]"
              >
                <div className="flex items-start gap-3">
                  <TrendingUp className="h-5 w-5 text-primary mt-1" />
                  <div className="flex-1 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-medium text-sm md:text-base">{update.marco ?? "Marco de progresso"}</h3>
                      <span className="text-xs px-2 py-0.5 rounded-md border bg-background">RDO</span>
                    </div>
                    {update.descricao && (
                      <p className="text-sm text-muted-foreground">{update.descricao}</p>
                    )}
                    <div className="text-xs text-muted-foreground flex flex-wrap gap-3">
                      <span>Registrado em: {fmtDateTime(update.data ?? entry.timestamp)}</span>
                      <span>Relatorio: {relatorio.titulo}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="px-2 h-7 text-xs"
                      onClick={() => navigate(`/report/${relatorio.id}`)}
                    >
                      Abrir relatorio
                    </Button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
