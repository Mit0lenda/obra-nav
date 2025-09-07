// Import apenas o que é necessário

// Re-exportar todos os hooks do Supabase para substituir os mocks
export * from '@/hooks/useSupabase';

// Funções para migrar dados dos mocks para o Supabase (opcional)
export function migrateMockDataToSupabase() {
  console.log('Para migrar dados dos mocks para o Supabase, você pode usar as mutations disponíveis nos hooks.');
  console.log('Exemplo: useCreateObra(), useCreateTask(), useCreateMaterial(), etc.');
}

// Dados de exemplo para popular o banco se necessário
export const sampleObras = [
  {
    nome: 'Residencial Vista Verde',
    endereco: 'Rua das Flores, 123 - São Paulo',
    latitude: -23.5505,
    longitude: -46.6333,
    status: 'Em Andamento',
    responsavel: 'João Silva'
  },
  {
    nome: 'Edifício Central',
    endereco: 'Av. Paulista, 456 - São Paulo',
    latitude: -22.9083,
    longitude: -43.1964,
    status: 'Planejamento',
    responsavel: 'Maria Santos'
  },
  {
    nome: 'Condomínio Jardim do Sol',
    endereco: 'Rua do Sol, 789 - Florianópolis',
    latitude: -27.5954,
    longitude: -48.5480,
    status: 'Finalizada',
    responsavel: 'Pedro Costa'
  }
];

export const sampleTasks = [
  {
    titulo: 'Instalação Elétrica',
    descricao: 'Instalação completa do sistema elétrico',
    tipo: 'servico',
    status: 'A FAZER',
    prioridade: 'alta',
    area: 'Elétrica'
  },
  {
    titulo: 'Cimento Portland',
    descricao: 'Requisição de cimento para fundação',
    tipo: 'material',
    status: 'EM ANDAMENTO',
    prioridade: 'crítico',
    quantidade: 50
  }
];

export const sampleMateriais = [
  {
    nome: 'Cimento Portland CP II',
    unidade: 'sc',
    quantidade: 180,
    descricao: 'Cimento para uso geral'
  },
  {
    nome: 'Brita 1',
    unidade: 'm³',
    quantidade: 35,
    descricao: 'Agregado graúdo'
  },
  {
    nome: 'Areia Fina',
    unidade: 'm³',
    quantidade: 15,
    descricao: 'Agregado miúdo'
  }
];