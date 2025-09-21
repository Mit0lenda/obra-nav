import { create } from 'zustand';
import { MapState, WorkStatus } from '@/types/map';

const STORAGE_KEY = 'map-preferences';

const useMapStore = create<MapState>((set, get) => ({
  viewMode: '2D',
  filters: { statuses: ['Initial', 'InProgress', 'Advanced'] },
  layers: { 
    buildings3D: true, 
    markers: true, 
    heatmap: false,
    opacity: { buildings3D: 0.8, markers: 1.0, heatmap: 0.6 }
  },
  search: '',
  selectedWorkId: null,
  isPanelOpen: true,

  setViewMode: (mode) => {
    set({ viewMode: mode });
    get().persistToStorage();
  },

  toggleStatus: (status) => {
    const { filters } = get();
    const newStatuses = filters.statuses.includes(status)
      ? filters.statuses.filter(s => s !== status)
      : [...filters.statuses, status];
    
    set({ filters: { statuses: newStatuses } });
    get().persistToStorage();
  },

  setSearch: (search) => {
    set({ search });
  },

  toggleLayer: (layer) => {
    const { layers } = get();
    if (layer === 'opacity') return;
    
    set({ 
      layers: { 
        ...layers, 
        [layer]: !layers[layer as keyof Omit<typeof layers, 'opacity'>] 
      } 
    });
    get().persistToStorage();
  },

  setLayerOpacity: (layer, value) => {
    const { layers } = get();
    set({ 
      layers: { 
        ...layers, 
        opacity: { ...layers.opacity, [layer]: value } 
      } 
    });
    get().persistToStorage();
  },

  selectWork: (id) => {
    set({ selectedWorkId: id });
  },

  setPanelOpen: (open) => {
    set({ isPanelOpen: open });
    get().persistToStorage();
  },

  hydrateFromStorage: () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        set(state => ({
          ...state,
          ...data,
          // Always reset search on load
          search: ''
        }));
      }
    } catch (error) {
      console.warn('Failed to hydrate map preferences:', error);
    }
  },

  persistToStorage: () => {
    try {
      const { search, selectedWorkId, ...persistData } = get();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(persistData));
    } catch (error) {
      console.warn('Failed to persist map preferences:', error);
    }
  },
}));

export default useMapStore;