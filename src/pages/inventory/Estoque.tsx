import PageHeader from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useNavigate } from "react-router-dom";
import { useMemo, useState, useEffect } from "react";
import { useInventory, useMovements, obrasOptions, categoriaOptions, InventoryItem } from "@/data/mockInventory";
import { fmtDate, fmtDateTime } from "@/lib/date";
import { ArrowUpDown, History, Search } from "lucide-react";
import { useObraScope } from "@/app/obraScope";
import { LoadingPlaceholder, EmptyState } from "@/components/shared/States";
import { useDebounce } from "@/hooks/use-debounce";

export default function Estoque() {
  const navigate = useNavigate();
  const { data: items = [], isLoading } = useInventory();
  const { obra: obraScope } = useObraScope();

  type SortKey = 'quantidade' | 'ultimaMov';
  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [obra, setObra] = useState<(typeof obrasOptions)[number]>("Todas as obras");
  const [cat, setCat] = useState<(typeof categoriaOptions)[number]>("Todos");
  const [sortBy, setSortBy] = useState<SortKey>('quantidade');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [dialogId, setDialogId] = useState<string | null>(null);

  // Debounce search
  const debouncedSetSearch = useDebounce((value: string) => {
    setDebouncedQ(value);
  }, 300);

  useEffect(() => {
    debouncedSetSearch(q);
  }, [q, debouncedSetSearch]);

  // Sync with global obra scope
  useEffect(() => {
    if (obraScope !== "todas" && obrasOptions.includes(obraScope as any)) {
      setObra(obraScope as any);
    }
  }, [obraScope]);

  // persist filters
  useEffect(() => {
    const raw = localStorage.getItem('nexium_inv_filters_v1');
    if (raw) {
      try {
        const s = JSON.parse(raw);
        if (s.q) setQ(s.q);
        if (s.obra) setObra(s.obra);
        if (s.cat) setCat(s.cat);
        if (s.sortBy) setSortBy(s.sortBy);
        if (s.sortDir) setSortDir(s.sortDir);
      } catch {}
    }
  }, []);
  useEffect(() => {
    localStorage.setItem('nexium_inv_filters_v1', JSON.stringify({ q, obra, cat, sortBy, sortDir }));
  }, [q, obra, cat, sortBy, sortDir]);

  const filtered = useMemo(() => {
    let arr = items as InventoryItem[];
    if (debouncedQ) arr = arr.filter((i) => i.material.toLowerCase().includes(debouncedQ.toLowerCase()));
    if (obra !== 'Todas as obras') arr = arr.filter((i) => i.obra === obra);
    if (cat !== 'Todos') arr = arr.filter((i) => i.categoria === cat);
    arr = [...arr].sort((a, b) => {
      let cmp = 0;
      if (sortBy === 'quantidade') cmp = a.quantidade - b.quantidade;
      else cmp = new Date(a.ultimaMov).getTime() - new Date(b.ultimaMov).getTime();
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return arr;
  }, [items, debouncedQ, obra, cat, sortBy, sortDir]);

  const resetFilters = () => {
    setQ('');
    setObra('Todas as obras');
    setCat('Todos');
  };

  const selected = filtered.find((i) => i.id === dialogId) || items.find((i) => i.id === dialogId) || null;
  const { data: movements = [], isLoading: loadingMov } = useMovements(dialogId || "");

  const StatusBadge = ({ status }: { status: InventoryItem['status'] }) => {
    const map: Record<InventoryItem['status'], string> = {
      Normal: 'bg-[hsl(var(--progress-light))] border-[hsl(var(--progress))]',
      Baixo: 'bg-[hsl(var(--report-light))] border-[hsl(var(--report))]',
      Crítico: 'bg-[hsl(var(--problem-light))] border-[hsl(var(--problem))]',
    };
    return <span className={`text-xs px-2 py-0.5 rounded-md border ${map[status]}`}>{status}</span>;
  };

  const sortToggle = (key: SortKey) => {
    if (sortBy === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortBy(key); setSortDir('desc'); }
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="Controle de Estoque"
        subtitle={`Materiais em estoque e movimentações ${obraScope !== "todas" ? `(Escopo: ${obraScope})` : ""}`}
        action={
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => navigate('/inventory/entrada-xml')}>Nova Entrada</Button>
            <Button onClick={() => navigate('/inventory/baixa-manual')}>Nova Baixa</Button>
          </div>
        }
      />

      <div className="rounded-lg border p-4 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="relative">
            <Search className="h-4 w-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
            <Input placeholder="Buscar material" value={q} onChange={(e) => setQ(e.target.value)} className="pl-10" />
          </div>
          <Select value={obra} onValueChange={(v) => setObra(v as any)}>
            <SelectTrigger><SelectValue placeholder="Obra" /></SelectTrigger>
            <SelectContent>
              {obrasOptions.map((o) => (
                <SelectItem key={o} value={o}>{o}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={cat} onValueChange={(v) => setCat(v as any)}>
            <SelectTrigger><SelectValue placeholder="Categoria" /></SelectTrigger>
            <SelectContent>
              {categoriaOptions.map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex gap-2">
            <Button variant="outline" className="w-full" onClick={resetFilters}>Limpar filtros</Button>
          </div>
        </div>

        {(q || obra !== 'Todas as obras' || cat !== 'Todos') && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            Encontrados: {filtered.length} 
            <Button variant="link" size="sm" className="h-auto p-0" onClick={resetFilters}>
              Limpar filtros
            </Button>
          </div>
        )}

        <div className="overflow-x-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Material</TableHead>
                <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => sortToggle('quantidade')} tabIndex={0} aria-label="Ordenar por quantidade">
                  <div className="inline-flex items-center gap-1">Quantidade <ArrowUpDown className="h-4 w-4" /></div>
                </TableHead>
                <TableHead>Unidade</TableHead>
                <TableHead>Obra</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => sortToggle('ultimaMov')} tabIndex={0} aria-label="Ordenar por última movimentação">
                  <div className="inline-flex items-center gap-1">Última Movimentação <ArrowUpDown className="h-4 w-4" /></div>
                </TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={7} className="text-center py-4"><LoadingPlaceholder rows={1} /></TableCell></TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-4">
                    <EmptyState 
                      message="Nenhum material encontrado" 
                      actionLabel="Limpar filtros" 
                      onAction={resetFilters} 
                    />
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((i) => (
                  <TableRow key={i.id}>
                    <TableCell className="font-medium">{i.material}</TableCell>
                    <TableCell>{i.quantidade}</TableCell>
                    <TableCell>{i.unidade}</TableCell>
                    <TableCell>{i.obra}</TableCell>
                    <TableCell><StatusBadge status={i.status} /></TableCell>
                    <TableCell>{fmtDate(new Date(i.ultimaMov))}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm" onClick={() => setDialogId(i.id)}>
                        <History className="h-4 w-4 mr-1" /> Histórico
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <Dialog open={!!dialogId} onOpenChange={(o) => !o && setDialogId(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Histórico de Movimentações</DialogTitle>
            <DialogDescription>Movimentações do material selecionado</DialogDescription>
          </DialogHeader>

          {!selected ? (
            <div className="text-sm text-muted-foreground">Nenhum material selecionado.</div>
          ) : (
            <div className="space-y-3">
              <div className="rounded-md border p-3 text-sm">
                <div className="font-medium">{selected.material}</div>
                <div className="text-muted-foreground">Estoque atual: {selected.quantidade} {selected.unidade} · <StatusBadge status={selected.status} /></div>
              </div>

              <div className="overflow-x-auto rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Quantidade</TableHead>
                      <TableHead>Motivo</TableHead>
                      <TableHead>Usuário</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loadingMov ? (
                      <TableRow><TableCell colSpan={5} className="text-sm text-muted-foreground">Carregando…</TableCell></TableRow>
                    ) : movements.length === 0 ? (
                      <TableRow><TableCell colSpan={5} className="text-sm text-muted-foreground">Sem movimentações.</TableCell></TableRow>
                    ) : (
                      movements.map((m) => (
                        <TableRow key={m.id}>
                          <TableCell>{fmtDateTime(new Date(m.data))}</TableCell>
                          <TableCell>
                            <span className={`text-xs px-2 py-0.5 rounded-md border ${m.tipo === 'Entrada' ? 'bg-[hsl(var(--progress-light))] border-[hsl(var(--progress))]' : 'bg-[hsl(var(--problem-light))] border-[hsl(var(--problem))]'}`}>{m.tipo}</span>
                          </TableCell>
                          <TableCell className={m.quantidade >= 0 ? 'text-[hsl(var(--progress))]' : 'text-[hsl(var(--problem))]'}>{m.quantidade}</TableCell>
                          <TableCell>{m.motivo}</TableCell>
                          <TableCell>{m.usuario}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
