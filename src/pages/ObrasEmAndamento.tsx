import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AlertTriangle, AlertCircle, Info, Bell, FolderKanban, PackageSearch } from "lucide-react";
import PageHeader from "@/components/shared/PageHeader";
import { useObras } from "@/integrations/supabase/hooks/useObras";
import { useTasks } from "@/integrations/supabase/hooks/useTasks";
import { useNotificacoes } from "@/integrations/supabase/hooks/useNotificacoes";
import { LoadingPlaceholder } from "@/components/shared/States";
import { useObraScope } from "@/app/obraScope";

type StatusKey = "em_andamento" | "concluida" | "pausada";

type PriorityCounters = {
  alta: number;
  media: number;
  baixa: number;
};

function normalizeStatus(status?: string | null): StatusKey {
  const value = status?.toLowerCase() ?? "";
  if (value.includes("concl")) return "concluida";
  if (value.includes("paus") || value.includes("paral")) return "pausada";
  return "em_andamento";
}

function formatStatusBadge(status?: string | null) {
  const key = normalizeStatus(status);
  const label = status ?? "Em andamento";
  if (key === "concluida") {
    return <Badge variant="secondary">{label}</Badge>;
  }
  if (key === "pausada") {
    return <Badge variant="outline">{label}</Badge>;
  }
  return <Badge variant="default">{label}</Badge>;
}

function normalizePriority(priority?: string | null): keyof PriorityCounters {
  const value = priority?.toLowerCase() ?? "";
  if (value.includes("alta")) return "alta";
  if (value.includes("media")) return "media";
  return "baixa";
}

function isTaskClosed(status?: string | null) {
  const value = status?.toLowerCase() ?? "";
  return value.includes("concl");
}

export default function ObrasEmAndamento() {
  const { data: obras = [], isLoading } = useObras();
  const { data: tasks = [] } = useTasks();
  const { data: notificacoes = [] } = useNotificacoes();
  const { setObra } = useObraScope();
  const navigate = useNavigate();
  const [filtro, setFiltro] = useState<"todas" | StatusKey>("todas");

  const { itens, totaisPrioridade, totalNotificacoes, statusTotais } = useMemo(() => {
    const totals: PriorityCounters = { alta: 0, media: 0, baixa: 0 };
    let notificationsSum = 0;
    const statusTotals: Record<StatusKey, number> = {
      em_andamento: 0,
      concluida: 0,
      pausada: 0,
    };

    const enriched = obras.map((obra) => {
      const obraTasks = tasks.filter((task) => task.obra_id === obra.id);
      const pendingTasks = obraTasks.filter((task) => !isTaskClosed(task.status));
      const counters: PriorityCounters = { alta: 0, media: 0, baixa: 0 };
      pendingTasks.forEach((task) => {
        const key = normalizePriority(task.prioridade);
        counters[key] += 1;
        totals[key] += 1;
      });

      const unreadNotifications = notificacoes.filter(
        (notif) => notif.obra_id === obra.id && !notif.lida
      ).length;
      notificationsSum += unreadNotifications;

      const statusKey = normalizeStatus(obra.status);
      statusTotals[statusKey] += 1;

      return {
        obra,
        counters,
        statusKey,
        unreadNotifications,
      };
    });

    return {
      itens: enriched,
      totaisPrioridade: totals,
      totalNotificacoes: notificationsSum,
      statusTotais: statusTotals,
    };
  }, [obras, tasks, notificacoes]);

  const filtrados = useMemo(() => {
    if (filtro === "todas") return itens;
    return itens.filter((item) => item.statusKey === filtro);
  }, [itens, filtro]);

  const handleNavigate = (obraNome: string, destino: "kanban" | "notifications" | "inventory" | "feed") => {
    setObra(obraNome);
    navigate(`/${destino}`);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Obras em andamento"
          subtitle="Listagem de obras por status e pendencias"
        />
        <LoadingPlaceholder rows={6} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Obras em andamento"
        subtitle="Visualize tarefas pendentes, notificacoes e acoes por obra"
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Total de obras</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{itens.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Obras em andamento</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statusTotais.em_andamento}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Tarefas pendentes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-destructive" /> Alta: {totaisPrioridade.alta}
            </div>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-warning" /> Media: {totaisPrioridade.media}
            </div>
            <div className="flex items-center gap-2">
              <Info className="h-4 w-4 text-muted-foreground" /> Baixa: {totaisPrioridade.baixa}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Notificacoes abertas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{totalNotificacoes}</div>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-2">
        <Button
          variant={filtro === "todas" ? "default" : "outline"}
          onClick={() => setFiltro("todas")}
        >
          Todas
        </Button>
        <Button
          variant={filtro === "em_andamento" ? "default" : "outline"}
          onClick={() => setFiltro("em_andamento")}
        >
          Em andamento
        </Button>
        <Button
          variant={filtro === "concluida" ? "default" : "outline"}
          onClick={() => setFiltro("concluida")}
        >
          Concluidas
        </Button>
        <Button
          variant={filtro === "pausada" ? "default" : "outline"}
          onClick={() => setFiltro("pausada")}
        >
          Pausadas
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Obra</TableHead>
                <TableHead>Tarefas pendentes</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Pendencias</TableHead>
                <TableHead>Responsavel</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtrados.map(({ obra, counters, unreadNotifications }) => {
                const obraNome = obra.nome;
                return (
                  <TableRow key={obra.id}>
                    <TableCell className="align-top">
                      <div className="flex flex-col gap-2">
                        <span className="font-medium">{obraNome}</span>
                        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                          <Button
                            variant="link"
                            size="sm"
                            className="p-0 h-auto"
                            onClick={() => handleNavigate(obraNome, "feed")}
                          >
                            <FolderKanban className="h-3.5 w-3.5 mr-1" /> Feed de registros
                          </Button>
                          <Button
                            variant="link"
                            size="sm"
                            className="p-0 h-auto"
                            onClick={() => handleNavigate(obraNome, "inventory")}
                          >
                            <PackageSearch className="h-3.5 w-3.5 mr-1" /> Controle de estoque
                          </Button>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="align-top">
                      <button
                        type="button"
                        className="flex items-center gap-3 rounded-md border px-3 py-2 text-sm hover:bg-muted transition-colors"
                        onClick={() => handleNavigate(obraNome, "kanban")}
                      >
                        <span className="flex items-center gap-1 text-destructive">
                          <AlertTriangle className="h-4 w-4" /> {counters.alta}
                        </span>
                        <span className="flex items-center gap-1 text-warning">
                          <AlertCircle className="h-4 w-4" /> {counters.media}
                        </span>
                        <span className="flex items-center gap-1 text-muted-foreground">
                          <Info className="h-4 w-4" /> {counters.baixa}
                        </span>
                      </button>
                    </TableCell>
                    <TableCell className="align-top">{formatStatusBadge(obra.status)}</TableCell>
                    <TableCell className="align-top">
                      <button
                        type="button"
                        className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm hover:bg-muted transition-colors"
                        onClick={() => handleNavigate(obraNome, "notifications")}
                      >
                        <Bell className="h-4 w-4 text-primary" />
                        <span>{unreadNotifications}</span>
                      </button>
                    </TableCell>
                    <TableCell className="align-top text-sm text-muted-foreground">
                      {obra.responsavel || "-"}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
