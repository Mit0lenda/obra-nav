export type AuditAction =
  | "mark_read"
  | "move_task"
  | "approve"
  | "reject"
  | "entrada_xml"
  | "baixa_manual";

export type AuditEntityType = "notification" | "task" | "inventory";

export type AuditEntry = {
  id: string;
  timestamp: Date;
  user: string;
  action: AuditAction;
  details: string;
  entityType: AuditEntityType;
  entityId: string;
};

export type AuditEntryInput = Omit<AuditEntry, "id" | "timestamp">;
