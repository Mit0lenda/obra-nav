-- Fase 2: Segurança
-- 2.1: Adicionar Foreign Keys faltantes

-- Adicionar foreign key de obras.responsavel para profiles.id
ALTER TABLE public.obras 
  DROP CONSTRAINT IF EXISTS obras_responsavel_fkey;

ALTER TABLE public.obras
  ADD CONSTRAINT obras_responsavel_fkey 
  FOREIGN KEY (responsavel) 
  REFERENCES public.profiles(id) 
  ON DELETE SET NULL;

-- Adicionar foreign key de tasks.responsavel para profiles.id
ALTER TABLE public.tasks 
  DROP CONSTRAINT IF EXISTS tasks_responsavel_fkey;

ALTER TABLE public.tasks
  ADD CONSTRAINT tasks_responsavel_fkey 
  FOREIGN KEY (responsavel) 
  REFERENCES public.profiles(id) 
  ON DELETE SET NULL;

-- Adicionar foreign key de tasks.solicitante para profiles.id
ALTER TABLE public.tasks 
  DROP CONSTRAINT IF EXISTS tasks_solicitante_fkey;

ALTER TABLE public.tasks
  ADD CONSTRAINT tasks_solicitante_fkey 
  FOREIGN KEY (solicitante) 
  REFERENCES public.profiles(id) 
  ON DELETE SET NULL;

-- 2.2: Atualizar RLS Policies para serem baseadas em user/role

-- Obras: Apenas responsável, admin ou moderador podem editar
DROP POLICY IF EXISTS "Usuários podem atualizar obras" ON public.obras;
CREATE POLICY "Usuários autenticados podem atualizar suas obras ou admins podem atualizar todas"
  ON public.obras
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = responsavel 
    OR public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'moderator'::app_role)
  );

DROP POLICY IF EXISTS "Usuários podem deletar obras" ON public.obras;
CREATE POLICY "Apenas admins podem deletar obras"
  ON public.obras
  FOR DELETE
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin'::app_role)
  );

DROP POLICY IF EXISTS "Usuários podem inserir obras" ON public.obras;
CREATE POLICY "Usuários autenticados podem inserir obras"
  ON public.obras
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

-- Tasks: Apenas responsável/solicitante, admin ou moderador podem editar
DROP POLICY IF EXISTS "Usuários podem atualizar tasks" ON public.tasks;
CREATE POLICY "Usuários podem atualizar suas tasks ou admins podem atualizar todas"
  ON public.tasks
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = responsavel 
    OR auth.uid() = solicitante
    OR public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'moderator'::app_role)
  );

DROP POLICY IF EXISTS "Usuários podem deletar tasks" ON public.tasks;
CREATE POLICY "Usuários podem deletar suas tasks ou admins podem deletar todas"
  ON public.tasks
  FOR DELETE
  TO authenticated
  USING (
    auth.uid() = responsavel 
    OR auth.uid() = solicitante
    OR public.has_role(auth.uid(), 'admin'::app_role)
  );

DROP POLICY IF EXISTS "Usuários podem inserir tasks" ON public.tasks;
CREATE POLICY "Usuários autenticados podem inserir tasks"
  ON public.tasks
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

-- Materiais: Baseado em acesso à obra (se usuário tem acesso à obra, tem acesso aos materiais)
DROP POLICY IF EXISTS "Usuários podem atualizar materiais" ON public.materiais;
CREATE POLICY "Usuários podem atualizar materiais de suas obras ou admins"
  ON public.materiais
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.obras 
      WHERE obras.id = materiais.obra_id 
      AND (obras.responsavel = auth.uid() 
           OR public.has_role(auth.uid(), 'admin'::app_role)
           OR public.has_role(auth.uid(), 'moderator'::app_role))
    )
    OR materiais.obra_id IS NULL
  );

