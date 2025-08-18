import { useState, useEffect } from "react";
import { Clock, User, FileText, Move, Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { fmtDateTime } from "@/lib/date";

export type AuditEntry = {
  id: string;
  timestamp: Date;
  user: string;
  action: "mark_read" | "move_task" | "approve" | "reject" | "entrada_xml" | "baixa_manual";
  details: string;
  entityType: "notification" | "task" | "inventory";
  entityId: string;
};

const LS_AUDIT = "nexium_audit_log_v1";

function loadAuditLog(): AuditEntry[] {
  try {
    const raw = localStorage.getItem(LS_AUDIT);
    if (!raw) return [];
    return JSON.parse(raw, (k, v) => {
      if (k === "timestamp") return new Date(v);
      return v;
    });
  } catch {
    return [];
  }
}

function saveAuditLog(entries: AuditEntry[]) {
  localStorage.setItem(LS_AUDIT, JSON.stringify(entries));
}

export function addAuditEntry(entry: Omit<AuditEntry, "id" | "timestamp">) {
  const entries = loadAuditLog();
  const newEntry: AuditEntry = {
    ...entry,
    id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    timestamp: new Date(),
  };
  entries.unshift(newEntry);
  // Keep only last 100 entries
  entries.splice(100);
  saveAuditLog(entries);
}

const actionLabels: Record<AuditEntry["action"], string> = {
  mark_read: "Marcou como lida",
  move_task: "Moveu tarefa",
  approve: "Aprovou notificação",
  reject: "Rejeitou notificação", 
  entrada_xml: "Registrou entrada XML",
  baixa_manual: "Registrou baixa manual",
};

const actionIcons: Record<AuditEntry["action"], React.ReactNode> = {
  mark_read: <Check className="h-4 w-4" />,
  move_task: <Move className="h-4 w-4" />,
  approve: <Check className="h-4 w-4" />,
  reject: <FileText className="h-4 w-4" />,
  entrada_xml: <FileText className="h-4 w-4" />,
  baixa_manual: <FileText className="h-4 w-4" />,
};

export default function AuditLog({ className }: { className?: string }) {
  const [entries, setEntries] = useState<AuditEntry[]>([]);

  useEffect(() => {
    setEntries(loadAuditLog());
    // Listen for changes
    const interval = setInterval(() => {
      setEntries(loadAuditLog());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  if (entries.length === 0) {
    return (
      <div className={`text-sm text-muted-foreground ${className}`}>
        Nenhuma ação registrada ainda.
      </div>
    );
  }

  return (
    <ScrollArea className={`h-96 ${className}`}>
      <div className="space-y-2">
        {entries.map((entry) => (
          <div key={entry.id} className="flex items-start gap-3 p-3 rounded-lg border">
            <div className="flex items-center gap-2 text-primary">
              {actionIcons[entry.action]}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-medium truncate">
                  {actionLabels[entry.action]}
                </span>
                <Badge variant="outline" className="text-xs">
                  {entry.entityType}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                {entry.details}
              </p>
              <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                <User className="h-3 w-3" />
                <span>{entry.user}</span>
                <Clock className="h-3 w-3 ml-2" />
                <span>{fmtDateTime(entry.timestamp)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}
