export type MapWork = { id: string; nome: string; progresso: number; coords: [number, number] };

export const mockMapWorks: MapWork[] = [
  { id: "w1", nome: "Residencial Vista Verde", progresso: 62, coords: [-46.6333, -23.5505] }, // São Paulo
  { id: "w2", nome: "Edifício Central", progresso: 45, coords: [-43.1964, -22.9083] }, // Rio de Janeiro
  { id: "w3", nome: "Condomínio Jardim do Sol", progresso: 78, coords: [-48.5480, -27.5954] }, // Florianópolis
];
