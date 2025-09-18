import { useCallback } from 'react';
import PageHeader from "@/components/shared/PageHeader";
import { useNavigate } from "react-router-dom";
import { useObraScope } from "@/app/obraScope";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useMap } from '../features/map/hooks/useOpenStreetMap';
import { useMapData } from '../features/map/hooks/useMapData';
import { MapError } from '../features/map/components/MapError';
import { MapFallback } from '../features/map/components/MapFallback';
import "leaflet/dist/leaflet.css";

export default function MapPage() {
  const navigate = useNavigate();
  const { obra: obraScope } = useObraScope();
  
  // Get filtered map data from Supabase
  const { works, isLoading } = useMapData({
    scopeFilter: obraScope
  });

  // Handle marker clicks
  const handleMarkerClick = useCallback((workId: string) => {
    navigate('/obras-em-andamento');
  }, [navigate]);

  // Initialize map
  const { error } = useMap({
    containerId: 'map-container',
    works,
    onMarkerClick: handleMarkerClick
  });

  if (error) {
    return <MapError error={error} works={works} onProjectClick={() => navigate('/projects')} />;
  }

  return (
    <div className="space-y-4">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <PageHeader 
            title="Mapa das Obras" 
            subtitle={`Visualize obras no mapa ${obraScope !== "todas" ? `(Escopo: ${obraScope})` : ""}`} 
          />
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                Em andamento
              </span>
              <span className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-green-500" />
                Concluído
              </span>
              <span className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-blue-500" />
                Em planejamento
              </span>
            </div>
          </div>
        </div>
        
        {isLoading ? (
          <Card>
            <CardContent className="p-6">
              <Skeleton className="h-[70vh] w-full" />
            </CardContent>
          </Card>
        ) : works.length > 0 ? (
          <Card>
            <CardContent className="p-1">
              <div 
                id="map-container" 
                className="h-[70vh] w-full rounded-lg overflow-hidden relative" 
              />
            </CardContent>
          </Card>
        ) : (
          <MapFallback />
        )}

        {works.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {works.slice(0, 3).map((work) => (
              <Card key={work.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className="flex-1 space-y-1">
                      <h3 className="font-medium">{work.nome}</h3>
                      <div className="text-sm text-muted-foreground">
                        Progresso: {work.progresso}%
                      </div>
                      <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary transition-all" 
                          style={{ width: `${work.progresso}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
