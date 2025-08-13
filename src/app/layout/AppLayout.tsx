import { Outlet, useNavigate } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import AppSidebar from "./Sidebar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useObrasFromTasks } from "@/data/mockFeed";
import { useObraScope } from "@/app/obraScope";
import { useEffect } from "react";

export default function AppLayout() {
  const { data: obrasTasks = [] } = useObrasFromTasks();
  const { obra, setObra } = useObraScope();
  const navigate = useNavigate();
  useEffect(() => {
    let awaitingKey: string | null = null;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'g') {
        awaitingKey = 'g';
        return;
      }
      if (awaitingKey === 'g') {
        if (e.key === 'n') navigate('/notifications');
        if (e.key === 'k') navigate('/kanban');
        if (e.key === 'i') navigate('/inventory');
        awaitingKey = null;
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [navigate]);

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background text-foreground">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <header className="h-14 flex items-center border-b px-3 gap-2">
            <SidebarTrigger className="mr-1" />
            <h1 className="text-sm font-medium text-muted-foreground">Nexium — Gestão de Obras</h1>
            <div className="ml-auto flex items-center gap-3">
              <div className="w-56">
                <Select value={obra} onValueChange={setObra}>
                  <SelectTrigger aria-label="Escopo de Obra">
                    <SelectValue placeholder="Todas as obras" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todas">Todas as obras</SelectItem>
                    {obrasTasks.map((o) => (
                      <SelectItem key={o} value={o}>{o}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <span className="text-xs text-success">● Sistema Online</span>
            </div>
          </header>
          <main className="flex-1 p-4 container mx-auto animate-fade-in">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
