import PageHeader from "@/components/shared/PageHeader";
import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { mockMapWorks } from "@/data/mockMap";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, ExternalLink } from "lucide-react";
import { useObraScope } from "@/app/obraScope";

export default function MapPage() {
  const ref = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const navigate = useNavigate();
  const [hasMapToken, setHasMapToken] = useState(false);
  const { obra: obraScope } = useObraScope();

  // Filter works by obra scope
  const filteredWorks = obraScope === "todas" 
    ? mockMapWorks 
    : mockMapWorks.filter(w => w.nome === obraScope);

  useEffect(() => {
    if (!ref.current) return;
    
    const token = process.env.MAPBOX_ACCESS_TOKEN || "MAPBOX_TOKEN_AQUI";
    
    try {
      mapboxgl.accessToken = token;
      setHasMapToken(true);
      
      mapRef.current = new mapboxgl.Map({
        container: ref.current,
        style: "mapbox://styles/mapbox/light-v11",
        center: [-51.9253, -14.2350],
        zoom: 3.2,
      });

      mapRef.current.on('load', () => {
        filteredWorks.forEach((w) => {
          // Color by progress status
          const markerColor = w.progresso <= 30 ? "#f59e0b" : w.progresso >= 80 ? "#10b981" : "#3b82f6";
          
          const popup = new mapboxgl.Popup({ offset: 8 }).setHTML(`
            <div class="space-y-1">
              <div class="font-medium">${w.nome}</div>
              <div class="text-sm text-muted-foreground">Andamento: ${w.progresso}%</div>
              <button id="goto-${w.id}" class="text-sm underline story-link">Ver detalhes</button>
            </div>
          `);
          
          const marker = new mapboxgl.Marker({ color: markerColor })
            .setLngLat(w.coords)
            .setPopup(popup)
            .addTo(mapRef.current!);
            
          marker.getElement().setAttribute('title', w.nome);
          marker.getElement().setAttribute('aria-label', `Obra ${w.nome}, progresso ${w.progresso}%`);
          
          // Navigate on popup button click
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
      setHasMapToken(false);
    }

    return () => {
      mapRef.current?.remove();
    };
  }, [navigate, filteredWorks]);

  return (
    <div className="space-y-4">
      <PageHeader 
        title="Mapa das Obras" 
        subtitle={`Visualize obras no mapa ${obraScope !== "todas" ? `(Escopo: ${obraScope})` : ""}`} 
      />
      
      {hasMapToken ? (
        <div ref={ref} className="h-[70vh] w-full rounded-lg border" />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Mapa indisponível
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Token do Mapbox não configurado. Aqui estão as obras disponíveis:
            </p>
            <div className="grid gap-3">
              {filteredWorks.map((w) => {
                const statusColor = w.progresso <= 30 ? "warning" : w.progresso >= 80 ? "success" : "default";
                return (
                  <div key={w.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <h3 className="font-medium">{w.nome}</h3>
                      <p className="text-sm text-muted-foreground">
                        Coords: {w.coords[1].toFixed(4)}, {w.coords[0].toFixed(4)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={statusColor as any}>{w.progresso}%</Badge>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => navigate('/projects')}
                        aria-label={`Ver detalhes da obra ${w.nome}`}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
