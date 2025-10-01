import { Outlet, useNavigate } from "react-router-dom";
import { useEffect, useMemo } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import AppSidebar from "./Sidebar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useObraScope } from "@/app/obraScope";
import GlobalSearch from "@/components/shared/GlobalSearch";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { LogOut, User } from "lucide-react";
import { useObras } from "@/integrations/supabase/hooks/useObras";

export default function AppLayout() {
  const { data: obras = [] } = useObras();
  const obraOptions = useMemo(() => {
    const unique = new Set<string>();
    obras.forEach((obra) => {
      if (obra?.nome) {
        unique.add(obra.nome);
      }
    });
    return Array.from(unique).sort((a, b) => a.localeCompare(b, "pt-BR", { sensitivity: "base" }));
  }, [obras]);

  const { obra, setObra } = useObraScope();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    let awaitingKey: string | null = null;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "g") {
        awaitingKey = "g";
        return;
      }
      if (awaitingKey === "g") {
        if (e.key === "n") navigate("/notifications");
        if (e.key === "k") navigate("/kanban");
        if (e.key === "i") navigate("/inventory");
        awaitingKey = null;
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [navigate]);

  const selectOptions = obra === "todas" || obraOptions.includes(obra)
    ? obraOptions
    : [...obraOptions, obra];

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background text-foreground">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <header className="h-14 flex items-center border-b px-3 gap-2">
            <SidebarTrigger className="mr-1" />
            <h1 className="text-sm font-medium text-muted-foreground">Nexium - Gestao de Obras</h1>
            <div className="ml-auto flex items-center gap-3">
              <GlobalSearch />
              <div className="w-56">
                <Select value={obra} onValueChange={setObra}>
                  <SelectTrigger aria-label="Escopo de Obra">
                    <SelectValue placeholder="Todas as obras" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todas">Todas as obras</SelectItem>
                    {selectOptions.map((nome) => (
                      <SelectItem key={nome} value={nome}>
                        {nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {obra !== "todas" && (
                <Badge variant="secondary" className="text-xs">
                  Escopo: {obra}
                </Badge>
              )}
              <span className="text-xs text-success">Sistema Online</span>

              <div className="flex items-center gap-2 border-l pl-3">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  {user?.email}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={signOut}
                  className="h-8 px-2"
                  aria-label="Fazer logout"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
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
