import PageHeader from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, Plus, Bell, KanbanSquare, Boxes, Map, ListPlus } from "lucide-react";
import { Link } from "react-router-dom";

export default function Index() {
  const quick = [
    { title: "Atualizar Progresso", desc: "Registre marcos e avanços", icon: LayoutDashboard, to: "/feed", variant: "construction" },
    { title: "Adicionar Obra", desc: "Crie uma nova obra", icon: Plus, to: "/projects", variant: "material" },
    { title: "Ver Notificações", desc: "Central de avisos", icon: Bell, to: "/notifications", variant: "warning" },
    { title: "Abrir Kanban", desc: "Tarefas e status", icon: KanbanSquare, to: "/kanban", variant: "progress" },
    { title: "Controle de Estoque", desc: "Materiais e movimentos", icon: Boxes, to: "/inventory", variant: "material" },
    { title: "Ver Mapa", desc: "Obras geolocalizadas", icon: Map, to: "/map", variant: "construction" },
  ];

  return (
    <div className="space-y-6">
      <div className="text-center py-8">
        <div className="inline-flex items-center gap-3 mb-4">
          <div className="h-12 w-12 rounded-lg gradient-primary grid place-items-center">
            <LayoutDashboard className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Nexium</h1>
            <p className="text-sm text-muted-foreground">Sistema completo de gestão de obras</p>
          </div>
        </div>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Gerencie suas obras de forma eficiente com ferramentas profissionais para engenheiros e construtores
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {quick.map((q) => (
          <Card key={q.title} className="card-hover shadow-soft">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-base">
                <div className={`p-2 rounded-lg ${
                  q.variant === 'construction' ? 'bg-primary/10 text-primary' :
                  q.variant === 'material' ? 'bg-material/10 text-material' :
                  q.variant === 'warning' ? 'bg-warning/10 text-warning' :
                  'bg-progress/10 text-progress'
                }`}>
                  <q.icon className="h-5 w-5" />
                </div>
                {q.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <p className="text-sm text-muted-foreground">{q.desc}</p>
              <Button asChild variant="gradient" size="sm">
                <Link to={q.to} className="inline-flex items-center gap-2">
                  <ListPlus className="h-4 w-4" /> Acessar
                </Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
