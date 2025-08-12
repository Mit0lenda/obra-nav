import PageHeader from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export default function Estoque() {
  const navigate = useNavigate();
  return (
    <div className="space-y-4">
      <PageHeader
        title="Controle de Estoque"
        subtitle="Materiais em estoque e movimentações (mock)"
        action={
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => navigate('/inventory/entrada-xml')}>Nova Entrada</Button>
            <Button onClick={() => navigate('/inventory/baixa-manual')}>Nova Baixa</Button>
          </div>
        }
      />
      <div className="rounded-lg border p-4 text-sm text-muted-foreground">Tabela de materiais (mock) — com histórico de movimentações.</div>
    </div>
  );
}
