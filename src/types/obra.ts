export type PriorityLevel = 'Baixa' | 'Média' | 'Alta';
export type TaskType = 'Problemas' | 'Solicitação de materiais';

export type Task = {
  id: string;
  type: TaskType;
  title: string;
  description: string;
  priority: PriorityLevel;
  kanbanEntryDate: Date;
  completionDate: Date;
  specifications?: string;
  obra: string;
};

export type WorkReport = {
  id: string;
  title: string;
  summary: string;
  publishDate: Date;
  characteristics: string[];
  status: 'Aprovado' | 'Publicado';
};

export type ProgressUpdate = {
  id: string;
  reportId: string;
  description: string;
  milestone: string;
  date: Date;
};

export type FeedItem = {
  id: string;
  type: 'task' | 'report' | 'progress';
  date: Date;
  data: Task | WorkReport | ProgressUpdate;
};
