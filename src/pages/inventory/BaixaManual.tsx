import PageHeader from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAddMovement, useInventory } from "@/data/mockInventory";
import { useMemo, useState } from "react";
import { toast } from "@/components/ui/use-toast";

export default function BaixaManual() {
  const { data: inv = [] } = useInventory();
  const add = useAddMovement();
  const [materialId, setMaterialId] = useState<string>("");
  const [qtd, setQtd] = useState<string>("");
  const [motivo, setMotivo] = useState<string>("Uso na Obra");
  const [obs, setObs] = useState<string>("");
  const selected = useMemo(() => inv.find((i) => i.id === materialId) || null, [inv, materialId]);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingQty, setPendingQty] = useState<number | null>(null);

  const perform = async (value: number) => {
    await add.mutateAsync({
      materialId,
      mov: { tipo: 'Baixa', quantidade: -value, motivo: `${motivo}${obs ? ' — ' + obs : ''}`, usuario: 'Operador' },
    });
    toast({ title: 'Baixa registrada', description: `${value} ${selected?.unidade || ''} de ${selected?.material || ''}` });
    setQtd("");
    setObs("");
  };

  const submit = async () => {
    const value = Number(qtd);
    if (!materialId) { toast({ title: 'Selecione um material', className: 'bg-[hsl(var(--report-light))]' }); return; }
    if (!Number.isFinite(value) || value <= 0) { toast({ title: 'Quantidade inválida', description: 'Informe um valor maior que zero.', className: 'bg-[hsl(var(--problem-light))]' }); return; }
    if (selected && value > selected.quantidade) {
      setPendingQty(value);
      setConfirmOpen(true);
      return;
    }
    await perform(value);
  };

  return (
    <div className="space-y-4">
      <PageHeader title="Baixa Manual" subtitle="Selecione material, quantidade e motivo" />
      <div className="rounded-lg border p-4 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Select value={materialId} onValueChange={setMaterialId}>
            <SelectTrigger><SelectValue placeholder="Material" /></SelectTrigger>
            <SelectContent>
              {inv.map((i) => (
                <SelectItem key={i.id} value={i.id}>{i.material} — {i.quantidade} {i.unidade}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input type="number" min={1} placeholder="Quantidade" value={qtd} onChange={(e) => setQtd(e.target.value)} />
          <Select value={motivo} onValueChange={setMotivo}>
            <SelectTrigger><SelectValue placeholder="Motivo" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="Uso na Obra">Uso na Obra</SelectItem>
              <SelectItem value="Quebra/Perda">Quebra/Perda</SelectItem>
              <SelectItem value="Transferência">Transferência</SelectItem>
            </SelectContent>
          </Select>
          <Textarea placeholder="Observações (opcional)" value={obs} onChange={(e) => setObs(e.target.value)} />
        </div>
        <div className="flex gap-2">
          <Button onClick={submit}>Registrar Baixa</Button>
        </div>
      </div>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar baixa acima do estoque</DialogTitle>
            <DialogDescription>
              A quantidade solicitada ({pendingQty}) excede o estoque atual ({selected?.quantidade} {selected?.unidade}). Deseja registrar assim mesmo?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>Cancelar</Button>
            <Button
              onClick={async () => {
                if (pendingQty) {
                  await perform(pendingQty);
                }
                setConfirmOpen(false);
                setPendingQty(null);
              }}
            >
              Confirmar mesmo assim
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
