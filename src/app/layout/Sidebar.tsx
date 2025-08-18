import { NavLink } from "react-router-dom";
import { LayoutDashboard, Construction, Bell, ListOrdered, KanbanSquare, Boxes, Map as MapIcon, Activity } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import QuickSummary from "./QuickSummary";
import { useUnreadCount } from "@/data/mockNotifications";

const items = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Obras em Andamento", url: "/projects", icon: Construction },
  { title: "Central de Notificações", url: "/notifications", icon: Bell },
  { title: "Feed de Registros", url: "/feed", icon: ListOrdered },
  { title: "Kanban de Tarefas", url: "/kanban", icon: KanbanSquare },
  { title: "Controle de Estoque", url: "/inventory", icon: Boxes },
  { title: "Mapa das Obras", url: "/map", icon: MapIcon },
  { title: "Log do Sistema", url: "/system-log", icon: Activity },
];

export default function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const getNavCls = ({ isActive }: { isActive: boolean }) =>
    isActive ? "bg-muted text-primary font-medium" : "hover:bg-muted/50";
  const { data: unread = 0 } = useUnreadCount();
  return (
    <Sidebar collapsible="icon" className={collapsed ? "w-14" : "w-64"}>
      <div className="px-3 py-3 border-b">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-md bg-primary/10 flex items-center justify-center text-primary font-bold">N</div>
          {!collapsed && (
            <div>
              <div className="font-semibold leading-none">Nexium</div>
              <div className="text-xs text-muted-foreground">Gestão de Obras</div>
            </div>
          )}
        </div>
      </div>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navegação</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} end className={getNavCls}>
                      <item.icon className="mr-2 h-4 w-4" />
                      {!collapsed && (
                        <span className="inline-flex items-center gap-2">
                          {item.title}
                          {item.title === "Central de Notificações" && unread > 0 && (
                            <span className="ml-2 rounded-full bg-primary/10 text-primary text-[10px] px-1.5 py-0.5">
                              {unread}
                            </span>
                          )}
                        </span>
                      )}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Resumo Rápido</SidebarGroupLabel>
          <SidebarGroupContent>
            <QuickSummary mini={collapsed} />
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <div className="mt-auto p-3 border-t text-xs text-muted-foreground">
        {!collapsed ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded-full bg-accent text-accent-foreground grid place-items-center text-[10px] font-bold">NU</div>
              <span>Usuário</span>
            </div>
            <span className="text-success">Online</span>
          </div>
        ) : (
          <div className="text-center text-success">●</div>
        )}
      </div>
    </Sidebar>
  );
}
