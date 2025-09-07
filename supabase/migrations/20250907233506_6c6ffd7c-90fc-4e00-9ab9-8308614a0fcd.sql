-- Adicionar políticas RLS para permitir operações CRUD nas tabelas existentes

-- Políticas para tabela 'obras'
CREATE POLICY "Usuários podem inserir obras" 
ON public.obras 
FOR INSERT 
TO authenticated 
WITH CHECK (true);

CREATE POLICY "Usuários podem atualizar obras" 
ON public.obras 
FOR UPDATE 
TO authenticated 
USING (true);

CREATE POLICY "Usuários podem deletar obras" 
ON public.obras 
FOR DELETE 
TO authenticated 
USING (true);

-- Políticas para tabela 'tasks'
CREATE POLICY "Usuários podem inserir tasks" 
ON public.tasks 
FOR INSERT 
TO authenticated 
WITH CHECK (true);

CREATE POLICY "Usuários podem atualizar tasks" 
ON public.tasks 
FOR UPDATE 
TO authenticated 
USING (true);

CREATE POLICY "Usuários podem deletar tasks" 
ON public.tasks 
FOR DELETE 
TO authenticated 
USING (true);

-- Políticas para tabela 'materiais'
CREATE POLICY "Usuários podem inserir materiais" 
ON public.materiais 
FOR INSERT 
TO authenticated 
WITH CHECK (true);

CREATE POLICY "Usuários podem atualizar materiais" 
ON public.materiais 
FOR UPDATE 
TO authenticated 
USING (true);

CREATE POLICY "Usuários podem deletar materiais" 
ON public.materiais 
FOR DELETE 
TO authenticated 
USING (true);

-- Criar tabelas adicionais necessárias para o sistema

-- Tabela para notificações
CREATE TABLE public.notificacoes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  titulo text NOT NULL,
  descricao text,
  categoria text DEFAULT 'geral',
  prioridade text DEFAULT 'media',
  obra_id uuid REFERENCES public.obras(id),
  remetente text,
  status text DEFAULT 'pendente',
  lida boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Tabela para movimentações de estoque
CREATE TABLE public.movimentacoes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  material_id uuid REFERENCES public.materiais(id) ON DELETE CASCADE,
  tipo text NOT NULL, -- 'entrada' ou 'baixa'
  quantidade numeric NOT NULL,
  motivo text,
  usuario text,
  created_at timestamp with time zone DEFAULT now()
);

-- Tabela para relatórios de trabalho
CREATE TABLE public.relatorios (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  obra_id uuid REFERENCES public.obras(id),
  titulo text NOT NULL,
  resumo text,
  caracteristicas text[],
  status text DEFAULT 'ativo',
  data_publicacao timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Tabela para atualizações de progresso
CREATE TABLE public.atualizacoes_progresso (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  relatorio_id uuid REFERENCES public.relatorios(id) ON DELETE CASCADE,
  descricao text NOT NULL,
  marco text,
  data timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now()
);

-- Tabela para auditoria
CREATE TABLE public.auditoria (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  usuario text NOT NULL,
  acao text NOT NULL,
  detalhes text,
  timestamp timestamp with time zone DEFAULT now()
);

-- Habilitar RLS para todas as novas tabelas
ALTER TABLE public.notificacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.movimentacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.relatorios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.atualizacoes_progresso ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auditoria ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para as novas tabelas
CREATE POLICY "Usuários podem ver notificações" ON public.notificacoes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Usuários podem inserir notificações" ON public.notificacoes FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Usuários podem atualizar notificações" ON public.notificacoes FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Usuários podem deletar notificações" ON public.notificacoes FOR DELETE TO authenticated USING (true);

CREATE POLICY "Usuários podem ver movimentações" ON public.movimentacoes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Usuários podem inserir movimentações" ON public.movimentacoes FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Usuários podem atualizar movimentações" ON public.movimentacoes FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Usuários podem deletar movimentações" ON public.movimentacoes FOR DELETE TO authenticated USING (true);

CREATE POLICY "Usuários podem ver relatórios" ON public.relatorios FOR SELECT TO authenticated USING (true);
CREATE POLICY "Usuários podem inserir relatórios" ON public.relatorios FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Usuários podem atualizar relatórios" ON public.relatorios FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Usuários podem deletar relatórios" ON public.relatorios FOR DELETE TO authenticated USING (true);

CREATE POLICY "Usuários podem ver atualizações de progresso" ON public.atualizacoes_progresso FOR SELECT TO authenticated USING (true);
CREATE POLICY "Usuários podem inserir atualizações de progresso" ON public.atualizacoes_progresso FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Usuários podem atualizar atualizações de progresso" ON public.atualizacoes_progresso FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Usuários podem deletar atualizações de progresso" ON public.atualizacoes_progresso FOR DELETE TO authenticated USING (true);

CREATE POLICY "Usuários podem ver auditoria" ON public.auditoria FOR SELECT TO authenticated USING (true);
CREATE POLICY "Usuários podem inserir auditoria" ON public.auditoria FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Usuários podem atualizar auditoria" ON public.auditoria FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Usuários podem deletar auditoria" ON public.auditoria FOR DELETE TO authenticated USING (true);

-- Triggers para updated_at
CREATE TRIGGER update_obras_updated_at
  BEFORE UPDATE ON public.obras
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_materiais_updated_at
  BEFORE UPDATE ON public.materiais
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_notificacoes_updated_at
  BEFORE UPDATE ON public.notificacoes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_relatorios_updated_at
  BEFORE UPDATE ON public.relatorios
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();