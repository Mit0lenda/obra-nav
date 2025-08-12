import PageHeader from "@/components/shared/PageHeader";

export default function BaixaManual() {
  return (
    <div className="space-y-4">
      <PageHeader title="Baixa Manual" subtitle="Selecione material, quantidade e motivo (simulado)" />
      <div className="rounded-lg border p-4 text-sm text-muted-foreground">Formulário de baixa (mock) com toasts.</div>
    </div>
  );
}
