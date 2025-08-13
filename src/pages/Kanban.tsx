import PageHeader from "@/components/shared/PageHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useTasks, useMoveTask } from "@/data/mockFeed";
import { useMemo, useState, useEffect } from "react";
import { toast } from "@/components/ui/use-toast";
import { AlertTriangle, Package, Check, RotateCcw, Timer } from "lucide-react";
import { useObraScope } from "@/app/obraScope";

export default function Kanban() {
  const { data: tasks = [], isLoading } = useTasks();
  const move = useMoveTask();
  const [tab, setTab] = useState<'geral' | 'materiais'>('geral');
  const { obra: obraScope, setObra } = useObraScope();
  const [priority, setPriority] = useState<string>('todas');
  const [overdueOnly, setOverdueOnly] = useState(false);
  const [slaToastShown, setSlaToastShown] = useState(false);

  const SLA_HOURS: Record<string, number> = { Alta: 24, Média: 72, Baixa: 120 };
  const hoursSince = (d: any) => Math.floor((Date.now() - new Date(d).getTime()) / 3600000);
  const isOverdue = (t: any) => (t.status !== 'Concluído') && hoursSince(t.kanbanEntryDate) > (SLA_HOURS[t.priority] ?? 9999);
  const fmtAge = (h: number) => (h < 24 ? `${h}h` : `${Math.floor(h / 24)}d ${h % 24}h`);

  const obrasOptions = useMemo(() => {
    const set = new Set<string>(tasks.map((t: any) => t.obra).filter(Boolean));
    return ['todas', ...Array.from(set)];
  }, [tasks]);

  const filtered = useMemo(() => {
    return tasks
      .filter((t: any) => (tab === 'materiais' ? t.type === 'Solicitação de materiais' : true))
      .filter((t: any) => (obraScope === 'todas' ? true : t.obra === obraScope))
      .filter((t: any) => (priority === 'todas' ? true : t.priority === priority))
      .filter((t: any) => (overdueOnly ? isOverdue(t) : true));
  }, [tasks, tab, obraScope, priority, overdueOnly]);

  const byStatus = useMemo(() => {
    return {
      'A Fazer': filtered.filter((t: any) => t.status === 'A Fazer'),
      'Em Andamento': filtered.filter((t: any) => t.status === 'Em Andamento'),
      'Concluído': filtered.filter((t: any) => t.status === 'Concluído'),
    } as Record<'A Fazer' | 'Em Andamento' | 'Concluído', any[]>;
  }, [filtered]);

  useEffect(() => {
    if (slaToastShown || isLoading) return;
    const count = filtered.filter((t: any) => isOverdue(t) && t.status !== 'Concluído').length;
    if (count > 0) {
      toast({ title: 'Tarefas vencidas', description: `${count} tarefa(s) acima do SLA.`, className: 'bg-[hsl(var(--problem-light))]' });
      setSlaToastShown(true);
    }
  }, [filtered, isLoading, slaToastShown]);

  const handleMove = (id: string, status: 'A Fazer' | 'Em Andamento' | 'Concluído') => {
    move.mutate({ id, status }, {
      onSuccess: () => {
        if (status === 'Concluído') {
          toast({ title: 'Tarefa concluída', description: 'Movida para Concluído e refletida no Feed.' });
        } else if (status === 'A Fazer') {
          toast({ title: 'Tarefa reaberta', description: 'Movida de volta para A Fazer.', className: 'bg-[hsl(var(--report-light))]' });
        } else {
          toast({ title: 'Tarefa atualizada', description: `Movida para ${status}.` });
        }
      },
      onError: () => toast({ title: 'Erro ao mover tarefa', description: 'Tente novamente.', className: 'bg-[hsl(var(--problem-light))]' })
    });
  };

  const TaskCard = ({ t }: { t: any }) => {
    const isProblem = t.type === 'Problemas';
    const Icon = isProblem ? AlertTriangle : Package;
    const bgCls = isProblem
      ? 'bg-[hsl(var(--problem-light))] border-[hsl(var(--problem))]'
      : 'bg-[hsl(var(--material-light))] border-[hsl(var(--material))]';

    const ageH = hoursSince(t.kanbanEntryDate);
    const slaH = SLA_HOURS[t.priority] ?? 9999;
    const overdue = t.status !== 'Concluído' && ageH > slaH;
    const hl = overdue ? 'ring-1 ring-[hsl(var(--problem))]' : '';

    return (
      <div className={`rounded-lg border-l-4 p-3 animate-fade-in ${bgCls} ${hl}`}>
        <div className="flex items-start gap-3">
          <Icon className="h-5 w-5 text-primary mt-0.5" />
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-medium leading-tight truncate">{t.title}</h3>
              <span className="text-xs px-2 py-0.5 rounded-md border">{t.type}</span>
              <Badge variant="outline">Prioridade: {t.priority}</Badge>
              <span className={`text-xs px-2 py-0.5 rounded-md border inline-flex items-center gap-1 ${overdue ? 'border-[hsl(var(--problem))] text-[hsl(var(--problem))]' : ''}`} aria-label={`Idade ${fmtAge(ageH)} e SLA ${slaH} horas`}>
                <Timer className="h-3 w-3" /> {fmtAge(ageH)} / {slaH}h
              </span>
              {overdue && (
                <span className="text-xs px-2 py-0.5 rounded-md border bg-[hsl(var(--problem-light))] border-[hsl(var(--problem))]">Vencido</span>
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{t.description}</p>
            {t.obra && <div className="text-xs text-muted-foreground mt-1">Obra: {t.obra}</div>}
            <div className="flex gap-2 mt-2">
              {t.status !== 'A Fazer' && (
                <Button variant="secondary" size="sm" onClick={() => handleMove(t.id, 'A Fazer')} aria-label="Mover para A Fazer">
                  <RotateCcw className="h-4 w-4 mr-1" /> Voltar
                </Button>
              )}
              {t.status !== 'Em Andamento' && (
                <Button variant="outline" size="sm" onClick={() => handleMove(t.id, 'Em Andamento')} aria-label="Mover para Em Andamento">Em Andamento</Button>
              )}
              {t.status !== 'Concluído' && (
                <Button size="sm" onClick={() => handleMove(t.id, 'Concluído')} aria-label="Concluir tarefa">
                  <Check className="h-4 w-4 mr-1" /> Concluir
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Kanban de Tarefas" subtitle="Geral e Requisição de Materiais" />

      <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
        <TabsList>
          <TabsTrigger value="geral">KANBAN GERAL</TabsTrigger>
          <TabsTrigger value="materiais">REQUISIÇÃO DE MATERIAIS</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-3">
          <Select value={obraScope} onValueChange={setObra}>
            <SelectTrigger><SelectValue placeholder="Obra" /></SelectTrigger>
            <SelectContent>
              {obrasOptions.map((o) => (
                <SelectItem key={o} value={o}>{o === 'todas' ? 'Todas as obras' : o}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={priority} onValueChange={setPriority}>
            <SelectTrigger><SelectValue placeholder="Prioridade" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas</SelectItem>
              <SelectItem value="Baixa">Baixa</SelectItem>
              <SelectItem value="Média">Média</SelectItem>
              <SelectItem value="Alta">Alta</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex items-center gap-2">
            <Switch id="overdue-only" checked={overdueOnly} onCheckedChange={setOverdueOnly} />
            <label htmlFor="overdue-only" className="text-sm text-muted-foreground">Apenas vencidos (SLA)</label>
          </div>
        </div>

        {(['A Fazer', 'Em Andamento', 'Concluído'] as const).map((col) => (
          <section key={col} className="rounded-lg border p-3">
            <div className="font-medium mb-2">{col}</div>
            {isLoading ? (
              <div className="text-sm text-muted-foreground">Carregando…</div>
            ) : byStatus[col].length === 0 ? (
              <div className="text-sm text-muted-foreground">Sem cartões.</div>
            ) : (
              <div className="space-y-2">
                {byStatus[col].map((t) => (
                  <TaskCard key={t.id} t={t} />
                ))}
              </div>
            )}
          </section>
        ))}
      </div>
    </div>
  );
}
