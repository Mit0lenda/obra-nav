-- Criar políticas RLS de forma condicional para operações CRUD
DO $$
BEGIN
  -- Políticas para tabela 'obras'
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'obras' AND policyname = 'Usuários podem inserir obras') THEN
    EXECUTE 'CREATE POLICY "Usuários podem inserir obras" ON public.obras FOR INSERT TO authenticated WITH CHECK (true)';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'obras' AND policyname = 'Usuários podem atualizar obras') THEN
    EXECUTE 'CREATE POLICY "Usuários podem atualizar obras" ON public.obras FOR UPDATE TO authenticated USING (true)';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'obras' AND policyname = 'Usuários podem deletar obras') THEN
    EXECUTE 'CREATE POLICY "Usuários podem deletar obras" ON public.obras FOR DELETE TO authenticated USING (true)';
  END IF;

  -- Políticas para tabela 'tasks'
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'tasks' AND policyname = 'Usuários podem inserir tasks') THEN
    EXECUTE 'CREATE POLICY "Usuários podem inserir tasks" ON public.tasks FOR INSERT TO authenticated WITH CHECK (true)';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'tasks' AND policyname = 'Usuários podem atualizar tasks') THEN
    EXECUTE 'CREATE POLICY "Usuários podem atualizar tasks" ON public.tasks FOR UPDATE TO authenticated USING (true)';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'tasks' AND policyname = 'Usuários podem deletar tasks') THEN
    EXECUTE 'CREATE POLICY "Usuários podem deletar tasks" ON public.tasks FOR DELETE TO authenticated USING (true)';
  END IF;

  -- Políticas para tabela 'materiais'
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'materiais' AND policyname = 'Usuários podem inserir materiais') THEN
    EXECUTE 'CREATE POLICY "Usuários podem inserir materiais" ON public.materiais FOR INSERT TO authenticated WITH CHECK (true)';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'materiais' AND policyname = 'Usuários podem atualizar materiais') THEN
    EXECUTE 'CREATE POLICY "Usuários podem atualizar materiais" ON public.materiais FOR UPDATE TO authenticated USING (true)';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'materiais' AND policyname = 'Usuários podem deletar materiais') THEN
    EXECUTE 'CREATE POLICY "Usuários podem deletar materiais" ON public.materiais FOR DELETE TO authenticated USING (true)';
  END IF;
END
$$;

-- Criar tabelas adicionais se não existirem
CREATE TABLE IF NOT EXISTS public.notificacoes (
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

CREATE TABLE IF NOT EXISTS public.movimentacoes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  material_id uuid REFERENCES public.materiais(id) ON DELETE CASCADE,
  tipo text NOT NULL,
  quantidade numeric NOT NULL,
  motivo text,
  usuario text,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.relatorios (
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

CREATE TABLE IF NOT EXISTS public.atualizacoes_progresso (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  relatorio_id uuid REFERENCES public.relatorios(id) ON DELETE CASCADE,
  descricao text NOT NULL,
  marco text,
  data timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.auditoria (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  usuario text NOT NULL,
  acao text NOT NULL,
  detalhes text,
  timestamp timestamp with time zone DEFAULT now()
);

-- Habilitar RLS para as novas tabelas
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'notificacoes' AND schemaname = 'public') THEN
    ALTER TABLE public.notificacoes ENABLE ROW LEVEL SECURITY;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'movimentacoes' AND schemaname = 'public') THEN
    ALTER TABLE public.movimentacoes ENABLE ROW LEVEL SECURITY;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'relatorios' AND schemaname = 'public') THEN
    ALTER TABLE public.relatorios ENABLE ROW LEVEL SECURITY;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'atualizacoes_progresso' AND schemaname = 'public') THEN
    ALTER TABLE public.atualizacoes_progresso ENABLE ROW LEVEL SECURITY;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'auditoria' AND schemaname = 'public') THEN
    ALTER TABLE public.auditoria ENABLE ROW LEVEL SECURITY;
  END IF;
END
$$;

-- Políticas RLS para as novas tabelas
DO $$
BEGIN
  -- Notificações
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'notificacoes' AND policyname = 'Usuários podem ver notificações') THEN
    EXECUTE 'CREATE POLICY "Usuários podem ver notificações" ON public.notificacoes FOR SELECT TO authenticated USING (true)';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'notificacoes' AND policyname = 'Usuários podem inserir notificações') THEN
    EXECUTE 'CREATE POLICY "Usuários podem inserir notificações" ON public.notificacoes FOR INSERT TO authenticated WITH CHECK (true)';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'notificacoes' AND policyname = 'Usuários podem atualizar notificações') THEN
    EXECUTE 'CREATE POLICY "Usuários podem atualizar notificações" ON public.notificacoes FOR UPDATE TO authenticated USING (true)';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'notificacoes' AND policyname = 'Usuários podem deletar notificações') THEN
    EXECUTE 'CREATE POLICY "Usuários podem deletar notificações" ON public.notificacoes FOR DELETE TO authenticated USING (true)';
  END IF;

  -- Movimentações
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'movimentacoes' AND policyname = 'Usuários podem ver movimentações') THEN
    EXECUTE 'CREATE POLICY "Usuários podem ver movimentações" ON public.movimentacoes FOR SELECT TO authenticated USING (true)';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'movimentacoes' AND policyname = 'Usuários podem inserir movimentações') THEN
    EXECUTE 'CREATE POLICY "Usuários podem inserir movimentações" ON public.movimentacoes FOR INSERT TO authenticated WITH CHECK (true)';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'movimentacoes' AND policyname = 'Usuários podem atualizar movimentações') THEN
    EXECUTE 'CREATE POLICY "Usuários podem atualizar movimentações" ON public.movimentacoes FOR UPDATE TO authenticated USING (true)';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'movimentacoes' AND policyname = 'Usuários podem deletar movimentações') THEN
    EXECUTE 'CREATE POLICY "Usuários podem deletar movimentações" ON public.movimentacoes FOR DELETE TO authenticated USING (true)';
  END IF;
END
$$;

-- Triggers para updated_at (só criar se não existir)
DO $$
BEGIN
  -- Verifica se o trigger não existe para materiais
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_materiais_updated_at') THEN
    EXECUTE 'CREATE TRIGGER update_materiais_updated_at BEFORE UPDATE ON public.materiais FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column()';
  END IF;
  
  -- Verifica se o trigger não existe para tasks
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_tasks_updated_at') THEN
    EXECUTE 'CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON public.tasks FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column()';
  END IF;
  
  -- Verifica se o trigger não existe para notificacoes
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_notificacoes_updated_at') THEN
    EXECUTE 'CREATE TRIGGER update_notificacoes_updated_at BEFORE UPDATE ON public.notificacoes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column()';
  END IF;
  
  -- Verifica se o trigger não existe para relatorios
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_relatorios_updated_at') THEN
    EXECUTE 'CREATE TRIGGER update_relatorios_updated_at BEFORE UPDATE ON public.relatorios FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column()';
  END IF;
END
$$;