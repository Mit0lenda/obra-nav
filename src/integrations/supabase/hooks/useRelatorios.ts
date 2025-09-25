import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

export type Relatorio = Tables<"relatorios">;
export type RelatorioInsert = TablesInsert<"relatorios">;
export type RelatorioUpdate = TablesUpdate<"relatorios">;

// Query hooks
export function useRelatorios() {
  return useQuery({
    queryKey: ["relatorios"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("relatorios")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });
}

export function useRelatorio(id: string) {
  return useQuery({
    queryKey: ["relatorios", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("relatorios")
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
export function useCreateRelatorio() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (relatorio: RelatorioInsert) => {
      const { data, error } = await supabase
        .from("relatorios")
        .insert(relatorio)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["relatorios"] });
    },
  });
}

export function useUpdateRelatorio() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: RelatorioUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from("relatorios")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["relatorios"] });
      queryClient.invalidateQueries({ queryKey: ["relatorios", data.id] });
    },
  });
}

export function useDeleteRelatorio() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("relatorios")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["relatorios"] });
    },
  });
}