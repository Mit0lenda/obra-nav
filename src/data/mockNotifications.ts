import { QueryClient, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fmtDateTime } from "@/lib/date";
import { apiCreateTaskFromNotification, apiAddApprovalToFeed, taskKeys, feedKeys } from "@/data/mockFeed";
export type NotificationCategory =
  | "Solicitação de materiais"
  | "Informe de Progresso"
  | "Notificação de problemas/inconformidades";
export type NotificationPriority = "Alta" | "Média" | "Baixa";

export type AppNotification = {
  id: string;
  title: string;
  description: string;
  category: NotificationCategory;
  priority: NotificationPriority;
  timestamp: string; // ISO
  isRead: boolean;
  sender: string;
  obra: string;
  status: "Pendente" | "Aprovada" | "Rejeitada";
};

const LS_KEY = "nexium_notifications_v1";

const seed: AppNotification[] = [
  {
    id: "n1",
    title: "Solicitação de Cimento",
    description: "Requisição de 50 sacos para fundação",
    category: "Solicitação de materiais",
    priority: "Média",
    timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
    isRead: false,
    sender: "Almoxarifado",
    obra: "Residencial Vista Verde",
    status: "Pendente",
  },
  {
    id: "n2",
    title: "Inconformidade no Pilar P2",
    description: "Trinca observada durante inspeção",
    category: "Notificação de problemas/inconformidades",
    priority: "Alta",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
    isRead: false,
    sender: "Fiscalização",
    obra: "Edifício Central",
    status: "Pendente",
  },
  {
    id: "n3",
    title: "Marco atingido: Laje 3ª",
    description: "Concretagem concluída",
    category: "Informe de Progresso",
    priority: "Baixa",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(),
    isRead: true,
    sender: "Engenharia",
    obra: "Residencial Vista Verde",
    status: "Pendente",
  },
];

function load(): AppNotification[] {
  const raw = localStorage.getItem(LS_KEY);
  if (!raw) return seed;
  try {
    return JSON.parse(raw) as AppNotification[];
  } catch {
    return seed;
  }
}

function save(data: AppNotification[]) {
  localStorage.setItem(LS_KEY, JSON.stringify(data));
}

function delay<T>(v: T, ms = 300) {
  return new Promise<T>((res) => setTimeout(() => res(v), ms));
}

export async function apiListNotifications() {
  const list = load().sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  return delay(list);
}

export async function apiMarkRead(id: string) {
  const list = load();
  const idx = list.findIndex((n) => n.id === id);
  if (idx >= 0) list[idx].isRead = true;
  save(list);
  return delay(true);
}

export async function apiMarkAllRead() {
  const list = load().map((n) => ({ ...n, isRead: true }));
  save(list);
  return delay(true);
}

export async function apiRemove(id: string) {
  const list = load().filter((n) => n.id !== id);
  save(list);
  return delay(true);
}

export async function apiUnreadCount() {
  const list = load();
  const count = list.filter((n) => !n.isRead).length;
  return delay(count);
}

export async function apiObrasFromNotifications() {
  const list = load();
  const obras = Array.from(new Set(list.map((n) => n.obra))).sort();
  return delay(obras);
}

// React Query hooks
export const notificationsKeys = {
  root: ["notifications"] as const,
  unread: ["notifications-unread"] as const,
  obras: ["notifications-obras"] as const,
};

export function useNotifications() {
  return useQuery({ queryKey: notificationsKeys.root, queryFn: apiListNotifications });
}

export function useUnreadCount() {
  return useQuery({ queryKey: notificationsKeys.unread, queryFn: apiUnreadCount, refetchInterval: 5000 });
}

export function useObrasFromNotifications() {
  return useQuery({ queryKey: notificationsKeys.obras, queryFn: apiObrasFromNotifications });
}

export function useMarkRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiMarkRead(id),
    onSuccess: async () => {
      await Promise.all([
        qc.invalidateQueries({ queryKey: notificationsKeys.root }),
        qc.invalidateQueries({ queryKey: notificationsKeys.unread }),
      ]);
    },
  });
}

export function useMarkAllRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: apiMarkAllRead,
    onSuccess: async () => {
      await Promise.all([
        qc.invalidateQueries({ queryKey: notificationsKeys.root }),
        qc.invalidateQueries({ queryKey: notificationsKeys.unread }),
      ]);
    },
  });
}

export function useRemoveNotification() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiRemove(id),
    onSuccess: async () => {
      await Promise.all([
        qc.invalidateQueries({ queryKey: notificationsKeys.root }),
        qc.invalidateQueries({ queryKey: notificationsKeys.unread }),
      ]);
    },
  });
}

export async function apiApproveNotification(id: string) {
  const list = load();
  const idx = list.findIndex((n) => n.id === id);
  if (idx < 0) return delay(false);
  const n = list[idx];
  list[idx] = { ...n, status: "Aprovada" };
  save(list);
  // Side effects: create task when applicable and add to feed as approval event
  await Promise.allSettled([
    apiCreateTaskFromNotification(n as any),
    apiAddApprovalToFeed(n as any),
  ]);
  return delay(true);
}

export async function apiRejectNotification(id: string) {
  const list = load();
  const idx = list.findIndex((n) => n.id === id);
  if (idx < 0) return delay(false);
  list[idx].status = "Rejeitada";
  save(list);
  return delay(true);
}

export function useApproveNotification() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiApproveNotification(id),
    onSuccess: async () => {
      await Promise.all([
        qc.invalidateQueries({ queryKey: notificationsKeys.root }),
        qc.invalidateQueries({ queryKey: notificationsKeys.unread }),
        qc.invalidateQueries({ queryKey: taskKeys.root }),
        qc.invalidateQueries({ queryKey: taskKeys.obras }),
        qc.invalidateQueries({ queryKey: feedKeys.root }),
      ]);
    },
  });
}

export function useRejectNotification() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiRejectNotification(id),
    onSuccess: async () => {
      await Promise.all([
        qc.invalidateQueries({ queryKey: notificationsKeys.root }),
        qc.invalidateQueries({ queryKey: notificationsKeys.unread }),
      ]);
    },
  });
}
