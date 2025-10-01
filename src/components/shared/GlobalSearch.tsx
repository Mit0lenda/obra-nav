import { useState, useMemo, useEffect } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNotificacoes } from "@/integrations/supabase/hooks/useNotificacoes";
import { useTasks } from "@/integrations/supabase/hooks/useTasks";
import { useRelatorios } from "@/integrations/supabase/hooks/useRelatorios";
import { useObras } from "@/integrations/supabase/hooks/useObras";
import { useNavigate } from "react-router-dom";
import { useObraScope } from "@/app/obraScope";

interface SearchResult {
  id: string;
  title: string;
  description: string;
  type: "Notificacao" | "Tarefa" | "Relatorio";
  obra?: string;
  url: string;
}

export default function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const { data: notifications = [] } = useNotificacoes();
  const { data: tasks = [] } = useTasks();
  const { data: relatorios = [] } = useRelatorios();
  const { data: obras = [] } = useObras();
  const { obra: scope, setObra } = useObraScope();
  const navigate = useNavigate();

  const obraNamesById = useMemo(() => {
    const map = new Map<string, string>();
    obras.forEach((obra) => {
      if (obra?.id && obra?.nome) {
        map.set(obra.id, obra.nome);
      }
    });
    return map;
  }, [obras]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "/" && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        setOpen(true);
      }
      if (e.key === "Escape") setOpen(false);
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const results = useMemo(() => {
    if (!query.trim()) return [] as SearchResult[];

    const normalizedQuery = query.toLowerCase();
    const matches: SearchResult[] = [];
    const matchesScope = (obraName?: string | null) => scope === "todas" || (obraName && obraName === scope);

    notifications
      .filter((notif) => matchesScope(notif.obra?.nome))
      .filter((notif) => {
        const title = notif.titulo?.toLowerCase() ?? "";
        const desc = notif.descricao?.toLowerCase() ?? "";
        return title.includes(normalizedQuery) || desc.includes(normalizedQuery);
      })
      .forEach((notif) => {
        matches.push({
          id: `notif-${notif.id}`,
          title: notif.titulo,
          description: notif.descricao ?? "",
          type: "Notificacao",
          obra: notif.obra?.nome,
          url: "/notifications",
        });
      });

    tasks
      .filter((task) => matchesScope(task.obra?.nome))
      .filter((task) => {
        const title = task.titulo?.toLowerCase() ?? "";
        const desc = task.descricao?.toLowerCase() ?? "";
        return title.includes(normalizedQuery) || desc.includes(normalizedQuery);
      })
      .forEach((task) => {
        matches.push({
          id: `task-${task.id}`,
          title: task.titulo,
          description: task.descricao ?? "",
          type: "Tarefa",
          obra: task.obra?.nome,
          url: "/kanban",
        });
      });

    relatorios
      .filter((rel) => {
        const obraName = rel.obra_id ? obraNamesById.get(rel.obra_id) : undefined;
        return matchesScope(obraName);
      })
      .filter((rel) => {
        const title = rel.titulo?.toLowerCase() ?? "";
        const resumo = rel.resumo?.toLowerCase() ?? "";
        return title.includes(normalizedQuery) || resumo.includes(normalizedQuery);
      })
      .forEach((rel) => {
        const obraName = rel.obra_id ? obraNamesById.get(rel.obra_id) : undefined;
        matches.push({
          id: `report-${rel.id}`,
          title: rel.titulo,
          description: rel.resumo ?? "",
          type: "Relatorio",
          obra: obraName,
          url: `/report/${rel.id}`,
        });
      });

    return matches.slice(0, 15);
  }, [query, notifications, tasks, relatorios, scope, obraNamesById]);

  const grouped = useMemo(() => {
    return results.reduce<Record<string, SearchResult[]>>((acc, item) => {
      if (!acc[item.type]) acc[item.type] = [];
      acc[item.type].push(item);
      return acc;
    }, {});
  }, [results]);

  const handleSelect = (result: SearchResult) => {
    if (result.obra) {
      setObra(result.obra);
    }
    navigate(result.url);
    setOpen(false);
    setQuery("");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="w-64 justify-start text-muted-foreground">
          <Search className="h-4 w-4 mr-2" />
          Buscar...
          <kbd className="ml-auto text-xs">/</kbd>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <div className="space-y-4">
          <div className="relative">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar em notificacoes, tarefas e relatorios"
              className="pl-10"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoFocus
            />
          </div>

          {query ? (
            <div className="max-h-96 overflow-y-auto space-y-3">
              {Object.keys(grouped).length === 0 ? (
                <div className="text-sm text-muted-foreground text-center py-4">
                  Nenhum resultado encontrado
                </div>
              ) : (
                Object.entries(grouped).map(([type, items]) => (
                  <div key={type} className="space-y-2">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-medium">{type}</h3>
                      <Badge variant="secondary" className="text-xs">{items.length}</Badge>
                    </div>
                    <div className="space-y-1">
                      {items.map((item) => (
                        <button
                          key={item.id}
                          onClick={() => handleSelect(item)}
                          className="w-full text-left p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                        >
                          <div className="font-medium text-sm truncate">{item.title}</div>
                          <div className="text-xs text-muted-foreground line-clamp-2 mt-1">
                            {item.description || "Sem detalhes"}
                          </div>
                          {item.obra && (
                            <div className="text-xs text-muted-foreground mt-1">
                              Obra: {item.obra}
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : (
            <div className="text-xs text-muted-foreground space-y-1">
              <p>Dicas de uso:</p>
              <ul className="ml-4 list-disc space-y-1">
                <li>Digite para buscar em notificacoes, tarefas e relatorios</li>
                <li>Use a tecla / para abrir a busca rapidamente</li>
                <li>Os resultados respeitam o escopo de obra selecionado</li>
              </ul>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
