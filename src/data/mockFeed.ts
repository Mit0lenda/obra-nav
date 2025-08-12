import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { FeedItem, ProgressUpdate, Task, WorkReport } from "@/types/obra";

const LS_TASKS = "nexium_tasks_v1";
const LS_REPORTS = "nexium_reports_v1";
const LS_PROGRESS = "nexium_progress_v1";

const seedTasks: (Task & { status: "A Fazer" | "Em Andamento" | "Concluído" })[] = [
  {
    id: "t1",
    type: "Problemas",
    title: "Infiltração na parede norte",
    description: "Verificar impermeabilização",
    priority: "Alta",
    kanbanEntryDate: new Date(Date.now() - 1000 * 60 * 60 * 30),
    completionDate: new Date(Date.now() - 1000 * 60 * 60 * 2),
    status: "Concluído",
    obra: "Residencial Vista Verde",
  },
  {
    id: "t2",
    type: "Solicitação de materiais",
    title: "Comprar vergalhão 10mm",
    description: "200 barras para viga V3",
    priority: "Média",
    kanbanEntryDate: new Date(Date.now() - 1000 * 60 * 60 * 50),
    completionDate: new Date(Date.now() - 1000 * 60 * 60 * 20),
    status: "Em Andamento",
    obra: "Edifício Central",
  },
  {
    id: "t3",
    type: "Solicitação de materiais",
    title: "Areia fina adicional",
    description: "30 m³ para contrapiso",
    priority: "Baixa",
    kanbanEntryDate: new Date(Date.now() - 1000 * 60 * 60 * 10),
    completionDate: new Date(Date.now() - 1000 * 60 * 60 * 1),
    status: "A Fazer",
    obra: "Residencial Vista Verde",
  },
];

const seedReports: WorkReport[] = [
  {
    id: "r1",
    title: "Relatório Semanal 12",
    summary: "Progresso satisfatório com pequenas pendências.",
    publishDate: new Date(Date.now() - 1000 * 60 * 60 * 40),
    characteristics: ["Equipe completa", "Clima estável"],
    status: "Publicado",
  },
  {
    id: "r2",
    title: "Relatório Inspeção Estrutural",
    summary: "Estrutura principal concluída.",
    publishDate: new Date(Date.now() - 1000 * 60 * 60 * 90),
    characteristics: ["Laudos OK", "Materiais em dia"],
    status: "Aprovado",
  },
];

const seedProgress: ProgressUpdate[] = [
  {
    id: "p1",
    reportId: "r1",
    description: "Concretagem da laje T3",
    milestone: "Marco",
    date: new Date(Date.now() - 1000 * 60 * 60 * 60),
  },
  {
    id: "p2",
    reportId: "r1",
    description: "Instalação de esquadrias",
    milestone: "Marco",
    date: new Date(Date.now() - 1000 * 60 * 60 * 35),
  },
  {
    id: "p3",
    reportId: "r2",
    description: "Vistoria final",
    milestone: "Marco",
    date: new Date(Date.now() - 1000 * 60 * 60 * 85),
  },
];

function load<T>(key: string, fallback: T): T {
  const raw = localStorage.getItem(key);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw, (k, v) => {
      if (k.toLowerCase().includes("date")) return new Date(v);
      return v;
    }) as T;
  } catch {
    return fallback;
  }
}
function save<T>(key: string, value: T) {
  localStorage.setItem(key, JSON.stringify(value));
}
function delay<T>(v: T, ms = 300) {
  return new Promise<T>((res) => setTimeout(() => res(v), ms));
}

export function getTasks() {
  return load(LS_TASKS, seedTasks);
}
export function getReports() {
  return load(LS_REPORTS, seedReports);
}
export function getProgressUpdates() {
  return load(LS_PROGRESS, seedProgress);
}

export function setTasks(v: typeof seedTasks) {
  save(LS_TASKS, v);
}
export function setReports(v: WorkReport[]) {
  save(LS_REPORTS, v);
}
export function setProgress(v: ProgressUpdate[]) {
  save(LS_PROGRESS, v);
}

