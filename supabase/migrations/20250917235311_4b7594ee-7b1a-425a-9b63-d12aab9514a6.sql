-- Populate database with initial data for MVP testing (with correct status values)

-- Insert initial obras
INSERT INTO public.obras (nome, endereco, status, data_inicio, previsao_conclusao, latitude, longitude) VALUES
('Edifício Central', 'Rua das Flores, 123 - Centro', 'Em Andamento', '2025-01-15'::timestamptz, '2025-12-15'::timestamptz, -23.5505, -46.6333),
('Residencial Vista Verde', 'Av. Jardim Verde, 456 - Bairro Verde', 'Planejamento', '2025-03-01'::timestamptz, '2026-02-28'::timestamptz, -23.5489, -46.6388),
('Condomínio Parque', 'Rua do Parque, 789 - Vila Nova', 'Em Andamento', '2024-10-01'::timestamptz, '2025-09-30'::timestamptz, -23.5567, -46.6512),
('Residencial Sol Nascente', 'Av. Sol Nascente, 321 - Zona Norte', 'Concluída', '2024-01-01'::timestamptz, '2024-12-31'::timestamptz, -23.5234, -46.6123);

-- Insert initial tasks
INSERT INTO public.tasks (titulo, descricao, tipo, status, prioridade, area, obra_id, prazo, quantidade) 
SELECT 
    'Vazamento na tubulação principal',
    'Vazamento identificado na tubulação principal do 5º andar. Necessário reparo urgente.',
    'servico',
    'A FAZER',
    'crítico',
    'Hidráulica',
    o.id,
    '2025-08-28'::timestamptz,
    NULL
FROM public.obras o WHERE o.nome = 'Edifício Central'
UNION ALL
SELECT 
    'Reforço estrutural nas vigas',
    'Reforço estrutural nas vigas do térreo após identificação de fissuras.',
    'servico',
    'EM ANDAMENTO',
    'alta',
    'Estrutural',
    o.id,
    '2025-08-29'::timestamptz,
    NULL
FROM public.obras o WHERE o.nome = 'Residencial Vista Verde'
UNION ALL
SELECT 
    'Tubo PVC 100mm Classe A',
    'Requisição de 50 metros de tubo PVC 100mm Classe A para reparo hidráulico.',
    'material',
    'A FAZER',
    'crítico',
    NULL,
    o.id,
    '2025-08-27'::timestamptz,
    50
FROM public.obras o WHERE o.nome = 'Edifício Central'
UNION ALL
SELECT 
    'Instalação elétrica do subsolo',
    'Revisão e instalação de pontos elétricos no subsolo do edifício.',
    'servico',
    'EM ANÁLISE',
    'média',
    'Elétrica',
    o.id,
    '2025-09-15'::timestamptz,
    NULL
FROM public.obras o WHERE o.nome = 'Condomínio Parque'
UNION ALL
SELECT 
    'Pintura das áreas comuns',
    'Pintura completa das áreas comuns incluindo hall de entrada e corredores.',
    'servico',
    'CONCLUÍDO',
    'baixa',
    'Acabamento',
    o.id,
    '2025-07-30'::timestamptz,
    NULL
FROM public.obras o WHERE o.nome = 'Residencial Sol Nascente';

-- Insert initial materials
INSERT INTO public.materiais (nome, descricao, unidade, quantidade, obra_id)
SELECT 
    'Cimento Portland CP-II',
    'Cimento Portland composto com adições minerais, ideal para obras gerais',
    'saco',
    150,
    o.id
FROM public.obras o WHERE o.nome = 'Edifício Central'
UNION ALL
SELECT 
    'Tubo PVC 100mm',
    'Tubo PVC soldável 100mm para esgoto e drenagem',
    'metro',
    200,
    o.id
FROM public.obras o WHERE o.nome = 'Edifício Central'
UNION ALL
SELECT 
    'Fio elétrico 2,5mm',
    'Fio elétrico isolado 2,5mm² para instalações residenciais',
    'metro',
    500,
    o.id
