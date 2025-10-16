import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Package, FileText, Check, Trash2, CheckSquare, XCircle } from "lucide-react";
import { fmtDateTime } from "@/lib/date";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useAddAuditEntry } from "@/components/shared/AuditLog";

export type NotificationPriorityLabel = "Alta" | "Media" | "Baixa";
export type NotificationCategoryLabel =
  | "Solicitacao de materiais"
  | "Informe de Progresso"
  | "Notificacao de problemas";
export type NotificationStatusLabel = "Pendente" | "Aprovada" | "Rejeitada";

export interface NotificationView {
  id: string;
  title: string;
  description: string;
  category: NotificationCategoryLabel;
  priority: NotificationPriorityLabel;
  status: NotificationStatusLabel;
  obra?: string;
  sender?: string;
  createdAt: Date;
  isRead: boolean;
}

const categoryStyles: Record<NotificationCategoryLabel, string> = {
  "Solicitacao de materiais": "border-[hsl(var(--material))] bg-[hsl(var(--material-light))]",
  "Informe de Progresso": "border-[hsl(var(--progress))] bg-[hsl(var(--progress-light))]",
  "Notificacao de problemas": "border-[hsl(var(--problem))] bg-[hsl(var(--problem-light))]",
};

const priorityStyles: Record<NotificationPriorityLabel, string> = {
  Alta: "bg-[hsl(var(--problem))] text-[hsl(var(--problem-foreground))]",
  Media: "bg-[hsl(var(--report))] text-[hsl(var(--report-foreground))]",
  Baixa: "bg-[hsl(var(--progress))] text-[hsl(var(--progress-foreground))]",
};

const statusStyles: Record<NotificationStatusLabel, string> = {
  Pendente: "border",
  Aprovada: "bg-[hsl(var(--progress))] text-[hsl(var(--progress-foreground))]",
  Rejeitada: "bg-[hsl(var(--problem))] text-[hsl(var(--problem-foreground))]",
};

const categoryIcons: Record<NotificationCategoryLabel, typeof AlertTriangle> = {
  "Solicitacao de materiais": Package,
  "Informe de Progresso": FileText,
  "Notificacao de problemas": AlertTriangle,
};

interface NotificationCardProps {
  n: NotificationView;
  onMarkRead: () => void;
  onRemove: () => void;
  onApprove?: () => void;
  onReject?: () => void;
}

export default function NotificationCard({ n, onMarkRead, onRemove, onApprove, onReject }: NotificationCardProps) {
  const Icon = categoryIcons[n.category];
  const addAuditEntry = useAddAuditEntry();

  const handleMarkRead = () => {
    addAuditEntry({
      user: "Usuario Atual",
      action: "mark_read",
      details: `Marcou como lida: ${n.title}`,
    });
    onMarkRead();
  };

  const handleApprove = () => {
    if (onApprove) {
      addAuditEntry({
        user: "Usuario Atual",
        action: "approve",
        details: `Aprovou notificacao: ${n.title} (${n.category})`,
      });
      onApprove();
    }
  };

  const handleReject = () => {
    if (onReject) {
      addAuditEntry({
        user: "Usuario Atual",
        action: "reject",
        details: `Rejeitou notificacao: ${n.title}`,
      });
      onReject();
    }
  };

  return (
    <article className={`rounded-lg border-l-4 ${categoryStyles[n.category]} p-3 animate-fade-in`}>
      <header className="flex items-start gap-3">
        <Icon className="h-5 w-5 text-primary mt-0.5" />
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-medium leading-tight">{n.title}</h3>
            <Badge variant="outline">{n.category}</Badge>
            <Badge className={priorityStyles[n.priority]}>Prioridade: {n.priority}</Badge>
            {n.obra && <Badge variant="secondary">{n.obra}</Badge>}
            <Badge className={statusStyles[n.status]}>{n.status}</Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">{n.description}</p>
          <div className="text-xs text-muted-foreground mt-1">{fmtDateTime(n.createdAt)}</div>
        </div>
        <div className="flex items-center gap-2">
          {onApprove && n.status !== "Aprovada" && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button size="sm" onClick={handleApprove} aria-label="Aprovar notificacao">
                  <CheckSquare className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Aprovar</TooltipContent>
            </Tooltip>
          )}
          {onReject && n.status !== "Rejeitada" && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button size="sm" variant="outline" onClick={handleReject} aria-label="Rejeitar notificacao">
                  <XCircle className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Rejeitar</TooltipContent>
            </Tooltip>
          )}
          {!n.isRead && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button size="sm" variant="secondary" onClick={handleMarkRead} aria-label="Marcar como lida">
                  <Check className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Marcar como lida</TooltipContent>
            </Tooltip>
          )}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button size="sm" variant="outline" onClick={onRemove} aria-label="Excluir notificacao">
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
