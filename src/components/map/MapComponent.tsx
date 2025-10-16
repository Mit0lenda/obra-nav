import React, { useEffect, useRef, useState, useCallback } from 'react';
import maplibregl from 'maplibre-gl';
import type { StyleSpecification } from 'maplibre-gl';
import { createRoot, type Root } from 'react-dom/client';
import { useNavigate } from 'react-router-dom';
import useMapStore from '@/store/useMapStore';
import { WorkItem } from '@/types/map';
import { MapControls } from './MapControls';
import { PopupCard } from './PopupCard';
import { MapFallback } from './MapFallback';
import { useObras } from '@/integrations/supabase/hooks/useObras';
import '@/styles/maplibre.css';

interface MapComponentProps {
  className?: string;
}

export function MapComponent({ className = '' }: MapComponentProps) {
  const navigate = useNavigate();
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const markers = useRef<Map<string, maplibregl.Marker>>(new Map());
  const popup = useRef<maplibregl.Popup | null>(null);
  const popupRootRef = useRef<Root | null>(null);
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [filteredWorks, setFilteredWorks] = useState<WorkItem[]>([]);
  
  const { 
    viewMode, 
    filters, 
    layers, 
    search, 
    selectedWorkId, 
    selectWork,
    hydrateFromStorage 
  } = useMapStore();

  // Get real data from Supabase
  const { data: supabaseWorks = [], isLoading: isLoadingData } = useObras();

  // Transform Supabase data to WorkItem format
  const works: WorkItem[] = supabaseWorks
    .filter(obra => obra.latitude && obra.longitude) // SÃ³ obras com coordenadas
    .map(obra => ({
      id: obra.id,
      name: obra.nome,
      description: obra.endereco || 'Endereço não informado',
      status: getWorkStatus(obra.status),
      progress: getProgressFromStatus(obra.status),
      coordinates: [obra.longitude!, obra.latitude!] as [number, number],
      address: obra.endereco || 'Endereço não informado',
      startedAt: obra.data_inicio || new Date().toISOString(),
      updatedAt: obra.updated_at || new Date().toISOString(),
    }));

  // Helper function to convert status to WorkItem status
  function getWorkStatus(status: string | null): WorkItem['status'] {
    switch (status) {
      case 'concluida': return 'Advanced';
      case 'em_andamento': return 'InProgress';
      case 'pausada': return 'Initial';
      case 'cancelada': return 'Initial';
      default: return 'Initial';
    }
  }

  // Helper function to get progress percentage from status
  function getProgressFromStatus(status: string | null): number {
    switch (status) {
      case 'concluida': return 100;
      case 'em_andamento': return 60;
      case 'pausada': return 30;
      case 'cancelada': return 0;
      default: return 20;
    }
  }

  // Prepare free map style (env-driven with safe default)
  const mapStyle: StyleSpecification | string = React.useMemo(() => (
    import.meta.env.VITE_MAP_STYLE_URL || ({
      version: 8,
      sources: {
        osm: {
          type: 'raster',
          tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
          tileSize: 256,
          attribution: '© OpenStreetMap contributors',
        },
      },
      layers: [
        { id: 'osm', type: 'raster', source: 'osm' },
      ],
    } as StyleSpecification)
  ), []);

  // Add 3D buildings layer
  const addBuildingsLayer = useCallback(() => {
    if (!map.current) return;

    try {
      // Reuse the style's existing vector source for buildings
      const style = map.current.getStyle?.();
      const existingBuildingLayer = style?.layers?.find((l) => {
        const layer = l as Record<string, unknown>;
        const sourceLayerVal = (layer["source-layer"] ?? layer["sourceLayer"]) as unknown;
        const sourceVal = layer["source"] as unknown;
        return sourceLayerVal === 'building' && typeof sourceVal === 'string';
      }) as unknown;

      const sourceId = (existingBuildingLayer as { source?: string } | undefined)?.source;
      if (!sourceId) {
        console.warn('No building source found in current style; skipping 3D buildings.');
        return;
      }

      if (map.current.getLayer('buildings-3d')) {
        return; // already added
      }

      map.current.addLayer({
        id: 'buildings-3d',
        source: sourceId,
        'source-layer': 'building',
        type: 'fill-extrusion',
        paint: {
          'fill-extrusion-color': '#aaa',
          'fill-extrusion-height': ['case', ['has', 'height'], ['get', 'height'], 10],
          'fill-extrusion-base': ['case', ['has', 'min_height'], ['get', 'min_height'], 0],
          'fill-extrusion-opacity': layers.opacity.buildings3D,
        }
      });
    } catch (err) {
      console.warn('Could not add buildings layer:', err);
    }
  }, [layers.opacity.buildings3D]);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    try {
      map.current = new maplibregl.Map({
        container: mapContainer.current,
        style: mapStyle,
        center: [-51.9253, -14.2350], // Centro do Brasil
        zoom: 4,
        pitch: viewMode === '3D' ? 45 : 0,
        bearing: viewMode === '3D' ? -17.6 : 0,
      });

      map.current.addControl(new maplibregl.NavigationControl(), 'top-right');

      map.current.on('load', () => {
        setIsLoading(false);
        addBuildingsLayer();
      });

      map.current.on('error', (e) => {
        setError(new Error(e.error.message));
        setIsLoading(false);
      });

    } catch (err) {
      setError(err as Error);
      setIsLoading(false);
    }

    // Hydrate preferences on mount
    hydrateFromStorage();

    // Store current markers reference for cleanup
    const currentMarkers = markers.current;
    return () => {
      currentMarkers.forEach(marker => marker.remove());
      currentMarkers.clear();
      if (popup.current) {
        popup.current.remove();
        popup.current = null;
      }
      if (popupRootRef.current) {
        popupRootRef.current.unmount();
        popupRootRef.current = null;
      }
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [addBuildingsLayer, hydrateFromStorage, viewMode, mapStyle]);

  // Toggle 2D/3D view
  useEffect(() => {
    if (!map.current) return;

    const targetPitch = viewMode === '3D' ? 45 : 0;
    const targetBearing = viewMode === '3D' ? -17.6 : 0;

    map.current.easeTo({
      pitch: targetPitch,
      bearing: targetBearing,
      duration: 1000,
    });
  }, [viewMode]);

  // Update buildings layer visibility and opacity
  useEffect(() => {
    if (!map.current) return;

    const layerId = 'buildings-3d';
    if (map.current.getLayer(layerId)) {
      map.current.setLayoutProperty(
        layerId,
        'visibility',
        layers.buildings3D ? 'visible' : 'none'
      );
      
      map.current.setPaintProperty(
        layerId,
        'fill-extrusion-opacity',
        layers.opacity.buildings3D
      );
    }
  }, [layers.buildings3D, layers.opacity.buildings3D]);

  // Filter and search works
  useEffect(() => {
    let filtered = works.filter(work => 
      filters.statuses.includes(work.status)
    );

    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(work =>
        work.name.toLowerCase().includes(searchLower) ||
        work.id.toLowerCase().includes(searchLower) ||
        work.address?.toLowerCase().includes(searchLower)
      );
    }

    setFilteredWorks(filtered);
  }, [works, filters.statuses, search]);

  // Track work (center map and highlight)
  const trackWork = useCallback((work: WorkItem) => {
    if (!map.current) return;

    // Center map on the work location
    map.current.flyTo({
      center: work.coordinates,
      zoom: 15,
      duration: 2000
    });

    // Highlight marker
    const marker = markers.current.get(work.id);
    if (marker) {
      const el = marker.getElement();
      el.classList.add('selected');
      
      setTimeout(() => {
        el.classList.remove('selected');
      }, 5000);
    }
  }, []);

  // View details (open Projects page with selected obra)
  const viewDetails = useCallback((work: WorkItem) => {
    navigate(`/projects?obra=${work.id}`);
  }, [navigate]);

  // Show popup
  const showPopup = useCallback((work: WorkItem) => {
    if (!map.current) return;

    selectWork(work.id);

    // Remove existing popup
    if (popup.current) {
      popup.current.remove();
    }

    const popupContainer = document.createElement('div');
    
    popup.current = new maplibregl.Popup({
      closeButton: true,
      closeOnClick: false,
      maxWidth: 'none',
    })
      .setLngLat(work.coordinates)
      .setDOMContent(popupContainer)
      .addTo(map.current);

    // Render React component into popup
    const root = createRoot(popupContainer);
    popupRootRef.current = root;
    root.render(
      <PopupCard 
        work={work} 
        onClose={() => {
          if (popup.current) {
            popup.current.remove();
            popup.current = null;
          }
          if (popupRootRef.current) {
            popupRootRef.current.unmount();
            popupRootRef.current = null;
          }
          selectWork(null);
        }}
        onTrack={() => trackWork(work)}
        onViewDetails={() => viewDetails(work)}
      />
    );

    popup.current.on('close', () => {
      if (popupRootRef.current) {
        popupRootRef.current.unmount();
        popupRootRef.current = null;
      }
      selectWork(null);
    });
  }, [selectWork, trackWork, viewDetails]);

  // Fly and open popup when a work is selected from controls
  useEffect(() => {
    if (!map.current || !selectedWorkId) return;
    const work = filteredWorks.find(w => w.id === selectedWorkId) ||
                 works.find(w => w.id === selectedWorkId);
    if (work) {
      map.current.flyTo({ center: work.coordinates, zoom: 15, duration: 1200 });
      // Small delay to ensure map is centered before popup
      setTimeout(() => showPopup(work), 200);
    }
  }, [selectedWorkId, filteredWorks, works, showPopup]);

  // Add single marker
  const addMarker = useCallback((work: WorkItem) => {
    if (!map.current) return;

    const el = document.createElement('div');
    el.className = `custom-marker status-${work.status} marker-enter`;
    
    // Criar ícone baseado no status
    const getStatusIcon = (status: WorkItem['status']) => {
      switch (status) {
        case 'Advanced': return '??';
        case 'InProgress': return '??';
        case 'Initial': return '??';
        default: return '?';
      }
    };

    const getStatusText = (status: WorkItem['status']) => {
      switch (status) {
        case 'Advanced': return '??';
        case 'InProgress': return '??';
        case 'Initial': return '??';
        default: return 'Status desconhecido';
      }
    };
    
    el.innerHTML = `
      <div class="marker-icon">${getStatusIcon(work.status)}</div>
      <div class="marker-hover-label">
        <div class="font-semibold">${work.name}</div>
        <div class="text-xs text-muted-foreground">${getStatusText(work.status)}</div>
        <div class="text-xs">${work.address}</div>
      </div>
    `;
    
    // Accessibility
    el.setAttribute('role', 'button');
    el.setAttribute('tabindex', '0');
    el.setAttribute('aria-label', `Obra ${work.name}, ${getStatusText(work.status)}`);
    el.setAttribute('aria-describedby', `marker-${work.id}`);

    // Click and keyboard handlers
    const handleInteraction = (e: Event) => {
      e.stopPropagation();
      showPopup(work);
    };

    el.addEventListener('click', handleInteraction);
    el.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleInteraction(e);
      }
    });

    const marker = new maplibregl.Marker({ element: el })
      .setLngLat(work.coordinates)
      .addTo(map.current);

    markers.current.set(work.id, marker);

    // Update selected state
    if (selectedWorkId === work.id) {
      el.classList.add('selected');
    }
  }, [selectedWorkId, showPopup]);

  // Update markers
  useEffect(() => {
    if (!map.current || !layers.markers) return;

    // Remove existing markers
    markers.current.forEach(marker => marker.remove());
    markers.current.clear();

    // Add filtered markers with animation
    filteredWorks.forEach((work, index) => {
      setTimeout(() => {
        addMarker(work);
      }, index * 50); // Staggered animation
    });
  }, [filteredWorks, layers.markers, addMarker]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeydown = (e: KeyboardEvent) => {
      // Only handle shortcuts when not focused on input elements
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      switch (e.key.toLowerCase()) {
        case 't':
          useMapStore.getState().setViewMode(viewMode === '2D' ? '3D' : '2D');
          break;
        case 'f':
          useMapStore.getState().setPanelOpen(!useMapStore.getState().isPanelOpen);
          break;
        case '?':
          // TODO: Show help modal
          console.log('Keyboard shortcuts: T = Toggle 2D/3D, F = Toggle panel, ? = Help');
          break;
        case 'escape':
          if (popup.current) {
            popup.current.remove();
            popup.current = null;
            selectWork(null);
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeydown);
    return () => document.removeEventListener('keydown', handleKeydown);
  }, [viewMode, selectWork]);

  if (error) {
    return (
      <MapFallback 
        error={error} 
        works={filteredWorks}
        onRetry={() => {
          setError(null);
          setIsLoading(true);
          // Reload map
          if (map.current) {
            map.current.remove();
            map.current = null;
          }
        }}
      />
    );
  }

  return (
    <div className={`relative h-full w-full ${className}`}>
      {isLoading && (
        <div className="map-loading-overlay">
          <div className="flex flex-col items-center gap-4">
            <div className="map-loading-spinner" />
            <p className="text-muted-foreground">Carregando mapa...</p>
          </div>
        </div>
      )}
      
      <div 
        ref={mapContainer} 
        className="h-full w-full"
        role="application"
        aria-label="Mapa interativo das obras"
      />
      
      <MapControls works={filteredWorks} />
      
      {/* Screen reader announcements */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {filteredWorks.length > 0 && 
          `${filteredWorks.length} obras encontradas no mapa`
        }
      </div>
    </div>
  );
}


