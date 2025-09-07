-- Adicionar políticas RLS para as tabelas restantes

-- Políticas para relatórios
CREATE POLICY "Usuários podem ver relatórios" ON public.relatorios FOR SELECT TO authenticated USING (true);
CREATE POLICY "Usuários podem inserir relatórios" ON public.relatorios FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Usuários podem atualizar relatórios" ON public.relatorios FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Usuários podem deletar relatórios" ON public.relatorios FOR DELETE TO authenticated USING (true);

-- Políticas para atualizações de progresso
CREATE POLICY "Usuários podem ver atualizações de progresso" ON public.atualizacoes_progresso FOR SELECT TO authenticated USING (true);
CREATE POLICY "Usuários podem inserir atualizações de progresso" ON public.atualizacoes_progresso FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Usuários podem atualizar atualizações de progresso" ON public.atualizacoes_progresso FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Usuários podem deletar atualizações de progresso" ON public.atualizacoes_progresso FOR DELETE TO authenticated USING (true);

-- Políticas para auditoria
CREATE POLICY "Usuários podem ver auditoria" ON public.auditoria FOR SELECT TO authenticated USING (true);
CREATE POLICY "Usuários podem inserir auditoria" ON public.auditoria FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Usuários podem atualizar auditoria" ON public.auditoria FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Usuários podem deletar auditoria" ON public.auditoria FOR DELETE TO authenticated USING (true);