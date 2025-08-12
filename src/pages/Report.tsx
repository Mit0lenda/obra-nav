import PageHeader from "@/components/shared/PageHeader";
import { useParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function Report() {
  const { id } = useParams();
  return (
    <div className="space-y-4">
      <PageHeader title={`Relatório ${id ?? ''}`} subtitle="Detalhe do relatório (mock)" action={<Button asChild><Link to="/feed">Voltar</Link></Button>} />
      <div className="rounded-lg border p-4 text-sm text-muted-foreground">Conteúdo do relatório em breve.</div>
    </div>
  );
}
