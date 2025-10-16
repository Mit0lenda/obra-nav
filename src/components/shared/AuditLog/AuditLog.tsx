import type { ReactNode } from "react";
import { Clock, User, FileText, Move, Check } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { fmtDateTime } from "@/lib/date";

import { useAuditoria } from "@/integrations/supabase/hooks/useAuditoria";

const actionLabels: Record<string, string> = {
  mark_read: "Marcou como lida",
  move_task: "Moveu tarefa",
  approve: "Aprovou notificação",
  reject: "Rejeitou notificação",
  entrada_xml: "Registrou entrada XML",
  baixa_manual: "Registrou baixa manual",
  create: "Criou",
  update: "Atualizou",
  delete: "Deletou",
};

const actionIcons: Record<string, ReactNode> = {
  mark_read: <Check className="h-4 w-4" />,
  move_task: <Move className="h-4 w-4" />,
  approve: <Check className="h-4 w-4" />,
  reject: <FileText className="h-4 w-4" />,
  entrada_xml: <FileText className="h-4 w-4" />,
  baixa_manual: <FileText className="h-4 w-4" />,
  create: <FileText className="h-4 w-4" />,
  update: <FileText className="h-4 w-4" />,
  delete: <FileText className="h-4 w-4" />,
};

export function AuditLog() {
  const { data: entries = [], isLoading } = useAuditoria();

  if (isLoading) {
    return (
      <div className="space-y-2 p-4">
        <div className="h-16 animate-pulse rounded bg-muted" />
        <div className="h-16 animate-pulse rounded bg-muted" />
        <div className="h-16 animate-pulse rounded bg-muted" />
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="p-4 text-center text-sm text-muted-foreground">
        Nenhuma atividade registrada
      </div>
    );
  }

  return (
    <ScrollArea className="h-[400px]">
      <div className="space-y-2 p-4">
        {entries.map((entry) => (
          <div
            key={entry.id}
            className="flex items-start gap-3 rounded-lg border bg-card p-3 text-card-foreground shadow-sm transition-colors hover:bg-accent"
          >
            <div className="mt-1 flex-shrink-0 text-muted-foreground">
              {actionIcons[entry.acao] || <FileText className="h-4 w-4" />}
            </div>

            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">
                      {actionLabels[entry.acao] || entry.acao}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <User className="h-3 w-3 text-muted-foreground" />
                    <span className="font-medium">{entry.usuario}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  <span>{fmtDateTime(new Date(entry.timestamp))}</span>
                </div>
              </div>

              {entry.detalhes && (
                <p className="text-sm text-muted-foreground">{entry.detalhes}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}
