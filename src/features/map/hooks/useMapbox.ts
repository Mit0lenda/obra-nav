import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { MapWork } from '@/data/mockMap';
import 'leaflet/dist/leaflet.css';

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

  useEffect(() => {
    const container = document.getElementById(containerId);
    if (!container) return;

    try {
      // Initialize map
      mapRef.current = L.map(container).setView([-14.2350, -51.9253], 4);

      // Add OpenStreetMap tile layer
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(mapRef.current);

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
        const icon = L.divIcon({
          className: 'custom-div-icon',
          html: `<div style="
            background-color: ${getMarkerColor(work.progresso)};
            width: 30px;
            height: 30px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: bold;
            border: 2px solid white;
            box-shadow: 0 2px 4px rgba(0,0,0,0.3);
          ">${work.progresso}%</div>`,
          iconSize: [30, 30],
          iconAnchor: [15, 15]
        });

        const marker = L.marker([work.coords[1], work.coords[0]], { icon })
          .addTo(mapRef.current!);

        // Add popup
        marker.bindPopup(`
          <div class="space-y-1">
            <div class="font-medium">${work.nome}</div>
            <div class="text-sm text-muted-foreground">Andamento: ${work.progresso}%</div>
            <button 
              id="goto-${work.id}" 
              class="text-sm underline story-link"
              onclick="window.dispatchEvent(new CustomEvent('markerClick', { detail: '${work.id}' }))"
            >
              Ver detalhes
            </button>
          </div>
        `);

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
  }, [containerId, works, is3D]);

  const getMarkerColor = (progress: number): string => {
    if (progress <= 30) return '#f59e0b';
    if (progress >= 80) return '#10b981';
    return '#3b82f6';
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
