import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type Notificacao = {
  id: string;
  titulo: string;
  descricao?: string;
  categoria: string;
  prioridade: string;
  obra_id?: string;
  remetente?: string;
  status: string;
  lida: boolean;
  created_at: string;
  updated_at: string;
  obra?: { nome: string };
};

// Query hooks
export function useNotificacoes() {
  return useQuery({
    queryKey: ["notificacoes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notificacoes")
        .select(`
          *,
          obra:obras(nome)
        `)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data as Notificacao[];
    },
  });
}

export function useUnreadNotificacoes() {
  return useQuery({
    queryKey: ["notificacoes", "unread"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("notificacoes")
        .select("*", { count: "exact", head: true })
        .eq("lida", false);
      
      if (error) throw error;
      return count || 0;
    },
    refetchInterval: 30000, // Atualiza a cada 30 segundos
  });
}

// Mutation hooks
export function useCreateNotificacao() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (notificacao: Omit<Notificacao, "id" | "created_at" | "updated_at">) => {
      const { data, error } = await supabase
        .from("notificacoes")
        .insert(notificacao)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notificacoes"] });
    },
  });
}

export function useMarkNotificacaoAsRead() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from("notificacoes")
        .update({ lida: true })
        .eq("id", id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notificacoes"] });
    },
  });
}

export function useMarkAllNotificacoesAsRead() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("notificacoes")
        .update({ lida: true })
        .eq("lida", false);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notificacoes"] });
    },
  });
}

export function useDeleteNotificacao() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("notificacoes")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notificacoes"] });
    },
  });
}