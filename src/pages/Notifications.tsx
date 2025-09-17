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
import { useNotificacoes } from "@/integrations/supabase/hooks/useNotificacoes";
import { useObras } from "@/integrations/supabase/hooks/useObras";
import { useUpdateNotificacao, useDeleteNotificacao, useMarkNotificacaoAsRead } from "@/integrations/supabase/hooks/useNotificacoes";
import { useState, useMemo, useEffect } from "react";
import { toast } from "@/components/ui/sonner";
import { useDebounce } from "@/hooks/use-debounce";
import { LoadingPlaceholder, EmptyState } from "@/components/shared/States";

export default function Notifications() {
  const navigate = useNavigate();
  const { data: notifications = [], isLoading } = useNotificacoes();
  const { data: obrasData = [] } = useObras();
  const [obra, setObra] = useState<string>("Todas");
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [tab, setTab] = useState<string>("Todas");
  const { obra: obraScope } = useObraScope();

  // Convert Supabase notifications to component format
  const list = notifications.map(notif => ({
    id: notif.id,
    title: notif.titulo,
    description: notif.descricao || '',
    category: notif.categoria || 'geral',
    priority: notif.prioridade || 'media',
    status: notif.status || 'pendente',
    isRead: notif.lida || false,
    obra: notif.obras?.nome || '',
    sender: notif.remetente || '',
    createdAt: new Date(notif.created_at || Date.now()),
  }));

  const obras = obrasData.map(obra => obra.nome);

  // Debounce search
  const debouncedSetSearch = useDebounce((value: string) => {
    setDebouncedQuery(value);
  }, 300);

  useEffect(() => {
    debouncedSetSearch(query);
  }, [query, debouncedSetSearch]);

  // Sync with global obra scope
  useEffect(() => {
    if (obraScope !== "todas") {
      setObra(obraScope);
    }
  }, [obraScope]);

  const markRead = useMarkNotificacaoAsRead();
  const removeN = useDeleteNotificacao();
  const updateNotificacao = useUpdateNotificacao();

  const filtered = useMemo(() => {
    return list.filter((n) => {
      const byTab =
        tab === "Todas" ||
        n.category === tab;
      const byObra = obra === "Todas" || n.obra === obra;
      const byQuery =
        !debouncedQuery ||
        n.title.toLowerCase().includes(debouncedQuery.toLowerCase()) ||
        n.description.toLowerCase().includes(debouncedQuery.toLowerCase());
      return byTab && byObra && byQuery;
    });
  }, [list, obra, debouncedQuery, tab]);

  const resetFilters = () => {
    setQuery("");
    setObra("Todas");
    setTab("Todas");
  };

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
        subtitle={`Filtros por obra, prioridade e categoria ${obraScope !== "todas" ? `(Escopo: ${obraScope})` : ""}`}
        action={
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => navigate("/kanban")}> 
              <KanbanSquare className="h-4 w-4 mr-2" /> Ver Kanban
            </Button>
            <Button
              onClick={async () => {
                // Mark all as read using individual updates
                for (const notif of notifications.filter(n => !n.lida)) {
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
            <Search className="h-4 w-4 text-muted-foreground absolute left-2 top-1/2 -translate-y-1/2" />
            <Input placeholder="Buscar por texto" className="pl-8" value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>
          <div className="md:w-64">
            <Select value={obra} onValueChange={setObra}>
              <SelectTrigger aria-label="Filtrar por Obra">
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
            <div className="flex items-center gap-2 text-xs text-muted-foreground md:ml-auto">
              Total: {filtered.length}
              <Button variant="link" size="sm" className="h-auto p-0" onClick={resetFilters}>
                Limpar filtros
              </Button>
            </div>
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
          <TabsContent value={tab} className="space-y-2" role="tabpanel" aria-labelledby={`tab-${tab}`}>
            {isLoading ? (
              <LoadingPlaceholder rows={3} />
            ) : filtered.length === 0 ? (
              <EmptyState 
                message="Nenhuma notificação encontrada" 
                actionLabel="Limpar filtros" 
                onAction={resetFilters} 
              />
            ) : (
              filtered.map((n) => (
                <NotificationCard
                  key={n.id}
                  n={n}
                  onMarkRead={async () => { 
                    await markRead.mutateAsync(n.id); 
                    toast.success("Marcada como lida"); 
                  }}
                  onRemove={async () => { 
                    await removeN.mutateAsync(n.id); 
                    toast.info("Notificação removida"); 
                  }}
                  onApprove={async () => {
                    await updateNotificacao.mutateAsync({ id: n.id, status: 'aprovado' });
                    toast.success("Notificação aprovada");
                  }}
                  onReject={async () => {
                    await updateNotificacao.mutateAsync({ id: n.id, status: 'rejeitado' });
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
