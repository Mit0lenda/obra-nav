import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { Clock, User, FileText, Move, Check } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { fmtDateTime } from "@/lib/date";

import { loadAuditLog, auditLogStorage } from "./storage";
import type { AuditEntry, AuditAction } from "./types";

const actionLabels: Record<AuditAction, string> = {
  mark_read: "Marcou como lida",
  move_task: "Moveu tarefa",
  approve: "Aprovou notificação",
  reject: "Rejeitou notificação",
  entrada_xml: "Registrou entrada XML",
  baixa_manual: "Registrou baixa manual",
};

const actionIcons: Record<AuditAction, ReactNode> = {
  mark_read: <Check className="h-4 w-4" />,
  move_task: <Move className="h-4 w-4" />,
  approve: <Check className="h-4 w-4" />,
  reject: <FileText className="h-4 w-4" />,
  entrada_xml: <FileText className="h-4 w-4" />,
  baixa_manual: <FileText className="h-4 w-4" />,
};

export function AuditLog({ className }: { className?: string }) {
  const [entries, setEntries] = useState<AuditEntry[]>([]);

  useEffect(() => {
    setEntries(loadAuditLog());

    const interval = window.setInterval(() => {
      setEntries(loadAuditLog());
    }, 1000);

    return () => window.clearInterval(interval);
  }, []);

  if (entries.length === 0) {
    return (
      <div className={`text-sm text-muted-foreground ${className ?? ""}`}>
        Nenhuma ação registrada ainda.
      </div>
    );
  }

  return (
    <ScrollArea className={`h-96 ${className ?? ""}`}>
      <div className="space-y-2">
        {entries.map((entry) => (
          <div key={entry.id} className="flex items-start gap-3 rounded-lg border p-3">
            <div className="flex items-center gap-2 text-primary">
              {actionIcons[entry.action]}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="truncate text-sm font-medium">
                  {actionLabels[entry.action]}
                </span>
                <Badge variant="outline" className="text-xs">
                  {entry.entityType}
                </Badge>
              </div>
              <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                {entry.details}
              </p>
              <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                <User className="h-3 w-3" />
                <span>{entry.user}</span>
                <Clock className="ml-2 h-3 w-3" />
                <span>{fmtDateTime(entry.timestamp)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}

export const auditLogUtils = auditLogStorage;
