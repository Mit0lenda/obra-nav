import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

// Types baseados no schema do Supabase
export type Obra = {
  id: string;
  nome: string;
  endereco?: string;
  latitude?: number;
  longitude?: number;
  status?: string;
  responsavel?: string;
  data_inicio?: string;
  previsao_conclusao?: string;
  created_at?: string;
  updated_at?: string;
};

export type Task = {
  id: string;
  titulo: string;
  descricao?: string;
  tipo?: string;
  status?: string;
  prioridade?: string;
  prazo?: string;
  obra_id?: string;
  responsavel?: string;
  solicitante?: string;
  area?: string;
  quantidade?: number;
  data_criacao?: string;
  created_at?: string;
  updated_at?: string;
};

export type Material = {
  id: string;
  nome: string;
  unidade?: string;
  descricao?: string;
  quantidade?: number;
  obra_id?: string;
  created_at?: string;
  updated_at?: string;
};

export type Notificacao = {
  id: string;
  titulo: string;
  descricao?: string;
  categoria?: string;
  prioridade?: string;
  obra_id?: string;
  remetente?: string;
  status?: string;
  lida?: boolean;
  created_at?: string;
  updated_at?: string;
};

export type Movimentacao = {
  id: string;
  material_id: string;
  tipo: string;
  quantidade: number;
  motivo?: string;
  usuario?: string;
  created_at?: string;
};

// Query keys
export const queryKeys = {
  obras: ['obras'] as const,
  tasks: ['tasks'] as const,
  materiais: ['materiais'] as const,
  notificacoes: ['notificacoes'] as const,
  movimentacoes: (materialId?: string) => ['movimentacoes', materialId] as const,
};

// Hooks para Obras
export function useObras() {
  return useQuery({
    queryKey: queryKeys.obras,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('obras')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Obra[];
    },
  });
}

export function useCreateObra() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (obra: Omit<Obra, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('obras')
        .insert([obra])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.obras });
      toast({ title: 'Obra criada com sucesso!' });
    },
    onError: (error) => {
      toast({ 
        title: 'Erro ao criar obra',
        description: error.message,
        variant: 'destructive'
      });
    },
  });
}

// Hooks para Tasks
export function useTasks() {
  return useQuery({
    queryKey: queryKeys.tasks,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Task[];
    },
  });
}

export function useCreateTask() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (task: Omit<Task, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('tasks')
        .insert([task])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks });
      toast({ title: 'Task criada com sucesso!' });
    },
    onError: (error) => {
      toast({ 
        title: 'Erro ao criar task',
        description: error.message,
        variant: 'destructive'
      });
    },
  });
}

export function useUpdateTask() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Task> & { id: string }) => {
      const { data, error } = await supabase
        .from('tasks')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks });
      toast({ title: 'Task atualizada com sucesso!' });
    },
    onError: (error) => {
      toast({ 
        title: 'Erro ao atualizar task',
        description: error.message,
        variant: 'destructive'
      });
    },
  });
}

// Hooks para Materiais
export function useMateriais() {
  return useQuery({
    queryKey: queryKeys.materiais,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('materiais')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Material[];
    },
  });
}

export function useCreateMaterial() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (material: Omit<Material, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('materiais')
        .insert([material])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.materiais });
      toast({ title: 'Material criado com sucesso!' });
    },
    onError: (error) => {
      toast({ 
        title: 'Erro ao criar material',
        description: error.message,
        variant: 'destructive'
      });
    },
  });
}

// Hooks para Notificações
export function useNotificacoes() {
  return useQuery({
    queryKey: queryKeys.notificacoes,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notificacoes')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Notificacao[];
    },
  });
}

export function useCreateNotificacao() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (notificacao: Omit<Notificacao, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('notificacoes')
        .insert([notificacao])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notificacoes });
      toast({ title: 'Notificação criada com sucesso!' });
    },
    onError: (error) => {
      toast({ 
        title: 'Erro ao criar notificação',
        description: error.message,
        variant: 'destructive'
      });
    },
  });
}

// Hooks para Movimentações
export function useMovimentacoes(materialId?: string) {
  return useQuery({
    queryKey: queryKeys.movimentacoes(materialId),
    queryFn: async () => {
      let query = supabase
        .from('movimentacoes')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (materialId) {
        query = query.eq('material_id', materialId);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data as Movimentacao[];
    },
    enabled: !!materialId || materialId === undefined,
  });
}

export function useCreateMovimentacao() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (movimentacao: Omit<Movimentacao, 'id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('movimentacoes')
        .insert([movimentacao])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.movimentacoes() });
      queryClient.invalidateQueries({ queryKey: queryKeys.movimentacoes(data.material_id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.materiais });
      toast({ title: 'Movimentação registrada com sucesso!' });
    },
    onError: (error) => {
      toast({ 
        title: 'Erro ao registrar movimentação',
        description: error.message,
        variant: 'destructive'
      });
    },
  });
}