import { AuditEntry, AuditEntryInput } from "./types";

const storageKey = "nexium_audit_log_v1";

export function loadAuditLog(): AuditEntry[] {
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) {
      return [];
    }

    return JSON.parse(raw, (key, value) => {
      if (key === "timestamp") {
        return new Date(value);
      }
      return value;
    });
  } catch {
    return [];
  }
}

function persist(entries: AuditEntry[]) {
  localStorage.setItem(storageKey, JSON.stringify(entries));
}

export function addAuditEntry(entry: AuditEntryInput) {
  const entries = loadAuditLog();
  const newEntry: AuditEntry = {
    ...entry,
    id: `audit_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`,
    timestamp: new Date(),
  };

  entries.unshift(newEntry);
  entries.splice(100);
  persist(entries);

  return newEntry;
}

export const auditLogStorage = {
  load: loadAuditLog,
  add: addAuditEntry,
  key: storageKey,
};
