import { createBrowserRouter } from "react-router-dom";
import AppLayout from "./layout/AppLayout";
import Index from "@/pages/Index";
import Auth from "@/pages/Auth";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

import ObrasEmAndamento from "@/pages/ObrasEmAndamento";
import Projects from "@/pages/Projects";
import Notifications from "@/pages/Notifications";
import Feed from "@/pages/Feed";
import Kanban from "@/pages/KanbanFinal";
import InventoryLayout from "@/pages/inventory/InventoryLayout";
import Estoque from "@/pages/inventory/Estoque";
import EntradaXML from "@/pages/inventory/EntradaXML";
import BaixaManual from "@/pages/inventory/BaixaManual";
import Relatorios from "@/pages/inventory/Relatorios";
import InventoryPage from "@/pages/inventory/InventoryPage";
import MapPage from "@/pages/Map";
import Report from "@/pages/Report";
import NotFound from "@/pages/NotFound";
import SystemLog from "@/pages/SystemLog";
import PerformanceOptimization from "@/pages/PerformanceOptimization";
import ReportsPage from "@/pages/ReportsPage";
import EnhancedDashboard from "@/pages/EnhancedDashboard";
import EstoqueSimples from "@/pages/EstoqueSimples";
import DashboardHome from "@/pages/DashboardHome";

export const router = createBrowserRouter([
  {
    path: "/auth",
    element: <Auth />,
  },
  {
    path: "/",
    element: (
      <ProtectedRoute>
        <AppLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <DashboardHome /> },
      { path: "obras-em-andamento", element: <ObrasEmAndamento /> },
      { path: "projects", element: <Projects /> },
      { path: "notifications", element: <Notifications /> },
      { path: "feed", element: <Feed /> },
      { path: "kanban", element: <Kanban /> },
      {
        path: "inventory",
        element: <InventoryLayout />,
        children: [
          { index: true, element: <Estoque /> },
          { path: "entrada-xml", element: <EntradaXML /> },
          { path: "baixa-manual", element: <BaixaManual /> },
          { path: "relatorios", element: <Relatorios /> },
        ],
      },
      { path: "inventory-new", element: <InventoryPage /> },
      { path: "map", element: <MapPage /> },
      { path: "report/:id", element: <Report /> },
      { path: "system-log", element: <SystemLog /> },
      { path: "performance", element: <PerformanceOptimization /> },
      { path: "reports-advanced", element: <ReportsPage /> },
      { path: "dashboard-enhanced", element: <EnhancedDashboard /> },
      { path: "estoque", element: <EstoqueSimples /> },
      { path: "*", element: <NotFound /> },
    ],
  },
]);
