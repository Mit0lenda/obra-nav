-- Adicionar campos progresso e previsao_conclusao na tabela obras
ALTER TABLE public.obras 
ADD COLUMN IF NOT EXISTS progresso numeric DEFAULT 0 CHECK (progresso >= 0 AND progresso <= 100),
ADD COLUMN IF NOT EXISTS previsao_conclusao timestamp with time zone;

-- Comentários para documentação
COMMENT ON COLUMN public.obras.progresso IS 'Percentual de progresso da obra (0-100), calculado baseado nas tarefas concluídas';
COMMENT ON COLUMN public.obras.previsao_conclusao IS 'Data prevista para conclusão da obra';

-- Função para calcular progresso da obra automaticamente baseado nas tarefas
CREATE OR REPLACE FUNCTION public.calcular_progresso_obra(obra_uuid uuid)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  total_tarefas integer;
  tarefas_concluidas integer;
  progresso_calculado numeric;
BEGIN
  -- Contar total de tarefas da obra
  SELECT COUNT(*) INTO total_tarefas
  FROM public.tasks
  WHERE obra_id = obra_uuid;
  
  -- Se não há tarefas, retorna 0
  IF total_tarefas = 0 THEN
    RETURN 0;
  END IF;
  
  -- Contar tarefas concluídas
  SELECT COUNT(*) INTO tarefas_concluidas
  FROM public.tasks
  WHERE obra_id = obra_uuid 
    AND status = 'concluida';
  
  -- Calcular percentual
  progresso_calculado := (tarefas_concluidas::numeric / total_tarefas::numeric) * 100;
  
  RETURN ROUND(progresso_calculado, 2);
END;
$$;

-- Trigger para atualizar progresso automaticamente quando tarefas mudam
CREATE OR REPLACE FUNCTION public.atualizar_progresso_obra()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Atualizar progresso da obra quando uma tarefa é inserida, atualizada ou deletada
  IF TG_OP = 'DELETE' THEN
    UPDATE public.obras
    SET progresso = public.calcular_progresso_obra(OLD.obra_id)
    WHERE id = OLD.obra_id;
    RETURN OLD;
  ELSE
    UPDATE public.obras
    SET progresso = public.calcular_progresso_obra(NEW.obra_id)
    WHERE id = NEW.obra_id;
    RETURN NEW;
  END IF;
END;
$$;

-- Criar trigger para atualização automática do progresso
DROP TRIGGER IF EXISTS trigger_atualizar_progresso_obra ON public.tasks;
CREATE TRIGGER trigger_atualizar_progresso_obra
AFTER INSERT OR UPDATE OR DELETE ON public.tasks
FOR EACH ROW
EXECUTE FUNCTION public.atualizar_progresso_obra();

-- Atualizar progresso de todas as obras existentes
UPDATE public.obras
SET progresso = public.calcular_progresso_obra(id);
