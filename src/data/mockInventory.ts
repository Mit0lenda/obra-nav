interface InventoryItem {
  id: string;
  codigo: string;
  descricao: string;
  categoria: string;
  quantidade: number;
  unidade: string;
  valorUnit: number;
  estoqueMin: number;
  estoqueMax: number;
  fornecedor?: string;
  ultimaEntrada?: string;
  status: 'normal' | 'baixo' | 'critico' | 'excesso';
}

// Mock data para inventário
export const mockInventory: InventoryItem[] = [
  {
    id: "m1",
    codigo: "CIM001",
    descricao: "Cimento Portland CP II-E-32 50kg",
    categoria: "Cimento e Concreto",
    quantidade: 180,
    unidade: "sc",
    valorUnit: 32.50,
    estoqueMin: 50,
    estoqueMax: 300,
    fornecedor: "Votorantim Cimentos",
    ultimaEntrada: "2024-01-15T10:30:00Z",
    status: 'normal'
  },
  {
    id: "m2",
    codigo: "AGR001",
    descricao: "Brita 1 - Graduada",
    categoria: "Agregados",
    quantidade: 35,
    unidade: "m³",
    valorUnit: 110.00,
    estoqueMin: 40,
    estoqueMax: 100,
    fornecedor: "Pedreira São João",
    ultimaEntrada: "2024-01-14T14:20:00Z",
    status: 'baixo'
  },
  {
    id: "m3",
    codigo: "AGR002",
    descricao: "Areia Média Lavada",
    categoria: "Agregados",
    quantidade: 15,
    unidade: "m³",
    valorUnit: 95.00,
    estoqueMin: 30,
    estoqueMax: 80,
    fornecedor: "Pedreira São João",
    ultimaEntrada: "2024-01-12T09:45:00Z",
    status: 'critico'
  },
  {
    id: "m4",
    codigo: "EST001",
    descricao: "Vergalhão CA-50 12mm",
    categoria: "Estrutura Metálica",
    quantidade: 420,
    unidade: "un",
    valorUnit: 38.75,
    estoqueMin: 200,
    estoqueMax: 800,
    fornecedor: "Gerdau Açominas",
    ultimaEntrada: "2024-01-10T16:00:00Z",
    status: 'normal'
  },
  {
    id: "m5",
    codigo: "ALV001",
    descricao: "Bloco Cerâmico 9x19x39cm",
    categoria: "Alvenaria",
    quantidade: 1200,
    unidade: "un",
    valorUnit: 1.85,
    estoqueMin: 500,
    estoqueMax: 2000,
    fornecedor: "Cerâmica Moderna",
    ultimaEntrada: "2024-01-08T11:15:00Z",
    status: 'normal'
  },
  {
    id: "m6",
    codigo: "TIN001",
    descricao: "Tinta Acrílica Branca 18L",
    categoria: "Tintas e Vernizes",
    quantidade: 25,
    unidade: "gl",
    valorUnit: 185.00,
    estoqueMin: 20,
    estoqueMax: 60,
    fornecedor: "Sherwin-Williams",
    ultimaEntrada: "2024-01-05T13:30:00Z",
    status: 'normal'
  },
  {
    id: "m7",
    codigo: "HID001",
    descricao: "Tubo PVC 100mm 6m",
    categoria: "Hidráulica",
    quantidade: 80,
    unidade: "un",
    valorUnit: 45.20,
    estoqueMin: 30,
    estoqueMax: 120,
    fornecedor: "Tigre S.A.",
    ultimaEntrada: "2024-01-03T08:45:00Z",
    status: 'normal'
  },
  {
    id: "m8",
    codigo: "ELE001",
    descricao: "Cabo Flexível 2,5mm² 100m",
    categoria: "Elétrica",
    quantidade: 12,
    unidade: "rl",
    valorUnit: 320.00,
    estoqueMin: 15,
    estoqueMax: 40,
    fornecedor: "Prysmian Group",
    ultimaEntrada: "2024-01-02T15:20:00Z",
    status: 'baixo'
  }
];

export type { InventoryItem };