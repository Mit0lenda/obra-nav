import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

export type AtualizacaoProgresso = Tables<"atualizacoes_progresso">;
export type AtualizacaoProgressoInsert = TablesInsert<"atualizacoes_progresso">;
export type AtualizacaoProgressoUpdate = TablesUpdate<"atualizacoes_progresso">;

// Query hooks
export function useAtualizacoesProgresso() {
  return useQuery({
    queryKey: ["atualizacoes_progresso"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("atualizacoes_progresso")
        .select("*")
        .order("data", { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });
}

export function useAtualizacaoProgresso(id: string) {
  return useQuery({
    queryKey: ["atualizacoes_progresso", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("atualizacoes_progresso")
        .select("*")
        .eq("id", id)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });
}

// Mutation hooks
export function useCreateAtualizacaoProgresso() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (atualizacao: AtualizacaoProgressoInsert) => {
      const { data, error } = await supabase
        .from("atualizacoes_progresso")
        .insert(atualizacao)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["atualizacoes_progresso"] });
    },
  });
}

export function useUpdateAtualizacaoProgresso() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: AtualizacaoProgressoUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from("atualizacoes_progresso")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["atualizacoes_progresso"] });
      queryClient.invalidateQueries({ queryKey: ["atualizacoes_progresso", data.id] });
    },
  });
}

export function useDeleteAtualizacaoProgresso() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("atualizacoes_progresso")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["atualizacoes_progresso"] });
    },
  });
}