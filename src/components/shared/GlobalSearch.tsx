import { useState, useMemo, useEffect } from "react";
import { Search, Command } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNotifications } from "@/data/mockNotifications";
import { useTasks } from "@/data/mockFeed";
import { useNavigate } from "react-router-dom";
import { useObraScope } from "@/app/obraScope";

type SearchResult = {
  id: string;
  title: string;
  description: string;
  type: "Notificação" | "Tarefa" | "Relatório";
  obra?: string;
  url: string;
};

export default function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const { data: notifications = [] } = useNotifications();
  const { data: tasks = [] } = useTasks();
  const { obra: obraScope } = useObraScope();
  const navigate = useNavigate();

  // Keyboard shortcut: / to focus search
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
    if (!query.trim()) return [];
    
    const q = query.toLowerCase();
    const items: SearchResult[] = [];

    // Filter by obra scope
    const filterByObra = (item: any) => obraScope === "todas" || item.obra === obraScope;

    // Search in notifications
    notifications
      .filter(filterByObra)
      .filter((n) => 
        n.title.toLowerCase().includes(q) || 
        n.description.toLowerCase().includes(q)
      )
      .forEach((n) => {
        items.push({
          id: n.id,
          title: n.title,
          description: n.description,
          type: "Notificação",
          obra: n.obra,
          url: "/notifications"
        });
      });

    // Search in tasks
    tasks
      .filter(filterByObra)
      .filter((t) => 
        t.title.toLowerCase().includes(q) || 
        t.description.toLowerCase().includes(q)
      )
      .forEach((t) => {
        items.push({
          id: t.id,
          title: t.title,
          description: t.description,
          type: "Tarefa",
          obra: t.obra,
          url: "/kanban"
        });
      });

    return items.slice(0, 10); // Limit results
  }, [query, notifications, tasks, obraScope]);

  const resultsByType = useMemo(() => {
    const groups: Record<string, SearchResult[]> = {};
    results.forEach((r) => {
      if (!groups[r.type]) groups[r.type] = [];
      groups[r.type].push(r);
    });
    return groups;
  }, [results]);

  const handleSelect = (result: SearchResult) => {
    navigate(result.url);
    setOpen(false);
    setQuery("");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="w-64 justify-start text-muted-foreground">
          <Search className="h-4 w-4 mr-2" />
          Buscar... <kbd className="ml-auto text-xs">/ </kbd>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <div className="space-y-4">
          <div className="relative">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar em notificações, tarefas e relatórios..."
              className="pl-10"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoFocus
            />
          </div>

          {query && (
            <div className="max-h-96 overflow-y-auto space-y-3">
              {Object.keys(resultsByType).length === 0 ? (
                <div className="text-sm text-muted-foreground text-center py-4">
                  Nenhum resultado encontrado
                </div>
              ) : (
                Object.entries(resultsByType).map(([type, items]) => (
                  <div key={type} className="space-y-2">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-medium">{type}</h3>
                      <Badge variant="secondary" className="text-xs">{items.length}</Badge>
                    </div>
                    <div className="space-y-1">
                      {items.map((result) => (
                        <button
                          key={result.id}
                          onClick={() => handleSelect(result)}
                          className="w-full text-left p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                        >
                          <div className="font-medium text-sm truncate">{result.title}</div>
                          <div className="text-xs text-muted-foreground line-clamp-2 mt-1">
                            {result.description}
                          </div>
                          {result.obra && (
                            <div className="text-xs text-muted-foreground mt-1">
                              Obra: {result.obra}
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {!query && (
            <div className="text-xs text-muted-foreground space-y-1">
              <p>💡 Dicas:</p>
              <ul className="ml-4 space-y-1">
                <li>• Digite para buscar em notificações, tarefas e relatórios</li>
                <li>• Use <kbd>/</kbd> para abrir a busca rapidamente</li>
                <li>• Resultados respeitam o escopo de obra atual</li>
              </ul>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}