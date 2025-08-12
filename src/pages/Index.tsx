import PageHeader from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, Plus, Bell, KanbanSquare, Boxes, Map, ListPlus } from "lucide-react";
import { Link } from "react-router-dom";

export default function Index() {
  const quick = [
    { title: "Atualizar Progresso", desc: "Registre marcos e avanços", icon: LayoutDashboard, to: "/feed" },
    { title: "Adicionar Obra", desc: "Crie uma nova obra", icon: Plus, to: "/projects" },
    { title: "Ver Notificações", desc: "Central de avisos", icon: Bell, to: "/notifications" },
    { title: "Abrir Kanban", desc: "Tarefas e status", icon: KanbanSquare, to: "/kanban" },
    { title: "Controle de Estoque", desc: "Materiais e movimentos", icon: Boxes, to: "/inventory" },
    { title: "Ver Mapa", desc: "Obras geolocalizadas", icon: Map, to: "/map" },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Bem-vindo ao Nexium" subtitle="Sistema completo de gestão de obras para engenheiros" />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {quick.map((q) => (
          <Card key={q.title} className="hover:shadow-md transition">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <q.icon className="h-5 w-5 text-primary" /> {q.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">{q.desc}</p>
              <Button asChild>
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