FROM public.obras o WHERE o.nome = 'Residencial Vista Verde'
UNION ALL
SELECT 
    'Tinta acrílica branca',
    'Tinta acrílica premium para paredes internas e externas',
    'litro',
    80,
    o.id
FROM public.obras o WHERE o.nome = 'Condomínio Parque'
UNION ALL
SELECT 
    'Areia fina',
    'Areia fina lavada para argamassa e acabamentos',
    'm³',
    25,
    o.id
FROM public.obras o WHERE o.nome = 'Residencial Sol Nascente';

-- Insert initial notifications
INSERT INTO public.notificacoes (titulo, descricao, categoria, prioridade, status, obra_id, remetente)
SELECT 
    'Solicitação urgente de materiais hidráulicos',
    'Necessário tubo PVC 100mm e conexões para reparo emergencial no 5º andar.',
    'Solicitação de materiais',
    'alta',
    'pendente',
    o.id,
    'Eng. João Silva'
FROM public.obras o WHERE o.nome = 'Edifício Central'
UNION ALL
SELECT 
    'Progresso da obra - Fundação concluída',
    'Etapa de fundação foi finalizada conforme cronograma. Iniciando estrutura.',
    'Informe de Progresso',
    'media',
    'aprovado',
    o.id,
    'Mestre Carlos'
FROM public.obras o WHERE o.nome = 'Residencial Vista Verde'
UNION ALL
SELECT 
    'Problema na instalação elétrica',
    'Identificado problema na rede elétrica do subsolo. Necessário revisão urgente.',
    'Notificação de problemas/inconformidades',
    'critica',
    'pendente',
    o.id,
    'Eletricista Pedro'
FROM public.obras o WHERE o.nome = 'Condomínio Parque'
UNION ALL
SELECT 
    'Solicitação de tinta para acabamento',
    'Requisição de 50 litros de tinta acrílica branca para finalizar pintura.',
    'Solicitação de materiais',
    'media',
    'aprovado',
    o.id,
    'Pintor José'
FROM public.obras o WHERE o.nome = 'Residencial Sol Nascente';

-- Insert initial material movements
INSERT INTO public.movimentacoes (material_id, tipo, quantidade, motivo, usuario)
SELECT 
    m.id,
    'Entrada',
    100,
    'Recebimento inicial de estoque',
    'Sistema'
FROM public.materiais m WHERE m.nome = 'Cimento Portland CP-II'
UNION ALL
SELECT 
    m.id,
    'Saída',
    -20,
    'Uso na concretagem da laje',
    'Mestre Carlos'
FROM public.materiais m WHERE m.nome = 'Cimento Portland CP-II'
UNION ALL
SELECT 
    m.id,
    'Entrada',
    250,
    'Compra para projeto hidráulico',
    'Ana Suprimentos'
FROM public.materiais m WHERE m.nome = 'Tubo PVC 100mm'
UNION ALL
SELECT 
    m.id,
    'Saída',
    -50,
    'Instalação do sistema de esgoto',
    'Encanador João'
FROM public.materiais m WHERE m.nome = 'Tubo PVC 100mm';

-- Insert initial reports
INSERT INTO public.relatorios (titulo, resumo, obra_id, caracteristicas, status)
SELECT 
    'Relatório de Progresso - Janeiro 2025',
    'Resumo das atividades realizadas no mês de janeiro, incluindo avanço estrutural.',
    o.id,
    ARRAY['Estrutural', 'Cronograma', 'Qualidade'],
    'ativo'
FROM public.obras o WHERE o.nome = 'Edifício Central'
UNION ALL
SELECT 
    'Relatório de Materiais - Fevereiro 2025',
    'Controle de entrada e saída de materiais durante o mês de fevereiro.',
    o.id,
    ARRAY['Materiais', 'Estoque', 'Custos'],
    'ativo'
FROM public.obras o WHERE o.nome = 'Residencial Vista Verde';