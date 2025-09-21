import { WorkItem, WorkStatus } from '@/types/map';

const statuses: WorkStatus[] = ['Initial', 'InProgress', 'Advanced'];

// Coordenadas de várias cidades brasileiras
const brazilianCities = [
  [-46.6333, -23.5505], // São Paulo
  [-43.1964, -22.9083], // Rio de Janeiro
  [-47.8825, -15.7942], // Brasília
  [-49.2780, -25.4284], // Curitiba
  [-51.2177, -30.0346], // Porto Alegre
  [-48.5480, -27.5954], // Florianópolis
  [-34.8771, -8.0539], // Recife
  [-38.5014, -3.7319], // Fortaleza
  [-43.9378, -19.9208], // Belo Horizonte
  [-60.0261, -3.1190], // Manaus
  [-35.2094, -5.7945], // Natal
  [-40.5134, -20.3155], // Vitória
  [-54.5854, -25.5163], // Foz do Iguaçu
  [-67.8094, -9.9658], // Rio Branco
  [-56.0906, -15.5989], // Cuiabá
];

export const mockWorkItems: WorkItem[] = Array.from({ length: 30 }, (_, i) => {
  const cityCoords = brazilianCities[i % brazilianCities.length];
  const status = statuses[i % statuses.length];
  const progress = Math.floor(Math.random() * 101);
  
  const workTypes = ['Residencial', 'Comercial', 'Industrial', 'Infraestrutura', 'Educacional'];
  const workType = workTypes[i % workTypes.length];
  
  const neighborhoods = ['Centro', 'Vila Nova', 'Jardim das Flores', 'Alto da Serra', 'Bela Vista'];
  const neighborhood = neighborhoods[i % neighborhoods.length];
  
  return {
    id: `work-${i + 1}`,
    name: `${workType} ${neighborhood} ${i + 1}`,
    description: `Obra de construção ${workType.toLowerCase()} com tecnologia moderna e sustentabilidade.`,
    status,
    progress,
    coordinates: [
      cityCoords[0] + (Math.random() - 0.5) * 0.1, // Pequena variação nas coordenadas
      cityCoords[1] + (Math.random() - 0.5) * 0.1
    ] as [number, number],
    address: `Rua ${workType}, ${Math.floor(Math.random() * 1000) + 1}, ${neighborhood}`,
    startedAt: new Date(2024, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1).toISOString(),
    updatedAt: new Date().toISOString(),
    images: [
      `https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=400&h=300&fit=crop`,
      `https://images.unsplash.com/photo-1590725175722-33b4d1000ccc?w=400&h=300&fit=crop`
    ],
    meta: {
      contractor: `Construtora ${String.fromCharCode(65 + (i % 26))}`,
      budget: Math.floor(Math.random() * 5000000) + 500000,
      area: Math.floor(Math.random() * 10000) + 500
    }
  };
});