export async function apiGenerateFeed(): Promise<FeedItem[]> {
  const tasks = getTasks();
  const reports = getReports();
  const progress = getProgressUpdates();
  const items: FeedItem[] = [
    ...tasks
      .filter((t) => t.status === "Concluído")
      .map((t) => ({ id: `t-${t.id}`, type: "task" as const, date: new Date(t.completionDate), data: t })),
    ...reports.map((r) => ({ id: `r-${r.id}`, type: "report" as const, date: new Date(r.publishDate), data: r })),
    ...progress.map((p) => ({ id: `p-${p.id}`, type: "progress" as const, date: new Date(p.date), data: p })),
  ];
  items.sort((a, b) => b.date.getTime() - a.date.getTime());
  return delay(items);
}

export const feedKeys = { root: ["feed-items"] as const };
export function useFeedItems() {
  return useQuery({ queryKey: feedKeys.root, queryFn: apiGenerateFeed });
}

export type TaskStatus = "A Fazer" | "Em Andamento" | "Concluído";

export async function apiListTasks() {
  return delay(getTasks());
}
export const taskKeys = { root: ["tasks"] as const, obras: ["tasks-obras"] as const };
export function useTasks() {
  return useQuery({ queryKey: taskKeys.root, queryFn: apiListTasks });
}

export async function apiMoveTask(id: string, status: TaskStatus) {
  const tasks = getTasks();
  const idx = tasks.findIndex((t) => t.id === id);
  if (idx >= 0) {
    tasks[idx].status = status;
    if (status === "Concluído") tasks[idx].completionDate = new Date();
    setTasks(tasks);
  }
  return delay(true);
}

export function useMoveTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: TaskStatus }) => apiMoveTask(id, status),
    onSuccess: async () => {
      await Promise.all([
        qc.invalidateQueries({ queryKey: taskKeys.root }),
        qc.invalidateQueries({ queryKey: feedKeys.root }),
        qc.invalidateQueries({ queryKey: taskKeys.obras }),
      ]);
    },
  });
}

export function apiGetReportById(id: string) {
  const reports = getReports();
  return delay(reports.find((r) => r.id === id));
}
export function apiGetProgressByReportId(reportId: string) {
  const updates = getProgressUpdates().filter((p) => p.reportId === reportId);
  return delay(updates);
}

// ——— Extensions for integrations ———
import type { AppNotification } from "@/data/mockNotifications";

export async function apiCreateTaskFromNotification(n: AppNotification) {
  const mapType: Record<AppNotification["category"], Task["type"] | null> = {
    "Solicitação de materiais": "Solicitação de materiais",
    "Informe de Progresso": null,
    "Notificação de problemas/inconformidades": "Problemas",
  };
  const tType = mapType[n.category];
  if (!tType) return null;
  const tasks = getTasks();
  const id = `t_${Date.now()}`;
  const newTask: Task & { status: TaskStatus } = {
    id,
    type: tType,
    title: n.title,
    description: n.description,
    priority: n.priority,
    kanbanEntryDate: new Date(),
    completionDate: new Date(),
    status: "A Fazer",
    obra: n.obra,
  };
  tasks.unshift(newTask);
  setTasks(tasks);
  return delay(newTask);
}

export async function apiAddApprovalToFeed(n: AppNotification) {
  const progress = getProgressUpdates();
  const id = `appr_${Date.now()}`;
  progress.unshift({
    id,
    reportId: "approval",
    description: `Notificação aprovada: ${n.title} (${n.category})`,
    milestone: "Aprovação",
    date: new Date(),
  });
  setProgress(progress);
  return delay(true);
}

export async function apiObrasFromTasks() {
  const tasks = getTasks();
  const obras = Array.from(new Set(tasks.map((t) => t.obra).filter(Boolean))).sort();
  return delay(obras);
}
export function useObrasFromTasks() {
  return useQuery({ queryKey: taskKeys.obras, queryFn: apiObrasFromTasks });
}
