import PageHeader from "@/components/shared/PageHeader";

export default function Kanban() {
  return (
    <div className="space-y-6">
      <PageHeader title="Kanban de Tarefas" subtitle="Geral e Requisição de Materiais (mock)" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {['A Fazer', 'Em Andamento', 'Concluído'].map((col) => (
          <div key={col} className="rounded-lg border p-3">
            <div className="font-medium mb-2">{col}</div>
            <div className="text-sm text-muted-foreground">Sem cartões.</div>
          </div>
        ))}
      </div>
    </div>
  );
}
