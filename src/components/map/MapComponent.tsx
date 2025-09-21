import React, { useEffect, useRef, useState, useCallback } from 'react';
import maplibregl from 'maplibre-gl';
import useMapStore from '@/store/useMapStore';
import { WorkItem } from '@/types/map';
import { MapControls } from './MapControls';
import { PopupCard } from './PopupCard';
import { MapFallback } from './MapFallback';
import { useMapData } from '@/features/map/hooks/useMapData';
import '@/styles/maplibre.css';

interface MapComponentProps {
  className?: string;
}

export function MapComponent({ className = '' }: MapComponentProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const markers = useRef<Map<string, maplibregl.Marker>>(new Map());
  const popup = useRef<maplibregl.Popup | null>(null);
  
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
  const { works: supabaseWorks, isLoading: isLoadingData } = useMapData({ 
    scopeFilter: 'todas' 
  });

  // Transform Supabase data to WorkItem format
  const works: WorkItem[] = supabaseWorks.map(obra => ({
    id: obra.id,
    name: obra.nome,
    description: `Obra ${obra.status || 'em andamento'}`,
    status: getWorkStatus(obra.progresso),
    progress: obra.progresso,
    coordinates: obra.coords,
    address: obra.endereco || 'Endereço não informado',
    startedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }));

  // Helper function to convert progress to status
  function getWorkStatus(progress: number): WorkItem['status'] {
    if (progress <= 30) return 'Initial';
    if (progress >= 80) return 'Advanced';
    return 'InProgress';
  }

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    try {
      map.current = new maplibregl.Map({
        container: mapContainer.current,
        style: 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json',
        center: [-51.9253, -14.2350], // Centro do Brasil
        zoom: 4,
        pitch: viewMode === '3D' ? 45 : 0,
        bearing: viewMode === '3D' ? -17.6 : 0,
      });

      map.current.addControl(new maplibregl.NavigationControl(), 'top-right');
      map.current.addControl(new maplibregl.FullscreenControl(), 'top-right');

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

    return () => {
      markers.current.forEach(marker => marker.remove());
      markers.current.clear();
      if (popup.current) {
        popup.current.remove();
        popup.current = null;
      }
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  // Add 3D buildings layer
  const addBuildingsLayer = useCallback(() => {
    if (!map.current) return;

    try {
      map.current.addSource('openmaptiles', {
        type: 'vector',
        url: 'https://api.maptiler.com/tiles/v3/tiles.json?key=demo'
      });

      map.current.addLayer({
        id: 'buildings-3d',
        source: 'openmaptiles',
        'source-layer': 'building',
        type: 'fill-extrusion',
        paint: {
          'fill-extrusion-color': '#aaa',
          'fill-extrusion-height': ['get', 'render_height'],
          'fill-extrusion-base': ['get', 'render_min_height'],
          'fill-extrusion-opacity': layers.opacity.buildings3D,
        }
      });
    } catch (err) {
      console.warn('Could not add buildings layer:', err);
    }
  }, [layers.opacity.buildings3D]);

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
  }, [filteredWorks, layers.markers]);

  // Add single marker
  const addMarker = useCallback((work: WorkItem) => {
    if (!map.current) return;

    const el = document.createElement('div');
    el.className = `custom-marker status-${work.status} marker-enter`;
    el.innerHTML = `
      ${work.progress}%
      <div class="marker-hover-label">${work.name}</div>
    `;
    
    // Accessibility
    el.setAttribute('role', 'button');
    el.setAttribute('tabindex', '0');
    el.setAttribute('aria-label', `Obra ${work.name}, ${work.progress}% concluída, status: ${work.status}`);
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
  }, [selectedWorkId]);

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
    import('react-dom/client').then(({ createRoot }) => {
      const root = createRoot(popupContainer);
      root.render(
        <PopupCard 
          work={work} 
          onClose={() => {
            if (popup.current) {
              popup.current.remove();
              popup.current = null;
            }
            selectWork(null);
          }}
          onTrack={() => trackWork(work)}
          onViewDetails={() => viewDetails(work)}
        />
      );
    });

    popup.current.on('close', () => {
      selectWork(null);
    });
  }, [selectWork]);

  // Track work (highlight for 5s)
  const trackWork = useCallback((work: WorkItem) => {
    const marker = markers.current.get(work.id);
    if (marker) {
      const el = marker.getElement();
      el.classList.add('selected');
      
      setTimeout(() => {
        el.classList.remove('selected');
      }, 5000);
    }
  }, []);

  // View details (stub)
  const viewDetails = useCallback((work: WorkItem) => {
    console.log('View details:', work);
  }, []);

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
  }, [viewMode]);

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