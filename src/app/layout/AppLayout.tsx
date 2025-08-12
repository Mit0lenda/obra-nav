import { Outlet } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import AppSidebar from "./Sidebar";

export default function AppLayout() {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background text-foreground">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <header className="h-14 flex items-center border-b px-3 gap-2">
            <SidebarTrigger className="mr-1" />
            <h1 className="text-sm font-medium text-muted-foreground">Nexium — Gestão de Obras</h1>
            <span className="ml-auto text-xs text-success">● Sistema Online</span>
          </header>
          <main className="flex-1 p-4 container mx-auto animate-fade-in">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
