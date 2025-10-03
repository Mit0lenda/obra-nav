import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

export type Task = Tables<"tasks">;
export type TaskInsert = TablesInsert<"tasks">;
export type TaskUpdate = TablesUpdate<"tasks">;

// Query hooks
export function useTasks() {
  return useQuery({
    queryKey: ["tasks"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tasks")
        .select(`
          *,
          obra:obras(nome)
        `)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });
}

export function useTask(id: string) {
  return useQuery({
    queryKey: ["tasks", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tasks")
        .select(`
          *,
          obra:obras(*)
        `)
        .eq("id", id)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });
}

export function useTasksByObra(obraId: string) {
  return useQuery({
    queryKey: ["tasks", "obra", obraId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .eq("obra_id", obraId)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!obraId,
  });
}

// Mutation hooks
export function useCreateTask() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (task: TaskInsert) => {
      const { data, error } = await supabase
        .from("tasks")
        .insert(task)
        .select()
        .single();
      
      if (error) throw error;

      // Criar auditoria
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from("auditoria").insert({
          usuario: user.email || 'Sistema',
          acao: 'Criação de Tarefa',
          detalhes: `Tarefa "${data.titulo}" criada`
        });

        // Criar notificação
        await supabase.from("notificacoes").insert({
          titulo: 'Nova Tarefa Criada',
          descricao: `Tarefa "${data.titulo}" foi criada`,
          categoria: 'tarefa',
          prioridade: data.prioridade || 'media',
          obra_id: data.obra_id,
          remetente: user.email || 'Sistema'
        });
      }
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["auditoria"] });
      queryClient.invalidateQueries({ queryKey: ["notificacoes"] });
    },
  });
}

export function useUpdateTask() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: TaskUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from("tasks")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      
      if (error) throw error;

      // Criar auditoria
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from("auditoria").insert({
          usuario: user.email || 'Sistema',
          acao: 'Atualização de Tarefa',
          detalhes: `Tarefa "${data.titulo}" atualizada`
        });

        // Criar notificação se status mudou para concluída
        if (updates.status === 'CONCLUÍDO' || updates.status === 'concluida') {
          await supabase.from("notificacoes").insert({
            titulo: 'Tarefa Concluída',
            descricao: `Tarefa "${data.titulo}" foi concluída`,
            categoria: 'tarefa',
            prioridade: 'baixa',
            obra_id: data.obra_id,
            remetente: user.email || 'Sistema'
          });
        }
      }
      
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["tasks", data.id] });
      queryClient.invalidateQueries({ queryKey: ["auditoria"] });
      queryClient.invalidateQueries({ queryKey: ["notificacoes"] });
    },
  });
}

export function useDeleteTask() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("tasks")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
}

export function useMoveTask() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { data, error } = await supabase
        .from("tasks")
        .update({ status })
        .eq("id", id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
}