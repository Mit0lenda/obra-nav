import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type Movimentacao = {
  id: string;
  material_id: string;
  tipo: string;
  quantidade: number;
  motivo?: string;
  usuario?: string;
  created_at: string;
  material?: { nome: string; unidade: string };
};

// Query hooks
export function useMovimentacoes(materialId?: string) {
  return useQuery({
    queryKey: ["movimentacoes", materialId],
    queryFn: async () => {
      let query = supabase
        .from("movimentacoes")
        .select(`
          *,
          material:materiais(nome, unidade)
        `)
        .order("created_at", { ascending: false });

      if (materialId) {
        query = query.eq("material_id", materialId);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data as Movimentacao[];
    },
    enabled: !materialId || !!materialId,
  });
}

// Mutation hooks
export function useCreateMovimentacao() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (movimentacao: Omit<Movimentacao, "id" | "created_at">) => {
      const { data, error } = await supabase
        .from("movimentacoes")
        .insert(movimentacao)
        .select()
        .single();
      
      if (error) throw error;

      // Atualizar quantidade do material
      const { data: material, error: materialError } = await supabase
        .from("materiais")
        .select("quantidade")
        .eq("id", movimentacao.material_id)
        .single();

      if (materialError) throw materialError;

      const novaQuantidade = (material.quantidade || 0) + movimentacao.quantidade;
      
      const { error: updateError } = await supabase
        .from("materiais")
        .update({ quantidade: Math.max(0, novaQuantidade) })
        .eq("id", movimentacao.material_id);

      if (updateError) throw updateError;
      
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["movimentacoes"] });
      queryClient.invalidateQueries({ queryKey: ["materiais"] });
    },
  });
}