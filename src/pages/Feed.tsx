import PageHeader from "@/components/shared/PageHeader";

export default function Feed() {
  return (
    <div className="space-y-6">
      <PageHeader title="Feed de Registros" subtitle="Tarefas, relatórios e progresso (mock)" />
      <div className="text-sm text-muted-foreground">Conteúdo em breve: filtros, busca, ordenação e cards do feed com cores por tipo.</div>
    </div>
  );
}
