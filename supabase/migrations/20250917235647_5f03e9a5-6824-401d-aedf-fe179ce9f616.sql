-- Fix the status values and populate database with correct data

-- Insert initial obras with correct status values
INSERT INTO public.obras (nome, endereco, status, data_inicio, previsao_conclusao, latitude, longitude) VALUES
('Edifício Central', 'Rua das Flores, 123 - Centro', 'Em Andamento', '2025-01-15'::timestamptz, '2025-12-15'::timestamptz, -23.5505, -46.6333),
('Residencial Vista Verde', 'Av. Jardim Verde, 456 - Bairro Verde', 'Planejamento', '2025-03-01'::timestamptz, '2026-02-28'::timestamptz, -23.5489, -46.6388),
('Condomínio Parque', 'Rua do Parque, 789 - Vila Nova', 'Em Andamento', '2024-10-01'::timestamptz, '2025-09-30'::timestamptz, -23.5567, -46.6512),
('Residencial Sol Nascente', 'Av. Sol Nascente, 321 - Zona Norte', 'Concluída', '2024-01-01'::timestamptz, '2024-12-31'::timestamptz, -23.5234, -46.6123);

-- Insert tasks, materials, notifications, movements and reports with correct references
DO $$
DECLARE
    obra_central_id uuid;
    obra_vista_id uuid;
    obra_parque_id uuid;
    obra_sol_id uuid;
    material_cimento_id uuid;
    material_tubo_id uuid;
BEGIN
    -- Get obra IDs
    SELECT id INTO obra_central_id FROM public.obras WHERE nome = 'Edifício Central';
    SELECT id INTO obra_vista_id FROM public.obras WHERE nome = 'Residencial Vista Verde';
    SELECT id INTO obra_parque_id FROM public.obras WHERE nome = 'Condomínio Parque';
    SELECT id INTO obra_sol_id FROM public.obras WHERE nome = 'Residencial Sol Nascente';

    -- Insert tasks
    INSERT INTO public.tasks (titulo, descricao, tipo, status, prioridade, area, obra_id, prazo, quantidade) VALUES
    ('Vazamento na tubulação principal', 'Vazamento identificado na tubulação principal do 5º andar.', 'servico', 'A FAZER', 'crítico', 'Hidráulica', obra_central_id, '2025-08-28'::timestamptz, NULL),
    ('Reforço estrutural nas vigas', 'Reforço estrutural nas vigas do térreo após identificação de fissuras.', 'servico', 'EM ANDAMENTO', 'alta', 'Estrutural', obra_vista_id, '2025-08-29'::timestamptz, NULL),
    ('Tubo PVC 100mm Classe A', 'Requisição de 50 metros de tubo PVC 100mm Classe A para reparo hidráulico.', 'material', 'A FAZER', 'crítico', NULL, obra_central_id, '2025-08-27'::timestamptz, 50),
    ('Instalação elétrica do subsolo', 'Revisão e instalação de pontos elétricos no subsolo do edifício.', 'servico', 'EM ANÁLISE', 'média', 'Elétrica', obra_parque_id, '2025-09-15'::timestamptz, NULL),
    ('Pintura das áreas comuns', 'Pintura completa das áreas comuns incluindo hall de entrada e corredores.', 'servico', 'CONCLUÍDO', 'baixa', 'Acabamento', obra_sol_id, '2025-07-30'::timestamptz, NULL);

    -- Insert materials
    INSERT INTO public.materiais (nome, descricao, unidade, quantidade, obra_id) VALUES
    ('Cimento Portland CP-II', 'Cimento Portland composto com adições minerais, ideal para obras gerais', 'saco', 150, obra_central_id),
    ('Tubo PVC 100mm', 'Tubo PVC soldável 100mm para esgoto e drenagem', 'metro', 200, obra_central_id),
    ('Fio elétrico 2,5mm', 'Fio elétrico isolado 2,5mm² para instalações residenciais', 'metro', 500, obra_vista_id),
    ('Tinta acrílica branca', 'Tinta acrílica premium para paredes internas e externas', 'litro', 80, obra_parque_id),
    ('Areia fina', 'Areia fina lavada para argamassa e acabamentos', 'm³', 25, obra_sol_id);

    -- Get material IDs for movements
    SELECT id INTO material_cimento_id FROM public.materiais WHERE nome = 'Cimento Portland CP-II';
    SELECT id INTO material_tubo_id FROM public.materiais WHERE nome = 'Tubo PVC 100mm';

    -- Insert material movements
    INSERT INTO public.movimentacoes (material_id, tipo, quantidade, motivo, usuario) VALUES
    (material_cimento_id, 'Entrada', 100, 'Recebimento inicial de estoque', 'Sistema'),
    (material_cimento_id, 'Saída', -20, 'Uso na concretagem da laje', 'Mestre Carlos'),
    (material_tubo_id, 'Entrada', 250, 'Compra para projeto hidráulico', 'Ana Suprimentos'),
    (material_tubo_id, 'Saída', -50, 'Instalação do sistema de esgoto', 'Encanador João');

    -- Insert notifications
    INSERT INTO public.notificacoes (titulo, descricao, categoria, prioridade, status, obra_id, remetente) VALUES
    ('Solicitação urgente de materiais hidráulicos', 'Necessário tubo PVC 100mm e conexões para reparo emergencial no 5º andar.', 'Solicitação de materiais', 'alta', 'pendente', obra_central_id, 'Eng. João Silva'),
    ('Progresso da obra - Fundação concluída', 'Etapa de fundação foi finalizada conforme cronograma. Iniciando estrutura.', 'Informe de Progresso', 'media', 'aprovado', obra_vista_id, 'Mestre Carlos'),
    ('Problema na instalação elétrica', 'Identificado problema na rede elétrica do subsolo. Necessário revisão urgente.', 'Notificação de problemas/inconformidades', 'critica', 'pendente', obra_parque_id, 'Eletricista Pedro'),
    ('Solicitação de tinta para acabamento', 'Requisição de 50 litros de tinta acrílica branca para finalizar pintura.', 'Solicitação de materiais', 'media', 'aprovado', obra_sol_id, 'Pintor José');

    -- Insert reports
    INSERT INTO public.relatorios (titulo, resumo, obra_id, caracteristicas, status) VALUES
    ('Relatório de Progresso - Janeiro 2025', 'Resumo das atividades realizadas no mês de janeiro, incluindo avanço estrutural.', obra_central_id, ARRAY['Estrutural', 'Cronograma', 'Qualidade'], 'ativo'),
    ('Relatório de Materiais - Fevereiro 2025', 'Controle de entrada e saída de materiais durante o mês de fevereiro.', obra_vista_id, ARRAY['Materiais', 'Estoque', 'Custos'], 'ativo');
END $$;