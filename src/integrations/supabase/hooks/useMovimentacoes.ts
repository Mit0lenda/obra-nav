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

      // Buscar informações do material
      const { data: materialInfo, error: materialInfoError } = await supabase
        .from("materiais")
        .select("quantidade, nome")
        .eq("id", movimentacao.material_id)
        .single();

      if (materialInfoError) throw materialInfoError;

      const novaQuantidade = (materialInfo.quantidade || 0) + movimentacao.quantidade;
      
      const { error: updateError } = await supabase
        .from("materiais")
        .update({ quantidade: Math.max(0, novaQuantidade) })
        .eq("id", movimentacao.material_id);

      if (updateError) throw updateError;

      // Criar auditoria
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from("auditoria").insert({
          usuario: user.email || 'Sistema',
          acao: `Movimentação de Estoque - ${movimentacao.tipo}`,
          detalhes: `Material "${materialInfo.nome}" - Quantidade: ${movimentacao.quantidade} - Motivo: ${movimentacao.motivo || 'Não informado'}`
        });

        // Criar notificação se estoque baixo
        if (novaQuantidade < 10 && novaQuantidade > 0) {
          await supabase.from("notificacoes").insert({
            titulo: 'Estoque Baixo',
            descricao: `O material "${materialInfo.nome}" está com estoque baixo (${novaQuantidade} unidades)`,
            categoria: 'estoque',
            prioridade: 'alta',
            remetente: 'Sistema'
          });
        } else if (novaQuantidade === 0) {
          await supabase.from("notificacoes").insert({
            titulo: 'Estoque Zerado',
            descricao: `O material "${materialInfo.nome}" está sem estoque`,
            categoria: 'estoque',
            prioridade: 'critica',
            remetente: 'Sistema'
          });
        }
      }
      
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["movimentacoes"] });
      queryClient.invalidateQueries({ queryKey: ["materiais"] });
      queryClient.invalidateQueries({ queryKey: ["auditoria"] });
      queryClient.invalidateQueries({ queryKey: ["notificacoes"] });
    },
  });
}