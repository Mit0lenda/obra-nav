import PageHeader from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { KanbanSquare, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import NotificationCard, {
  NotificationCategoryLabel,
  NotificationPriorityLabel,
  NotificationStatusLabel,
  NotificationView,
} from "@/components/notifications/NotificationCard";
import { useObraScope } from "@/app/obraScope";
import { useNotificacoes, useUpdateNotificacao, useDeleteNotificacao, useMarkNotificacaoAsRead } from "@/integrations/supabase/hooks/useNotificacoes";
import { useObras } from "@/integrations/supabase/hooks/useObras";
import { useState, useMemo, useEffect } from "react";
import { toast } from "@/components/ui/sonner";
import { useDebounce } from "@/hooks/use-debounce";
import { LoadingPlaceholder, EmptyState } from "@/components/shared/States";

const categoryTabs: NotificationCategoryLabel[] = [
  "Solicitacao de materiais",
  "Informe de Progresso",
  "Notificacao de problemas",
];

type TabOption = "Todas" | NotificationCategoryLabel;

type PriorityCounts = Record<NotificationPriorityLabel, number>;

type StatusCounts = {
  pending: number;
  approved: number;
  rejected: number;
};

function mapCategory(value?: string | null): NotificationCategoryLabel {
  const normalized = (value ?? '').toLowerCase();
  if (normalized.includes('progres')) return "Informe de Progresso";
  if (normalized.includes('proble')) return "Notificacao de problemas";
  return "Solicitacao de materiais";
}

function mapPriority(value?: string | null): NotificationPriorityLabel {
  const normalized = (value ?? '').toLowerCase();
  if (normalized.includes('alta') || normalized.includes('cri')) return "Alta";
  if (normalized.includes('media')) return "Media";
  return "Baixa";
}

function mapStatus(value?: string | null): NotificationStatusLabel {
  const normalized = (value ?? '').toLowerCase();
  if (normalized.includes('aprov')) return "Aprovada";
  if (normalized.includes('reje')) return "Rejeitada";
  return "Pendente";
}

export default function Notifications() {
  const navigate = useNavigate();
  const { data: notifications = [], isLoading } = useNotificacoes();
  const { data: obrasData = [] } = useObras();
  const [obra, setObra] = useState<string>("Todas");
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [tab, setTab] = useState<TabOption>("Todas");
  const { obra: obraScope } = useObraScope();

  const debouncedSetSearch = useDebounce((value: string) => {
    setDebouncedQuery(value);
  }, 300);

  useEffect(() => {
    debouncedSetSearch(query);
  }, [query, debouncedSetSearch]);

  useEffect(() => {
    if (obraScope !== "todas") {
      setObra(obraScope);
    }
  }, [obraScope]);

  const markRead = useMarkNotificacaoAsRead();
  const removeN = useDeleteNotificacao();
  const updateNotificacao = useUpdateNotificacao();

  const obras = useMemo(() => obrasData.map((item) => item.nome), [obrasData]);

  const list = useMemo<NotificationView[]>(() => {
    return notifications.map((notif) => {
      const category = mapCategory(notif.categoria);
      const priority = mapPriority(notif.prioridade);
      const status = mapStatus(notif.status);
      return {
        id: notif.id,
        title: notif.titulo ?? 'Sem titulo',
        description: notif.descricao ?? '',
        category,
        priority,
        status,
        obra: notif.obra?.nome ?? '',
        sender: notif.remetente ?? '',
        createdAt: new Date(notif.created_at ?? Date.now()),
        isRead: Boolean(notif.lida),
      };
    });
  }, [notifications]);

  const filtered = useMemo(() => {
    return list.filter((n) => {
      const matchesTab = tab === "Todas" || n.category === tab;
      const matchesObra = obra === "Todas" || n.obra === obra;
      const matchesQuery = !debouncedQuery ||
        `${n.title} ${n.description} ${n.obra}`.toLowerCase().includes(debouncedQuery.toLowerCase());
      return matchesTab && matchesObra && matchesQuery;
    });
  }, [list, tab, obra, debouncedQuery]);

  const counts = useMemo(() => {
    const initialCounts: PriorityCounts = { Alta: 0, Media: 0, Baixa: 0 };
    const statusCounts: StatusCounts = { pending: 0, approved: 0, rejected: 0 };

    list.forEach((item) => {
      initialCounts[item.priority] += item.isRead ? 0 : 1;
      if (!item.isRead) {
        if (item.status === "Aprovada") statusCounts.approved += 1;
        else if (item.status === "Rejeitada") statusCounts.rejected += 1;
        else statusCounts.pending += 1;
      }
    });

    return { priorities: initialCounts, statuses: statusCounts };
  }, [list]);

  return (
    <div className="space-y-4">
      <PageHeader
        title="Central de Notificacoes"
        subtitle={`Filtros por obra, prioridade e categoria ${obraScope !== "todas" ? `(Escopo: ${obraScope})` : ''}`}
        action={
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => navigate("/kanban")}>
              <KanbanSquare className="h-4 w-4 mr-2" /> Ver Kanban
            </Button>
            <Button
              onClick={async () => {
                for (const notif of notifications.filter((n) => !n.lida)) {
                  await markRead.mutateAsync(notif.id);
                }
                toast.success("Todas marcadas como lidas");
              }}
            >
              Marcar Todas como Lidas
            </Button>
          </div>
        }
      />

      <div className="flex flex-col gap-3 rounded-lg border p-3">
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center">
          <div className="relative md:w-1/2">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Buscar por titulo ou descricao"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <Select value={obra} onValueChange={setObra}>
            <SelectTrigger className="md:w-48">
              <SelectValue placeholder="Obra" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Todas">Todas</SelectItem>
              {obras.map((nome) => (
                <SelectItem key={nome} value={nome}>{nome}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={tab} onValueChange={(value: TabOption) => setTab(value)}>
            <SelectTrigger className="md:w-48">
              <SelectValue placeholder="Categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Todas">Todas</SelectItem>
              {categoryTabs.map((category) => (
                <SelectItem key={category} value={category}>{category}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
          <Badge variant="outline">Alta: {counts.priorities.Alta}</Badge>
          <Badge variant="outline">Media: {counts.priorities.Media}</Badge>
          <Badge variant="outline">Baixa: {counts.priorities.Baixa}</Badge>
        </div>
      </div>

      <Tabs value={tab} onValueChange={(value) => setTab(value as TabOption)} className="space-y-4">
        <TabsList className="flex flex-wrap gap-2">
          <TabsTrigger value="Todas">Todas ({filtered.length})</TabsTrigger>
          {categoryTabs.map((category) => (
            <TabsTrigger key={category} value={category}>
              {category}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={tab} className="space-y-4">
          {isLoading ? (
            <LoadingPlaceholder rows={4} />
          ) : filtered.length === 0 ? (
            <EmptyState message="Nenhuma notificacao encontrada" />
          ) : (
            <div className="space-y-3">
              {filtered.map((item) => (
                <NotificationCard
                  key={item.id}
                  n={item}
                  onMarkRead={async () => {
                    await markRead.mutateAsync(item.id);
                    toast.success("Marcada como lida");
                  }}
                  onRemove={async () => {
                    await removeN.mutateAsync(item.id);
                    toast.info("Notificacao removida");
                  }}
                  onApprove={item.status === "Pendente" ? async () => {
                    await updateNotificacao.mutateAsync({ id: item.id, status: 'aprovado' });
                    toast.success("Notificacao aprovada");
                  } : undefined}
                  onReject={item.status === "Pendente" ? async () => {
                    await updateNotificacao.mutateAsync({ id: item.id, status: 'rejeitado' });
                    toast.error("Notificacao rejeitada");
                  } : undefined}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
