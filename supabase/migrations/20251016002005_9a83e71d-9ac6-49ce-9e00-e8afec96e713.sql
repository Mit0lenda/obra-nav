-- Fase 1: Correções Críticas
-- 1.1: Adicionar search_path para segurança nas funções existentes

CREATE OR REPLACE FUNCTION public.enforce_non_negative_quantidade()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  IF NEW.quantidade IS NOT NULL AND NEW.quantidade < 0 THEN
    RAISE EXCEPTION 'Quantidade não pode ser negativa';
  END IF;
  RETURN NEW;
END;
$function$;

-- 1.2: Criar trigger para atualizar updated_at automaticamente em todas as tabelas relevantes

-- Trigger para obras
DROP TRIGGER IF EXISTS update_obras_updated_at ON public.obras;
CREATE TRIGGER update_obras_updated_at
  BEFORE UPDATE ON public.obras
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger para tasks
DROP TRIGGER IF EXISTS update_tasks_updated_at ON public.tasks;
CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger para materiais
DROP TRIGGER IF EXISTS update_materiais_updated_at ON public.materiais;
CREATE TRIGGER update_materiais_updated_at
  BEFORE UPDATE ON public.materiais
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger para notificacoes
DROP TRIGGER IF EXISTS update_notificacoes_updated_at ON public.notificacoes;
CREATE TRIGGER update_notificacoes_updated_at
  BEFORE UPDATE ON public.notificacoes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger para profiles
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 1.3: Criar trigger para atualizar progresso de obra quando tasks mudam

DROP TRIGGER IF EXISTS trigger_atualizar_progresso_obra ON public.tasks;
CREATE TRIGGER trigger_atualizar_progresso_obra
  AFTER INSERT OR UPDATE OR DELETE ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.atualizar_progresso_obra();

-- 1.4: Criar trigger para validação de quantidade em materiais

DROP TRIGGER IF EXISTS trigger_enforce_non_negative_quantidade ON public.materiais;
CREATE TRIGGER trigger_enforce_non_negative_quantidade
  BEFORE INSERT OR UPDATE ON public.materiais
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_non_negative_quantidade();