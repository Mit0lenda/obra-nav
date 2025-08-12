import { AppNotification, NotificationPriority } from "@/data/mockNotifications";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Package, FileText, Check, Trash2 } from "lucide-react";
import { fmtDateTime } from "@/lib/date";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export default function NotificationCard({ n, onMarkRead, onRemove }: { n: AppNotification; onMarkRead: () => void; onRemove: () => void }) {
  const colorByCat: Record<AppNotification["category"], string> = {
    "Solicitação de materiais": "border-[hsl(var(--material))] bg-[hsl(var(--material-light))]",
    "Informe de Progresso": "border-[hsl(var(--progress))] bg-[hsl(var(--progress-light))]",
    "Notificação de problemas/inconformidades": "border-[hsl(var(--problem))] bg-[hsl(var(--problem-light))]",
  };
  const prColor: Record<NotificationPriority, string> = {
    Alta: "bg-[hsl(var(--problem))] text-[hsl(var(--problem-foreground))]",
    Média: "bg-[hsl(var(--report))] text-[hsl(var(--report-foreground))]",
    Baixa: "bg-[hsl(var(--progress))] text-[hsl(var(--progress-foreground))]",
  };
  const Icon = n.category === "Solicitação de materiais" ? Package : n.category === "Informe de Progresso" ? FileText : AlertTriangle;

  return (
    <article className={`rounded-lg border-l-4 ${colorByCat[n.category]} p-3 animate-fade-in`}> 
      <header className="flex items-start gap-3">
        <Icon className="h-5 w-5 text-primary mt-0.5" />
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-medium leading-tight">{n.title}</h3>
            <Badge variant="outline">{n.category}</Badge>
            <Badge className={prColor[n.priority]}>Prioridade: {n.priority}</Badge>
            <Badge variant="secondary">{n.obra}</Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">{n.description}</p>
          <div className="text-xs text-muted-foreground mt-1">{fmtDateTime(n.timestamp)}</div>
        </div>
        <div className="flex items-center gap-2">
          {!n.isRead && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button size="sm" variant="secondary" onClick={onMarkRead}>
                  <Check className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Marcar como lida</TooltipContent>
            </Tooltip>
          )}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button size="sm" variant="outline" onClick={onRemove}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Excluir</TooltipContent>
          </Tooltip>
        </div>
      </header>
    </article>
  );
}
