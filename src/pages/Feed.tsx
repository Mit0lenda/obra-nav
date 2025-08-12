import PageHeader from "@/components/shared/PageHeader";
import { useFeedItems } from "@/data/mockFeed";
import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { AlertTriangle, FileText, Package, TrendingUp } from "lucide-react";
import { fmtDate, fmtDateTime } from "@/lib/date";
import { useNavigate } from "react-router-dom";

export default function Feed() {
  const { data: items = [], isLoading } = useFeedItems();
  const [q, setQ] = useState("");
  const [type, setType] = useState("all");
  const [order, setOrder] = useState<"desc" | "asc">("desc");
  const navigate = useNavigate();

  const filtered = useMemo(() => {
    const arr = items
      .filter((i) => (type === "all" ? true : i.type === (type as any)))
      .filter((i) => {
        const text = JSON.stringify(i.data).toLowerCase();
        return !q || text.includes(q.toLowerCase());
      })
      .sort((a, b) => (order === "desc" ? b.date.getTime() - a.date.getTime() : a.date.getTime() - b.date.getTime()));
    return arr;
  }, [items, q, type, order]);

  return (
    <div className="space-y-6">
      <PageHeader title="Feed de Registros" subtitle="Tarefas, relatórios e progresso" />

      <div className="rounded-lg border p-3 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Input placeholder="Buscar" value={q} onChange={(e) => setQ(e.target.value)} />
          <Select value={type} onValueChange={setType}>
            <SelectTrigger><SelectValue placeholder="Tipo" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="task">Tarefas</SelectItem>
              <SelectItem value="report">Relatórios</SelectItem>
              <SelectItem value="progress">Progresso</SelectItem>
            </SelectContent>
          </Select>
          <Select value={order} onValueChange={(v) => setOrder(v as any)}>
            <SelectTrigger><SelectValue placeholder="Ordenação" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="desc">Mais recentes</SelectItem>
              <SelectItem value="asc">Mais antigos</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {(q || type !== "all") && (
          <div className="text-xs text-muted-foreground">Encontrados: {filtered.length} <Button variant="link" className="px-1" onClick={() => { setQ(""); setType("all"); }}>Limpar filtros</Button></div>
        )}

        {isLoading ? (
          <div className="text-sm text-muted-foreground">Carregando…</div>
        ) : filtered.length === 0 ? (
          <div className="text-sm text-muted-foreground">Nenhum item.</div>
        ) : (
          <div className="space-y-2">
            {filtered.map((it) => {
              if (it.type === "task") {
                const t = it.data as any;
                const isProblem = t.type === "Problemas";
                const Icon = isProblem ? AlertTriangle : Package;
                const bgCls = isProblem
                  ? "bg-[hsl(var(--problem-light))] border-[hsl(var(--problem))]"
                  : "bg-[hsl(var(--material-light))] border-[hsl(var(--material))]";
                return (
                  <article key={it.id} className={`rounded-lg border-l-4 p-3 animate-fade-in ${bgCls}`}>
                    <div className="flex items-start gap-3">
                      <Icon className="h-5 w-5 text-primary mt-0.5" />
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-medium leading-tight">{t.title}</h3>
                          <span
                            className="text-xs px-2 py-0.5 rounded-md"
                            style={{ backgroundColor: isProblem ? "hsl(var(--problem))" : t.priority === "Média" ? "hsl(var(--report))" : "hsl(var(--progress))", color: "hsl(var(--foreground))" }}
                          >
                            Prioridade: {t.priority}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{t.description}</p>
                        <div className="text-xs text-muted-foreground mt-1">Kanban: {fmtDate(t.kanbanEntryDate)} · Conclusão: {fmtDateTime(t.completionDate)}</div>
                      </div>
                    </div>
                  </article>
                );
              }
              if (it.type === "report") {
                const r = it.data as any;
                return (
                  <button key={it.id} onClick={() => navigate(`/report/${r.id}`)} className="w-full text-left rounded-lg border-l-4 p-3 animate-fade-in bg-[hsl(var(--report-light))] border-[hsl(var(--report))] hover-scale">
                    <div className="flex items-start gap-3">
                      <FileText className="h-5 w-5 text-primary mt-0.5" />
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-medium leading-tight">{r.title}</h3>
                          <span className="text-xs px-2 py-0.5 rounded-md border">{r.status}</span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{r.summary}</p>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {r.characteristics.map((c: string) => (
                            <span key={c} className="text-xs px-2 py-0.5 rounded-md border">{c}</span>
                          ))}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">Publicação: {fmtDateTime(r.publishDate)}</div>
                      </div>
                    </div>
                  </button>
                );
              }
              const p = it.data as any;
              return (
                <article key={it.id} className="rounded-lg border-l-4 p-3 animate-fade-in bg-[hsl(var(--progress-light))] border-[hsl(var(--progress))]">
                  <div className="flex items-start gap-3">
                    <TrendingUp className="h-5 w-5 text-primary mt-0.5" />
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-medium leading-tight">{p.milestone}</h3>
                        <span className="text-xs px-2 py-0.5 rounded-md border">Marco</span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{p.description}</p>
                      <div className="text-xs text-muted-foreground mt-1">{fmtDateTime(p.date)}</div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
