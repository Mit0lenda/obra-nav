import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";
import { useEffect } from "react";

export type Material = Tables<"materiais">;
export type MaterialInsert = TablesInsert<"materiais">;
export type MaterialUpdate = TablesUpdate<"materiais">;

// Query hooks
export function useMateriais() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["materiais"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("materiais")
        .select(`
          *,
          obra:obras(nome)
        `)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel('materiais-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'materiais'
        },
        () => {
          console.log('Materiais table changed, invalidating cache');
          queryClient.invalidateQueries({ queryKey: ['materiais'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return query;
}

export function useMaterial(id: string) {
  return useQuery({
    queryKey: ["materiais", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("materiais")
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

export function useMateriaisByObra(obraId: string) {
  return useQuery({
    queryKey: ["materiais", "obra", obraId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("materiais")
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
export function useCreateMaterial() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (material: MaterialInsert) => {
      const { data, error } = await supabase
        .from("materiais")
        .insert(material)
        .select()
        .single();
      
      if (error) throw error;

      // Criar auditoria
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from("auditoria").insert({
          usuario: user.email || 'Sistema',
          acao: 'Cadastro de Material',
          detalhes: `Material "${data.nome}" cadastrado no estoque`
        });
      }
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["materiais"] });
      queryClient.invalidateQueries({ queryKey: ["auditoria"] });
    },
  });
}

export function useUpdateMaterial() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: MaterialUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from("materiais")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["materiais"] });
      queryClient.invalidateQueries({ queryKey: ["materiais", data.id] });
    },
  });
}

export function useDeleteMaterial() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("materiais")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["materiais"] });
    },
  });
}