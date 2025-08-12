import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export type InventoryStatus = "Normal" | "Baixo" | "Crítico";

export type InventoryItem = {
  id: string;
  material: string;
  unidade: string;
  quantidade: number;
  obra: string;
  categoria: "Cimento" | "Agregados" | "Ferro/Aço" | "Blocos" | "Outros";
  status: InventoryStatus;
  ultimaMov: string; // ISO
};

export type MovementType = "Entrada" | "Baixa";
export type Movement = {
  id: string;
  data: string; // ISO
  tipo: MovementType;
  quantidade: number; // positivo para entrada, negativo para baixa
  motivo: string;
  usuario: string;
};

const LS_INV = "nexium_inventory_v1";
const LS_MOV = "nexium_movements_v1"; // { [materialId]: Movement[] }

const seedItems: InventoryItem[] = [
  { id: "m1", material: "Cimento Portland CP II", unidade: "sc", quantidade: 180, obra: "Residencial Vista Verde", categoria: "Cimento", status: "Normal", ultimaMov: new Date(Date.now() - 86400000).toISOString() },
  { id: "m2", material: "Brita 1", unidade: "m³", quantidade: 35, obra: "Edifício Central", categoria: "Agregados", status: "Baixo", ultimaMov: new Date(Date.now() - 3600000).toISOString() },
  { id: "m3", material: "Areia Fina", unidade: "m³", quantidade: 15, obra: "Residencial Vista Verde", categoria: "Agregados", status: "Crítico", ultimaMov: new Date(Date.now() - 2 * 3600000).toISOString() },
  { id: "m4", material: "Vergalhão 10mm", unidade: "un", quantidade: 420, obra: "Edifício Central", categoria: "Ferro/Aço", status: "Normal", ultimaMov: new Date(Date.now() - 3 * 3600000).toISOString() },
  { id: "m5", material: "Bloco Cerâmico 9x19x39", unidade: "un", quantidade: 1200, obra: "Residencial Vista Verde", categoria: "Blocos", status: "Normal", ultimaMov: new Date(Date.now() - 6 * 3600000).toISOString() },
];

function load<T>(key: string, fallback: T): T {
  const raw = localStorage.getItem(key);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}
function save<T>(key: string, value: T) {
  localStorage.setItem(key, JSON.stringify(value));
}
function delay<T>(v: T, ms = 300) {
  return new Promise<T>((res) => setTimeout(() => res(v), ms));
}

function getInventory(): InventoryItem[] {
  return load(LS_INV, seedItems);
}
function setInventory(items: InventoryItem[]) {
  save(LS_INV, items);
}
function getMovementsMap(): Record<string, Movement[]> {
  return load<Record<string, Movement[]>>(LS_MOV, {});
}
function setMovementsMap(map: Record<string, Movement[]>) {
  save(LS_MOV, map);
}

function recalcStatus(qtd: number): InventoryStatus {
  if (qtd <= 20) return "Crítico";
  if (qtd <= 50) return "Baixo";
  return "Normal";
}

export async function apiListInventory() {
  return delay(getInventory());
}
export async function apiListMovements(materialId: string) {
  const map = getMovementsMap();
  return delay(map[materialId] ?? []);
}

export async function apiAddMovement(materialId: string, mov: Omit<Movement, "id" | "data"> & { quantidade: number }) {
  const map = getMovementsMap();
  const list = map[materialId] ?? [];
  const movement: Movement = {
    id: `${materialId}-${Date.now()}`,
    data: new Date().toISOString(),
    ...mov,
  };
  list.unshift(movement);
  map[materialId] = list;
  setMovementsMap(map);

  const inv = getInventory();
  const idx = inv.findIndex((i) => i.id === materialId);
  if (idx >= 0) {
    inv[idx].quantidade += mov.quantidade; // negativo para baixa
    if (inv[idx].quantidade < 0) inv[idx].quantidade = 0;
    inv[idx].status = recalcStatus(inv[idx].quantidade);
    inv[idx].ultimaMov = movement.data;
    setInventory(inv);
  }

  return delay(true);
}

export const inventoryKeys = {
  root: ["inventory-items"] as const,
  movements: (id: string) => ["inventory-movements", id] as const,
};

export function useInventory() {
  return useQuery({ queryKey: inventoryKeys.root, queryFn: apiListInventory });
}
export function useMovements(materialId: string) {
  return useQuery({ queryKey: inventoryKeys.movements(materialId), queryFn: () => apiListMovements(materialId), enabled: !!materialId });
}
export function useAddMovement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ materialId, mov }: { materialId: string; mov: Omit<Movement, "id" | "data"> & { quantidade: number } }) => apiAddMovement(materialId, mov),
    onSuccess: async (_data, variables) => {
      await Promise.all([
        qc.invalidateQueries({ queryKey: inventoryKeys.root }),
        qc.invalidateQueries({ queryKey: inventoryKeys.movements(variables.materialId) }),
      ]);
    },
  });
}

export const obrasOptions = ["Todas as obras", "Residencial Vista Verde", "Edifício Central"] as const;
export const categoriaOptions = ["Todos", "Cimento", "Agregados", "Ferro/Aço", "Blocos", "Outros"] as const;
