import PageHeader from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { KanbanSquare } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Notifications() {
  const navigate = useNavigate();
  return (
    <div className="space-y-4">
      <PageHeader
        title="Central de Notificações"
        subtitle="Filtros por obra, prioridade e categoria (mock)"
        action={
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => navigate("/kanban")}> 
              <KanbanSquare className="h-4 w-4 mr-2" /> Ver Kanban
            </Button>
            <Button onClick={() => { /* mock */ }}>Marcar Todas como Lidas</Button>
          </div>
        }
      />
      <div className="text-sm text-muted-foreground">Conteúdo em breve: abas, contadores, filtro por Obra e cards de notificação.</div>
    </div>
  );
}
