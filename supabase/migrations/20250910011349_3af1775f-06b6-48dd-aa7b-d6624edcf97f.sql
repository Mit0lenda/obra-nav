-- 1) Tipos e tabelas de suporte a usuários (arquitetura)
-- Enum de papéis
DO $$
BEGIN
  CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');
EXCEPTION WHEN duplicate_object THEN NULL;
END
$$;

-- Tabela de perfis
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text,
  avatar_url text,
  bio text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Habilitar RLS e políticas básicas
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'profiles' AND policyname = 'Profiles are viewable by everyone'
  ) THEN
    CREATE POLICY "Profiles are viewable by everyone"
      ON public.profiles FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'profiles' AND policyname = 'Users can insert their own profile'
  ) THEN
    CREATE POLICY "Users can insert their own profile"
      ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'profiles' AND policyname = 'Users can update their own profile'
  ) THEN
    CREATE POLICY "Users can update their own profile"
      ON public.profiles FOR UPDATE USING (auth.uid() = id);
  END IF;
END $$;

-- Tabela de papéis de usuário
CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Função para verificar papel
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  );
$$;

-- Políticas para user_roles
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'user_roles' AND policyname = 'Users can view their own roles'
  ) THEN
    CREATE POLICY "Users can view their own roles"
      ON public.user_roles
      FOR SELECT
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'user_roles' AND policyname = 'Admins can manage roles'
  ) THEN
    CREATE POLICY "Admins can manage roles"
      ON public.user_roles
      FOR ALL
      TO authenticated
      USING (public.has_role(auth.uid(), 'admin'))
      WITH CHECK (public.has_role(auth.uid(), 'admin'));
  END IF;
END $$;

-- 2) Relacionamentos (FKs) entre tabelas existentes
DO $$ BEGIN
  -- materiais -> obras
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'materiais_obra_id_fkey'
  ) THEN
    ALTER TABLE public.materiais
      ADD CONSTRAINT materiais_obra_id_fkey
      FOREIGN KEY (obra_id) REFERENCES public.obras(id) ON DELETE SET NULL;
  END IF;
  -- tasks -> obras
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'tasks_obra_id_fkey'
  ) THEN
    ALTER TABLE public.tasks
      ADD CONSTRAINT tasks_obra_id_fkey
      FOREIGN KEY (obra_id) REFERENCES public.obras(id) ON DELETE SET NULL;
  END IF;
  -- notificacoes -> obras
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'notificacoes_obra_id_fkey'
  ) THEN
    ALTER TABLE public.notificacoes
      ADD CONSTRAINT notificacoes_obra_id_fkey
      FOREIGN KEY (obra_id) REFERENCES public.obras(id) ON DELETE SET NULL;
  END IF;
  -- relatorios -> obras
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'relatorios_obra_id_fkey'
  ) THEN
    ALTER TABLE public.relatorios
      ADD CONSTRAINT relatorios_obra_id_fkey
      FOREIGN KEY (obra_id) REFERENCES public.obras(id) ON DELETE SET NULL;
  END IF;
  -- movimentacoes -> materiais
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'movimentacoes_material_id_fkey'
  ) THEN
    ALTER TABLE public.movimentacoes
      ADD CONSTRAINT movimentacoes_material_id_fkey
      FOREIGN KEY (material_id) REFERENCES public.materiais(id) ON DELETE SET NULL;
  END IF;
  -- atualizacoes_progresso -> relatorios
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'atualizacoes_progresso_relatorio_id_fkey'
  ) THEN
    ALTER TABLE public.atualizacoes_progresso
      ADD CONSTRAINT atualizacoes_progresso_relatorio_id_fkey
      FOREIGN KEY (relatorio_id) REFERENCES public.relatorios(id) ON DELETE SET NULL;
  END IF;
END $$;

-- 3) Índices para performance
CREATE INDEX IF NOT EXISTS idx_obras_created_at ON public.obras(created_at);
CREATE INDEX IF NOT EXISTS idx_materiais_created_at ON public.materiais(created_at);
CREATE INDEX IF NOT EXISTS idx_notificacoes_created_at ON public.notificacoes(created_at);
CREATE INDEX IF NOT EXISTS idx_tasks_created_at ON public.tasks(created_at);
CREATE INDEX IF NOT EXISTS idx_relatorios_created_at ON public.relatorios(created_at);
CREATE INDEX IF NOT EXISTS idx_movimentacoes_created_at ON public.movimentacoes(created_at);

CREATE INDEX IF NOT EXISTS idx_materiais_obra_id ON public.materiais(obra_id);
CREATE INDEX IF NOT EXISTS idx_notificacoes_obra_id ON public.notificacoes(obra_id);
CREATE INDEX IF NOT EXISTS idx_tasks_obra_id ON public.tasks(obra_id);
CREATE INDEX IF NOT EXISTS idx_relatorios_obra_id ON public.relatorios(obra_id);
CREATE INDEX IF NOT EXISTS idx_movimentacoes_material_id ON public.movimentacoes(material_id);

-- Filtros comuns
CREATE INDEX IF NOT EXISTS idx_tasks_status ON public.tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_prioridade ON public.tasks(prioridade);
CREATE INDEX IF NOT EXISTS idx_notificacoes_status ON public.notificacoes(status);
CREATE INDEX IF NOT EXISTS idx_notificacoes_prioridade ON public.notificacoes(prioridade);

-- 4) Triggers de updated_at automáticas
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_obras_updated_at') THEN
    CREATE TRIGGER trg_obras_updated_at
    BEFORE UPDATE ON public.obras
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_materiais_updated_at') THEN
    CREATE TRIGGER trg_materiais_updated_at
    BEFORE UPDATE ON public.materiais
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_notificacoes_updated_at') THEN
    CREATE TRIGGER trg_notificacoes_updated_at
    BEFORE UPDATE ON public.notificacoes
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_relatorios_updated_at') THEN
    CREATE TRIGGER trg_relatorios_updated_at
    BEFORE UPDATE ON public.relatorios
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_tasks_updated_at') THEN
    CREATE TRIGGER trg_tasks_updated_at
    BEFORE UPDATE ON public.tasks
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

-- 5) Regra de negócio: quantidade de materiais não pode ser negativa
CREATE OR REPLACE FUNCTION public.enforce_non_negative_quantidade()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.quantidade IS NOT NULL AND NEW.quantidade < 0 THEN
    RAISE EXCEPTION 'Quantidade não pode ser negativa';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_materiais_non_negative') THEN
    CREATE TRIGGER trg_materiais_non_negative
    BEFORE INSERT OR UPDATE ON public.materiais
    FOR EACH ROW EXECUTE FUNCTION public.enforce_non_negative_quantidade();
  END IF;
END $$;