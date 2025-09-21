export type WorkStatus = 'Initial' | 'InProgress' | 'Advanced';

export interface WorkItem {
  id: string;
  name: string;
  description?: string;
  status: WorkStatus;
  progress: number; // 0..100
  coordinates: [number, number]; // [lng, lat]
  address?: string;
  startedAt?: string; // ISO
  updatedAt?: string; // ISO
  images?: string[];
  meta?: Record<string, unknown>;
}

export interface MapState {
  viewMode: '2D' | '3D';
  filters: { statuses: WorkStatus[] };
  layers: { 
    buildings3D: boolean; 
    markers: boolean; 
    heatmap: boolean; 
    opacity: Record<string, number> 
  };
  search: string;
  selectedWorkId?: string | null;
  isPanelOpen: boolean;

  setViewMode(mode: '2D' | '3D'): void;
  toggleStatus(status: WorkStatus): void;
  setSearch(q: string): void;
  toggleLayer(layer: keyof MapState['layers']): void;
  setLayerOpacity(layer: keyof MapState['layers']['opacity'], value: number): void;
  selectWork(id?: string | null): void;
  setPanelOpen(open: boolean): void;
  hydrateFromStorage(): void;
  persistToStorage(): void;
}