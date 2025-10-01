import { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

// Base Table DTOs
export type TaskDTO = Tables<'tasks'>;
export type TaskInsertDTO = TablesInsert<'tasks'>;
export type TaskUpdateDTO = TablesUpdate<'tasks'>;

export type RelatorioDTO = Tables<'relatorios'>;
export type RelatorioInsertDTO = TablesInsert<'relatorios'>;
export type RelatorioUpdateDTO = TablesUpdate<'relatorios'>;

export type AtualizacaoProgressoDTO = Tables<'atualizacoes_progresso'>;
export type AtualizacaoProgressoInsertDTO = TablesInsert<'atualizacoes_progresso'>;
export type AtualizacaoProgressoUpdateDTO = TablesUpdate<'atualizacoes_progresso'>;

export type ObraDTO = Tables<'obras'>;
export type ObraInsertDTO = TablesInsert<'obras'>;
export type ObraUpdateDTO = TablesUpdate<'obras'>;

export type MaterialDTO = Tables<'materiais'>;
export type MaterialInsertDTO = TablesInsert<'materiais'>;
export type MaterialUpdateDTO = TablesUpdate<'materiais'>;

export type NotificacaoDTO = Tables<'notificacoes'>;
export type NotificacaoInsertDTO = TablesInsert<'notificacoes'>;
export type NotificacaoUpdateDTO = TablesUpdate<'notificacoes'>;

export type MovimentacaoDTO = Tables<'movimentacoes'>;
export type MovimentacaoInsertDTO = TablesInsert<'movimentacoes'>;
export type MovimentacaoUpdateDTO = TablesUpdate<'movimentacoes'>;

export type AuditoriaDTO = Tables<'auditoria'>;
export type AuditoriaInsertDTO = TablesInsert<'auditoria'>;

// Transformed DTOs for UI consumption
export type TaskStatus = 'pendente' | 'em_andamento' | 'concluida' | 'cancelada';
export type TaskPriority = 'baixa' | 'media' | 'alta';
export type TaskType = 'problema' | 'solicitacao_material' | 'manutencao' | 'outros';

export interface TaskTransformed {
  id: string;
  titulo: string;
  descricao: string | null;
  tipo: TaskType;
  prioridade: TaskPriority;
  status: TaskStatus;
  obra_id: string | null;
  responsavel: string | null;
  solicitante: string | null;
  prazo: string | null;
  data_criacao: string;
  area: string | null;
  quantidade: number | null;
  created_at: string;
  updated_at: string | null;
}

export type RelatorioStatus = 'rascunho' | 'aprovado' | 'publicado';

export interface RelatorioTransformed {
  id: string;
  titulo: string;
  resumo: string | null;
  status: RelatorioStatus;
  obra_id: string | null;
  data_publicacao: string | null;
  caracteristicas: string[];
  created_at: string;
  updated_at: string | null;
}

export interface AtualizacaoProgressoTransformed {
  id: string;
  descricao: string;
  marco: string | null;
  data: string | null;
  relatorio_id: string | null;
  created_at: string;
}

export interface ObraTransformed {
  id: string;
  nome: string;
  endereco?: string | null;
  status?: string | null;
  responsavel?: string | null;
  data_inicio?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  coords: [number, number];
  created_at: string;
  updated_at?: string | null;
}

// Feed Item Types
export type FeedItemType = 'task' | 'relatorio' | 'atualizacao_progresso';

export interface FeedItemTransformed {
  id: string;
  type: FeedItemType;
  date: string;
  data: TaskTransformed | RelatorioTransformed | AtualizacaoProgressoTransformed;
}

// Utility types for transformations
export type DTOTransformer<TInput, TOutput> = (input: TInput) => TOutput;

// Transformation functions
export const transformTask: DTOTransformer<TaskDTO, TaskTransformed> = (task) => ({
  id: task.id,
  titulo: task.titulo,
  descricao: task.descricao,
  tipo: (task.tipo as TaskType) || 'outros',
  prioridade: (task.prioridade as TaskPriority) || 'media',
  status: (task.status as TaskStatus) || 'pendente',
  obra_id: task.obra_id,
  responsavel: task.responsavel,
  solicitante: task.solicitante,
  prazo: task.prazo,
  data_criacao: task.data_criacao || task.created_at || new Date().toISOString(),
  area: task.area,
  quantidade: task.quantidade,
  created_at: task.created_at || new Date().toISOString(),
  updated_at: task.updated_at,
});

export const transformRelatorio: DTOTransformer<RelatorioDTO, RelatorioTransformed> = (relatorio) => ({
  id: relatorio.id,
  titulo: relatorio.titulo,
  resumo: relatorio.resumo,
  status: (relatorio.status as RelatorioStatus) || 'rascunho',
  obra_id: relatorio.obra_id,
  data_publicacao: relatorio.data_publicacao,
  caracteristicas: relatorio.caracteristicas || [],
  created_at: relatorio.created_at || new Date().toISOString(),
  updated_at: relatorio.updated_at,
});

export const transformAtualizacaoProgresso: DTOTransformer<AtualizacaoProgressoDTO, AtualizacaoProgressoTransformed> = (atualizacao) => ({
  id: atualizacao.id,
  descricao: atualizacao.descricao,
  marco: atualizacao.marco,
  data: atualizacao.data,
  relatorio_id: atualizacao.relatorio_id,
  created_at: atualizacao.created_at || new Date().toISOString(),
});

export const transformObra: DTOTransformer<ObraDTO, ObraTransformed> = (obra) => ({
  id: obra.id,
  nome: obra.nome,
  endereco: obra.endereco,
  status: obra.status,
  responsavel: obra.responsavel,
  data_inicio: obra.data_inicio,
  latitude: obra.latitude,
  longitude: obra.longitude,
  coords: [obra.longitude || 0, obra.latitude || 0] as [number, number],
  created_at: obra.created_at || new Date().toISOString(),
  updated_at: obra.updated_at,
});