import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { MapWork } from './useMapData';
import { supabase } from '@/integrations/supabase/client';
import 'leaflet/dist/leaflet.css';
import '@/styles/map.css';

// Fix Leaflet default icon path issues
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface UseMapProps {
  containerId: string;
  works: MapWork[];
  onMarkerClick?: (workId: string) => void;
  is3D?: boolean;
}

export function useMap({ containerId, works, onMarkerClick, is3D = false }: UseMapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [mapboxToken, setMapboxToken] = useState<string | null>(null);

  // Fetch Mapbox token from edge function
  useEffect(() => {
    const fetchMapboxToken = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('mapbox-token');
        if (error) throw error;
        setMapboxToken(data.token);
      } catch (err) {
        console.warn('Could not fetch Mapbox token, using fallback map:', err);
        setMapboxToken('fallback'); // Use fallback map without Mapbox
      }
    };
    fetchMapboxToken();
  }, []);

  useEffect(() => {
    const container = document.getElementById(containerId);
    if (!container || !mapboxToken) return;

    try {
      // Initialize map
      mapRef.current = L.map(container, {
        center: [-14.2350, -51.9253], // Centro do Brasil
        zoom: 5, // Zoom inicial maior
        minZoom: 2, // Permite ver mais do mapa mundial
        maxZoom: 18, // Mantém zoom máximo para detalhes
        wheelPxPerZoomLevel: 100, // Torna o zoom mais suave
        maxBounds: [
          [-60, -180], // Limite sul em -60 (abaixo da Antártida)
          [60, 180]    // Limite norte em 60 (acima da Rússia/Canadá)
        ],
        maxBoundsViscosity: 0.8 // Força moderada para manter dentro dos limites
      });

      // Add map layer - use Mapbox if token available, otherwise fallback
      if (mapboxToken && mapboxToken !== 'fallback') {
        // Use Mapbox tiles with token
        L.tileLayer(`https://api.mapbox.com/styles/v1/mapbox/light-v11/tiles/{z}/{x}/{y}?access_token=${mapboxToken}`, {
          attribution: '&copy; <a href="https://www.mapbox.com/">Mapbox</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          tileSize: 512,
          zoomOffset: -1
        }).addTo(mapRef.current);
      } else {
        // Fallback to OpenStreetMap
        L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
          subdomains: 'abcd'
        }).addTo(mapRef.current);
      }

      // If 3D is enabled, add terrain layer (optional, requires additional setup)
      if (is3D) {
        // Note: True 3D is limited in Leaflet, but we can simulate some depth
        mapRef.current.setView([-14.2350, -51.9253], 4, {
          animate: true,
          duration: 1
        });
      }

      // Add markers
      works.forEach((work) => {
        // Create custom icon based on progress
        const isActive = work.progresso > 0 && work.progresso < 100;
        const icon = L.divIcon({
          className: 'custom-div-icon',
          html: `
            <div class="map-marker ${isActive ? 'active' : ''}">
              ${work.progresso}%
            </div>
          `,
          iconSize: [40, 40],
          iconAnchor: [20, 20]
        });

        const marker = L.marker([work.coords[1], work.coords[0]], { icon })
          .addTo(mapRef.current!);

        // Add popup
        marker.bindPopup(`
          <div class="map-popup">
            <div class="map-popup-header">
              <div class="map-popup-icon">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M20 9v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V9"/>
                  <path d="M9 22V12h6v10"/>
                  <path d="M2 10.6L12 2l10 8.6"/>
                </svg>
              </div>
              <div class="map-popup-info">
                <div class="map-popup-title">${work.nome}</div>
                <div class="map-popup-subtitle">
                  ${getStatusText(work.progresso)}
                </div>
              </div>
            </div>

            <div class="map-popup-progress">
              <div 
                class="map-popup-progress-fill" 
                style="width: ${work.progresso}%; background-color: ${getMarkerColor(work.progresso)}"
              ></div>
            </div>

            <div class="map-popup-status">
              <div class="map-popup-status-text">Progresso da obra</div>
              <div class="map-popup-percentage">${work.progresso}%</div>
            </div>

            <button 
              id="goto-${work.id}" 
              class="map-popup-button"
              onclick="window.dispatchEvent(new CustomEvent('markerClick', { detail: '${work.id}' }))"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="m9 18 6-6-6-6"/>
              </svg>
              Ver detalhes da obra
            </button>
          </div>
        `, {
          closeButton: true,
          className: 'custom-popup'
        });

        markersRef.current.push(marker);
      });

      setIsLoaded(true);

    } catch (err) {
      setError(err as Error);
    }

    return () => {
      if (mapRef.current) {
        markersRef.current.forEach(marker => marker.remove());
        mapRef.current.remove();
      }
    };
  }, [containerId, works, is3D, mapboxToken]);

  const getMarkerColor = (progress: number): string => {
    if (progress <= 30) return '#f59e0b';
    if (progress >= 80) return '#10b981';
    return '#3b82f6';
  };

  const getStatusText = (progress: number): string => {
    if (progress <= 30) return 'Obra em fase inicial';
    if (progress >= 80) return 'Obra em fase final';
    return 'Obra em andamento';
  };

  // Add event listener for marker clicks
  useEffect(() => {
    if (!onMarkerClick) return;

    const handler = (e: CustomEvent<string>) => {
      onMarkerClick(e.detail);
    };

    window.addEventListener('markerClick', handler as EventListener);
    return () => window.removeEventListener('markerClick', handler as EventListener);
  }, [onMarkerClick]);

  return {
    map: mapRef.current,
    isLoaded,
    error
  };
}