DROP POLICY IF EXISTS "Usuários podem deletar materiais" ON public.materiais;
CREATE POLICY "Usuários podem deletar materiais de suas obras ou admins"
  ON public.materiais
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.obras 
      WHERE obras.id = materiais.obra_id 
      AND (obras.responsavel = auth.uid() 
           OR public.has_role(auth.uid(), 'admin'::app_role))
    )
    OR materiais.obra_id IS NULL
  );

DROP POLICY IF EXISTS "Usuários podem inserir materiais" ON public.materiais;
CREATE POLICY "Usuários autenticados podem inserir materiais"
  ON public.materiais
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

-- Notificações: Usuários veem todas, mas apenas admins podem criar/editar/deletar
DROP POLICY IF EXISTS "Usuários podem atualizar notificações" ON public.notificacoes;
CREATE POLICY "Apenas admins e moderadores podem atualizar notificações"
  ON public.notificacoes
  FOR UPDATE
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'moderator'::app_role)
  );

DROP POLICY IF EXISTS "Usuários podem deletar notificações" ON public.notificacoes;
CREATE POLICY "Apenas admins podem deletar notificações"
  ON public.notificacoes
  FOR DELETE
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin'::app_role)
  );

DROP POLICY IF EXISTS "Usuários podem inserir notificações" ON public.notificacoes;
CREATE POLICY "Usuários autenticados podem inserir notificações"
  ON public.notificacoes
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

-- Movimentações: Apenas admins e moderadores podem gerenciar
DROP POLICY IF EXISTS "Usuários podem atualizar movimentações" ON public.movimentacoes;
CREATE POLICY "Apenas admins e moderadores podem atualizar movimentações"
  ON public.movimentacoes
  FOR UPDATE
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'moderator'::app_role)
  );

DROP POLICY IF EXISTS "Usuários podem deletar movimentações" ON public.movimentacoes;
CREATE POLICY "Apenas admins podem deletar movimentações"
  ON public.movimentacoes
  FOR DELETE
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin'::app_role)
  );

DROP POLICY IF EXISTS "Usuários podem inserir movimentações" ON public.movimentacoes;
CREATE POLICY "Usuários autenticados podem inserir movimentações"
  ON public.movimentacoes
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

-- Auditoria: Todos podem ver e inserir, apenas admins podem editar/deletar
DROP POLICY IF EXISTS "Usuários podem atualizar auditoria" ON public.auditoria;
CREATE POLICY "Apenas admins podem atualizar auditoria"
  ON public.auditoria
  FOR UPDATE
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin'::app_role)
  );

DROP POLICY IF EXISTS "Usuários podem deletar auditoria" ON public.auditoria;
CREATE POLICY "Apenas admins podem deletar auditoria"
  ON public.auditoria
  FOR DELETE
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin'::app_role)
  );

-- Relatórios e atualizações de progresso: todos podem ver e inserir, admins/moderadores podem editar/deletar
DROP POLICY IF EXISTS "Usuários podem atualizar relatórios" ON public.relatorios;
CREATE POLICY "Admins e moderadores podem atualizar relatórios"
  ON public.relatorios
  FOR UPDATE
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'moderator'::app_role)
  );

DROP POLICY IF EXISTS "Usuários podem deletar relatórios" ON public.relatorios;
CREATE POLICY "Apenas admins podem deletar relatórios"
  ON public.relatorios
  FOR DELETE
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin'::app_role)
  );

DROP POLICY IF EXISTS "Usuários podem atualizar atualizações de progresso" ON public.atualizacoes_progresso;
CREATE POLICY "Admins e moderadores podem atualizar atualizações de progresso"
  ON public.atualizacoes_progresso
  FOR UPDATE
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'moderator'::app_role)
  );

DROP POLICY IF EXISTS "Usuários podem deletar atualizações de progresso" ON public.atualizacoes_progresso;
CREATE POLICY "Apenas admins podem deletar atualizações de progresso"
  ON public.atualizacoes_progresso
  FOR DELETE
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin'::app_role)
  );