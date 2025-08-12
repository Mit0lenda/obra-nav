import PageHeader from "@/components/shared/PageHeader";

export default function Projects() {
  return (
    <div className="space-y-6">
      <PageHeader title="Obras em Andamento" subtitle="Listagem de obras com status e progresso (mock)" />
      <div className="text-sm text-muted-foreground">Conteúdo em breve: cards de obras com progresso, pendências e ações.</div>
    </div>
  );
}
