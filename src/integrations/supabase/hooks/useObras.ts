import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export type Obra = Tables<"obras">;
export type ObraInsert = TablesInsert<"obras">;
export type ObraUpdate = TablesUpdate<"obras">;

// Query hooks
export function useObras() {
  return useQuery({
    queryKey: ["obras"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("obras")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });
}

export function useObra(id: string) {
  return useQuery({
    queryKey: ["obras", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("obras")
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
export function useCreateObra() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (obra: ObraInsert) => {
      const { data, error } = await supabase
        .from("obras")
        .insert(obra)
        .select()
        .single();
      
      if (error) throw error;

      // Criar auditoria
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from("auditoria").insert({
          usuario: user.email || 'Sistema',
          acao: 'Criação de Obra',
          detalhes: `Obra "${data.nome}" criada`
        });

        // Criar notificação
        await supabase.from("notificacoes").insert({
          titulo: 'Nova Obra Criada',
          descricao: `A obra "${data.nome}" foi criada com sucesso`,
          categoria: 'obra',
          prioridade: 'alta',
          obra_id: data.id,
          remetente: user.email || 'Sistema'
        });
      }
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["obras"] });
      queryClient.invalidateQueries({ queryKey: ["auditoria"] });
      queryClient.invalidateQueries({ queryKey: ["notificacoes"] });
    },
  });
}

export function useUpdateObra() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: ObraUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from("obras")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      
      if (error) throw error;

      // Criar auditoria
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const updateFields = Object.keys(updates).join(', ');
        await supabase.from("auditoria").insert({
          usuario: user.email || 'Sistema',
          acao: 'Atualização de Obra',
          detalhes: `Obra "${data.nome}" atualizada. Campos: ${updateFields}`
        });

        // Criar notificação se houve mudança de status
        if (updates.status) {
          await supabase.from("notificacoes").insert({
            titulo: 'Obra Atualizada',
            descricao: `A obra "${data.nome}" teve seu status alterado para: ${updates.status}`,
            categoria: 'obra',
            prioridade: 'media',
            obra_id: data.id,
            remetente: user.email || 'Sistema'
          });
        }
      }
      
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["obras"] });
      queryClient.invalidateQueries({ queryKey: ["obras", data.id] });
      queryClient.invalidateQueries({ queryKey: ["auditoria"] });
      queryClient.invalidateQueries({ queryKey: ["notificacoes"] });
    },
  });
}

export function useDeleteObra() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      // Buscar nome da obra antes de deletar
      const { data: obra } = await supabase
        .from("obras")
        .select("nome")
        .eq("id", id)
        .single();

      const { error } = await supabase
        .from("obras")
        .delete()
        .eq("id", id);
      
      if (error) throw error;

      // Criar auditoria
      const { data: { user } } = await supabase.auth.getUser();
      if (user && obra) {
        await supabase.from("auditoria").insert({
          usuario: user.email || 'Sistema',
          acao: 'Exclusão de Obra',
          detalhes: `Obra "${obra.nome}" foi excluída`
        });

        // Criar notificação
        await supabase.from("notificacoes").insert({
          titulo: 'Obra Excluída',
          descricao: `A obra "${obra.nome}" foi removida do sistema`,
          categoria: 'obra',
          prioridade: 'alta',
          remetente: user.email || 'Sistema'
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["obras"] });
      queryClient.invalidateQueries({ queryKey: ["auditoria"] });
      queryClient.invalidateQueries({ queryKey: ["notificacoes"] });
    },
  });
}