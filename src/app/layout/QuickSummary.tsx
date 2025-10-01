import { Card, CardContent } from "@/components/ui/card";
import { useObras } from "@/integrations/supabase/hooks/useObras";
import { useTasks } from "@/integrations/supabase/hooks/useTasks";
import { useRelatorios } from "@/integrations/supabase/hooks/useRelatorios";
import { useNotificacoes } from "@/integrations/supabase/hooks/useNotificacoes";
import { useMemo } from "react";

function isTaskDone(status?: string | null) {
  if (!status) return false;
  const normalized = status.toLowerCase();
  return normalized.includes("conclu");
}

export default function QuickSummary({ mini = false }: { mini?: boolean }) {
  const { data: obras = [] } = useObras();
  const { data: tasks = [] } = useTasks();
  const { data: relatorios = [] } = useRelatorios();
  const { data: notifications = [] } = useNotificacoes();

  const metrics = useMemo(() => {
    const pendingTasks = tasks.filter((task) => !isTaskDone(task.status)).length;
    const publishedReports = relatorios.length;
    const openNotifications = notifications.filter((notif) => !notif.lida).length;

    return [
      { label: "Obras cadastradas", value: obras.length },
      { label: "Tarefas em aberto", value: pendingTasks },
      { label: "Relatorios", value: publishedReports },
      { label: "Notificacoes abertas", value: openNotifications },
    ];
  }, [obras, tasks, relatorios, notifications]);

  if (mini) return null;

  return (
    <div className="grid grid-cols-2 gap-2">
      {metrics.map((metric) => (
        <Card key={metric.label} className="shadow-sm">
          <CardContent className="p-3">
            <div className="text-xs text-muted-foreground">{metric.label}</div>
            <div className="text-lg font-semibold">{metric.value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
