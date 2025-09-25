import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tables, TablesInsert } from "@/integrations/supabase/types";

export type Auditoria = Tables<"auditoria">;
export type AuditoriaInsert = TablesInsert<"auditoria">;

// Query hooks
export function useAuditoria() {
  return useQuery({
    queryKey: ["auditoria"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("auditoria")
        .select("*")
        .order("timestamp", { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });
}

// Mutation hooks
export function useCreateAuditEntry() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (entry: AuditoriaInsert) => {
      const { data, error } = await supabase
        .from("auditoria")
        .insert(entry)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["auditoria"] });
    },
  });
}

// Helper function to add audit entries
export function useAddAuditEntry() {
  const createEntry = useCreateAuditEntry();
  
  return (params: {
    user: string;
    action: string;
    details?: string;
  }) => {
    return createEntry.mutateAsync({
      usuario: params.user,
      acao: params.action,
      detalhes: params.details || null,
    });
  };
}