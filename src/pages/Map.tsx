import PageHeader from "@/components/shared/PageHeader";
import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { mockMapWorks } from "@/data/mockMap";
import { useNavigate } from "react-router-dom";

export default function MapPage() {
  const ref = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!ref.current) return;
    try {
      mapboxgl.accessToken = "MAPBOX_TOKEN_AQUI";
      mapRef.current = new mapboxgl.Map({
        container: ref.current,
        style: "mapbox://styles/mapbox/light-v11",
        center: [-51.9253, -14.2350],
        zoom: 3.2,
      });

      mapRef.current.on('load', () => {
        mockMapWorks.forEach((w) => {
          const popup = new mapboxgl.Popup({ offset: 8 }).setHTML(`
            <div class="space-y-1">
              <div class="font-medium">${w.nome}</div>
              <div class="text-sm text-muted-foreground">Andamento: ${w.progresso}%</div>
              <button id="goto-${w.id}" class="text-sm underline story-link">Ver detalhes</button>
            </div>
          `);
          const marker = new mapboxgl.Marker().setLngLat(w.coords).setPopup(popup).addTo(mapRef.current!);
          marker.getElement().setAttribute('title', w.nome);
          // delegar clique no popup para navegar
          popup.on('open', () => {
            const btn = document.getElementById(`goto-${w.id}`);
            btn?.addEventListener('click', (e) => {
              e.preventDefault();
              navigate('/projects');
            });
          });
        });
      });
    } catch (_e) {
      // falha de token/instância
    }

    return () => {
      mapRef.current?.remove();
    };
  }, [navigate]);

  return (
    <div className="space-y-4">
      <PageHeader title="Mapa das Obras" subtitle="Visualize obras no mapa" />
      <div ref={ref} className="h-[70vh] w-full rounded-lg border" />
      {!mapRef.current && (
        <div className="text-sm text-muted-foreground">Não foi possível inicializar o mapa (token ausente). Exiba um token válido para ver os marcadores.</div>
      )}
    </div>
  );
}
