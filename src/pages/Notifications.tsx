import PageHeader from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { KanbanSquare, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import NotificationCard from "@/components/notifications/NotificationCard";
import { useObraScope } from "@/app/obraScope";
import {
  useNotifications,
  useObrasFromNotifications,
  useMarkRead,
  useRemoveNotification,
  useMarkAllRead,
  useApproveNotification,
  useRejectNotification,
} from "@/data/mockNotifications";
import { useState, useMemo } from "react";
import { toast } from "@/components/ui/sonner";

export default function Notifications() {
  const navigate = useNavigate();
  const { data: list = [], isLoading } = useNotifications();
  const { data: obras = [] } = useObrasFromNotifications();
  const [obra, setObra] = useState<string>("Todas");
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<string>("Todas");

  const markRead = useMarkRead();
  const removeN = useRemoveNotification();
  const markAll = useMarkAllRead();
  const approveN = useApproveNotification();
  const rejectN = useRejectNotification();

  const filtered = useMemo(() => {
    return list.filter((n) => {
      const byTab =
        tab === "Todas" ||
        n.category === tab;
      const byObra = obra === "Todas" || n.obra === obra;
      const byQuery =
        !query ||
        n.title.toLowerCase().includes(query.toLowerCase()) ||
        n.description.toLowerCase().includes(query.toLowerCase());
      return byTab && byObra && byQuery;
    });
  }, [list, obra, query, tab]);

  const counts = useMemo(() => ({
    Todas: list.filter((n) => !n.isRead).length,
    "Solicitação de materiais": list.filter((n) => !n.isRead && n.category === "Solicitação de materiais").length,
    "Informe de Progresso": list.filter((n) => !n.isRead && n.category === "Informe de Progresso").length,
    "Notificação de problemas/inconformidades": list.filter((n) => !n.isRead && n.category === "Notificação de problemas/inconformidades").length,
  }), [list]);

  return (
    <div className="space-y-4">
      <PageHeader
        title="Central de Notificações"
        subtitle="Filtros por obra, prioridade e categoria"
        action={
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => navigate("/kanban")}> 
              <KanbanSquare className="h-4 w-4 mr-2" /> Ver Kanban
            </Button>
            <Button
              onClick={async () => {
                await markAll.mutateAsync();
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
            <Search className="h-4 w-4 text-muted-foreground absolute left-2 top-1/2 -translate-y-1/2" />
            <Input placeholder="Buscar por texto" className="pl-8" value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>
          <div className="md:w-64">
            <Select value={obra} onValueChange={setObra}>
              <SelectTrigger>
                <SelectValue placeholder="Filtrar por Obra" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Todas">Todas as obras</SelectItem>
                {obras.map((o) => (
                  <SelectItem key={o} value={o}>{o}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {(obra !== "Todas" || query) && (
            <Badge variant="secondary" className="md:ml-auto">Total: {filtered.length}</Badge>
          )}
        </div>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="flex flex-wrap">
            {["Todas", "Solicitação de materiais", "Informe de Progresso", "Notificação de problemas/inconformidades"].map((t) => (
              <TabsTrigger key={t} value={t} className="relative">
                {t}
                <span className="ml-2 text-xs text-muted-foreground">{counts[t as keyof typeof counts] ?? 0}</span>
              </TabsTrigger>
            ))}
          </TabsList>
          <TabsContent value={tab} className="space-y-2">
            {isLoading ? (
              <div className="text-sm text-muted-foreground">Carregando…</div>
            ) : filtered.length === 0 ? (
              <div className="text-sm text-muted-foreground">Nenhuma notificação.</div>
            ) : (
              filtered.map((n) => (
                <NotificationCard
                  key={n.id}
                  n={n}
                  onMarkRead={async () => { await markRead.mutateAsync(n.id); toast.success("Marcada como lida"); }}
                  onRemove={async () => { await removeN.mutateAsync(n.id); toast.info("Notificação removida"); }}
                  onApprove={async () => {
                    await approveN.mutateAsync(n.id);
                    toast.success("Notificação aprovada e enviada ao Kanban");
                  }}
                  onReject={async () => {
                    await rejectN.mutateAsync(n.id);
                    toast.warning("Notificação rejeitada");
                  }}
                />
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
